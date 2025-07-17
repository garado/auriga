/**
 * █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █   █▀▀ █░█ ▄▀█ ▀█▀
 * █▄█ ██▄ █░▀░█ █ █░▀█ █   █▄▄ █▀█ █▀█ ░█░
 *
 * Interactive chat widget for communicating with Google Gemini AI.
 * Features syntax highlighting, markdown rendering, and real-time responses.
 *
 * UI inspiration from kotontrion's ChatGPT widget (unixporn discord).
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk, Widget } from "astal/gtk4";

import { CustomSourceView } from "@/components/CustomSourceView";
import GeminiService, {
  ConversationType,
  ConversationData,
} from "@/services/Gemini";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const geminiService = GeminiService.get_default();

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  gemini: "gemini",
  speaker: "speaker",
  userSpeaker: "user",
  geminiSpeaker: "gemini",
  content: "content",
  promptEntry: "prompt-entry",
} as const;

const UI_LABELS = {
  userDisplayName: "Alexis",
  aiDisplayName: "Gemini",
  thinkingMessage: "Thinking...",
} as const;

const LAYOUT = {
  conversationSpacing: 10,
} as const;

const KEYBOARD = {
  enterKey: Gdk.KEY_Return,
  keypadEnterKey: Gdk.KEY_KP_Enter,
  shiftModifier: Gdk.ModifierType.SHIFT_MASK,
} as const;

const MARKDOWN_CONFIG = {
  monospaceFonts: "Mononoki",
} as const;

/*****************************************************************************
 * Type definitions
 *****************************************************************************/

/** Interface for conversation piece properties */
interface ConversationPieceProps {
  id: number;
  text: string;
  conversationType: ConversationType;
}

/** Interface for tokenized response content */
interface ResponseToken {
  type: "text" | "code";
  content: string;
  language?: string;
}

/** Extended widget interface with custom methods */
interface ExtendedConversationWidget extends ReturnType<typeof Widget.Box> {
  setContent: (responseText: string) => void;
}

/*****************************************************************************
 * Utility functions
 *****************************************************************************/

/**
 * Converts markdown text to Pango markup for GTK rendering.
 * Handles headers, bold, italic, code blocks, and other formatting.
 * Based on end-4's excellent markdown converter implementation.
 * @param markdownText - Raw markdown text to convert
 * @returns Pango markup string
 */
const convertMarkdownToPangoMarkup = (markdownText: string): string => {
  const replacementRules = {
    indents: [
      { name: "BULLET", re: /^(\s*)([\*\-]\s)(.*)(\s*)$/, sub: " $1- $3" },
      { name: "NUMBERING", re: /^(\s*[0-9]+\.\s)(.*)(\s*)$/, sub: " $1 $2" },
    ],
    escapes: [
      { name: "COMMENT", re: /<!--.*-->/, sub: "" },
      { name: "AMPERSAND", re: /&/g, sub: "&amp;" },
      { name: "LESS_THAN", re: /</g, sub: "&lt;" },
      { name: "GREATER_THAN", re: />/g, sub: "&gt;" },
    ],
    sections: [
      {
        name: "H1",
        re: /^(#\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="170%">$2</span>',
      },
      {
        name: "H2",
        re: /^(##\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="150%">$2</span>',
      },
      {
        name: "H3",
        re: /^(###\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="125%">$2</span>',
      },
      {
        name: "H4",
        re: /^(####\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="100%">$2</span>',
      },
      {
        name: "H5",
        re: /^(#####\s+)(.*)(\s*)$/,
        sub: '<span font_weight="bold" size="90%">$2</span>',
      },
    ],
    styles: [
      { name: "BOLD", re: /(\*\*)(\S[\s\S]*?\S)(\*\*)/g, sub: "<b>$2</b>" },
      { name: "UNDERLINE", re: /(__)(\S[\s\S]*?\S)(__)/g, sub: "<u>$2</u>" },
      { name: "EMPHASIS", re: /\*(\S.*?\S)\*/g, sub: "<i>$1</i>" },
      {
        name: "HEX_COLOR",
        re: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g,
        sub: `<span bgcolor="#$1" fgcolor="#000000" font_family="${MARKDOWN_CONFIG.monospaceFonts}">#$1</span>`,
      },
      {
        name: "INLINE_CODE",
        re: /(`)([^`]*)(`)/g,
        sub: `<span font_weight="bold" font_family="${MARKDOWN_CONFIG.monospaceFonts}">$2</span>`,
      },
    ],
  };

  /**
   * Applies a category of replacement rules to text.
   * @param text - Text to process
   * @param replacements - Array of replacement rules
   * @returns Processed text
   */
  const applyReplacementCategory = (text: string, replacements: any[]) => {
    return replacements.reduce(
      (processedText, rule) => processedText.replace(rule.re, rule.sub),
      text,
    );
  };

  const lines = markdownText.split("\n");
  const processedLines = lines.map((line) => {
    let result = line;
    result = applyReplacementCategory(result, replacementRules.indents);
    result = applyReplacementCategory(result, replacementRules.escapes);
    result = applyReplacementCategory(result, replacementRules.sections);
    result = applyReplacementCategory(result, replacementRules.styles);
    return result.replace(/ +$/, ""); // Remove trailing whitespace
  });

  return processedLines.join("\n");
};

/**
 * Tokenizes a Gemini response to separate text and code blocks.
 * @param markdownResponse - Raw markdown response from Gemini
 * @returns Array of tokens representing different content types
 */
const tokenizeGeminiResponse = (markdownResponse: string): ResponseToken[] => {
  const tokens: ResponseToken[] = [];
  let remainingText = markdownResponse;
  let isProcessingCodeBlock = false;

  while (remainingText.length > 0) {
    const codeBlockMatch = remainingText.match(/```/);

    if (codeBlockMatch) {
      let language: string | undefined;

      if (isProcessingCodeBlock) {
        // Extract language from the opening code block
        const firstLine = remainingText.split(/\s+/)[0];
        language = firstLine;
        remainingText = remainingText.slice(language.length);
      }

      const contentEndIndex = isProcessingCodeBlock
        ? codeBlockMatch.index! - (language?.length || 0)
        : codeBlockMatch.index!;

      tokens.push({
        type: isProcessingCodeBlock ? "code" : "text",
        content: remainingText.substring(0, contentEndIndex),
        language: isProcessingCodeBlock ? language : undefined,
      });

      remainingText = remainingText.slice(
        tokens[tokens.length - 1].content.length + 3,
      );
    } else {
      // No more code blocks, add remaining text
      tokens.push({
        type: "text",
        content: remainingText,
      });
      remainingText = "";
    }

    isProcessingCodeBlock = !isProcessingCodeBlock;
  }

  return tokens;
};

/*****************************************************************************
 * Widget creation functions
 *****************************************************************************/

/**
 * Creates a speaker label for conversation pieces.
 * @param conversationType - Type of conversation (prompt or response)
 * @returns Widget containing speaker identification
 */
const createSpeakerLabel = (conversationType: ConversationType) => {
  const isUserMessage = conversationType === ConversationType.Prompt;

  return Widget.Label({
    cssClasses: [
      CSS_CLASSES.speaker,
      isUserMessage ? CSS_CLASSES.userSpeaker : CSS_CLASSES.geminiSpeaker,
    ],
    label: isUserMessage ? UI_LABELS.userDisplayName : UI_LABELS.aiDisplayName,
    xalign: 0,
  });
};

/**
 * Creates a content widget for a response token.
 * @param token - Token containing content and type information
 * @returns Widget appropriate for the token type
 */
const createTokenWidget = (token: ResponseToken) => {
  if (token.type === "code") {
    return CustomSourceView({
      code: token.content,
      lang: token.language!,
    });
  }

  if (token.type === "text") {
    return Widget.Label({
      label: convertMarkdownToPangoMarkup(token.content),
      cssClasses: [CSS_CLASSES.content],
      selectable: true,
      xalign: 0,
      wrap: true,
      useMarkup: true,
    });
  }

  // Fallback for unknown token types
  return Widget.Label({
    label: token.content,
    cssClasses: [CSS_CLASSES.content],
    selectable: true,
    xalign: 0,
    wrap: true,
  });
};

/**
 * Creates a conversation piece widget (prompt or response).
 * @param props - Properties for the conversation piece
 * @returns Extended widget with content update capability
 */
const createConversationPiece = (
  props: ConversationPieceProps,
): ExtendedConversationWidget => {
  const speakerLabel = createSpeakerLabel(props.conversationType);

  const contentContainer = Widget.Box({
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.content],
        selectable: true,
        useMarkup: true,
        label: props.text,
        xalign: 0,
        wrap: true,
      }),
    ],
  });

  const conversationWidget = Widget.Box({
    vertical: true,
    children: [speakerLabel, contentContainer],
  }) as ExtendedConversationWidget;

  /**
   * Updates the content of this conversation piece.
   * Primarily used for updating "Thinking..." to actual AI responses.
   * @param responseText - New content to display
   */
  conversationWidget.setContent = (responseText: string) => {
    // Clear existing content
    contentContainer.remove(contentContainer.children[0]);

    // Tokenize and render new content
    const tokens = tokenizeGeminiResponse(responseText);
    tokens.forEach((token) => {
      const tokenWidget = createTokenWidget(token);
      contentContainer.append(tokenWidget);
    });
  };

  return conversationWidget;
};

/**
 * Creates the scrollable conversation container.
 * @returns Widget containing all conversation pieces
 */
const createConversationContainer = () => {
  const container = Widget.Box({
    vertical: true,
    spacing: LAYOUT.conversationSpacing,
    children: [],
    setup: (self) => {
      /**
       * Handles new prompt events from the Gemini service.
       */
      const handlePromptReceived = (_: any, id: number, prompt: string) => {
        // Add user prompt
        self.append(
          createConversationPiece({
            id,
            text: prompt,
            conversationType: ConversationType.Prompt,
          }),
        );

        // Add placeholder for AI response
        self.append(
          createConversationPiece({
            id: id + 1,
            text: UI_LABELS.thinkingMessage,
            conversationType: ConversationType.Response,
          }),
        );
      };

      /**
       * Handles response events from the Gemini service.
       */
      const handleResponseReceived = (_: any, id: number, response: string) => {
        const responseWidget = self.get_children()[
          id
        ] as ExtendedConversationWidget;
        responseWidget.setContent(response);
      };

      geminiService.connect("prompt-received", handlePromptReceived);
      geminiService.connect("response-received", handleResponseReceived);
    },
  });

  return container;
};

/**
 * Creates the prompt input text view with keyboard handling.
 * @param conversationContainer - Reference to conversation container for ID counting
 * @returns Configured text view widget
 */
const createPromptInputTextView = (
  conversationContainer: ReturnType<typeof createConversationContainer>,
) => {
  const promptTextView = new Gtk.TextView({
    cssClasses: [CSS_CLASSES.promptEntry],
    canFocus: true,
    focusOnClick: true,
    focusable: true,
    wrapMode: Gtk.WrapMode.WORD_CHAR,
    hexpand: true,
    vexpand: false,
  });

  /**
   * Handles key press events for the prompt input.
   * @param controller - The event controller
   * @param keyval - The key value
   * @param keycode - The hardware key code
   * @param state - Modifier key state
   * @returns True if event was handled, false otherwise
   */
  const handleKeyPress = (
    _controller: Gtk.EventControllerKey,
    keyval: number,
    _keycode: number,
    state: Gdk.ModifierType,
  ): boolean => {
    const isEnterKey =
      keyval === KEYBOARD.enterKey || keyval === KEYBOARD.keypadEnterKey;
    const isShiftPressed = !!(state & KEYBOARD.shiftModifier);

    if (isEnterKey && !isShiftPressed) {
      const promptText = promptTextView.buffer.text;
      if (promptText.trim().length > 0) {
        geminiService.prompt(conversationContainer.children.length, promptText);
        promptTextView.buffer.set_text("", -1);
      }
      return true; // Event handled
    }

    return false; // Let other handlers process the event
  };

  const keyController = new Gtk.EventControllerKey();
  keyController.connect("key-pressed", handleKeyPress);
  promptTextView.add_controller(keyController);

  return promptTextView;
};

/**
 * Creates a scrolled window for the conversation container.
 * @param conversationContainer - The container to make scrollable
 * @returns Scrolled window widget
 */
const createScrolledConversationWindow = (
  conversationContainer: ReturnType<typeof createConversationContainer>,
) =>
  new Gtk.ScrolledWindow({
    vexpand: true,
    hexpand: false,
    child: conversationContainer,
    visible: true,
  });

/*****************************************************************************
 * Main component
 *****************************************************************************/

/**
 * Main Gemini chat widget component.
 * Provides an interactive interface for chatting with Google Gemini AI.
 * Features include markdown rendering, syntax highlighting, and real-time responses.
 * @returns Widget containing the complete Gemini chat interface
 */
export const GeminiChat = () => {
  const conversationContainer = createConversationContainer();
  const scrolledWindow = createScrolledConversationWindow(
    conversationContainer,
  );
  const promptInput = createPromptInputTextView(conversationContainer);

  return Widget.CenterBox({
    cssClasses: [CSS_CLASSES.gemini],
    orientation: Gtk.Orientation.VERTICAL,
    hexpand: false,
    startWidget: scrolledWindow,
    endWidget: promptInput,
  });
};
