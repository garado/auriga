/**
 * █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █   █▀▀ █░█ ▄▀█ ▀█▀
 * █▄█ ██▄ █░▀░█ █ █░▀█ █   █▄▄ █▀█ █▀█ ░█░
 *
 * Interactive chat widget for communicating with Gemini API
 *
 * UI inspiration from kotontrion's ChatGPT widget (unixporn discord).
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Astal, Gdk, Gtk, Widget } from "astal/gtk4";

import GeminiService, { ConversationType } from "@/services/Gemini";
import SettingsManager from "@/services/settings";
import { convertMarkdownToPangoMarkup } from "@/utils/MarkdownToMarkup";
import { clearChildren } from "@/utils/BoxUtils";
import GtkSource5 from "gi://GtkSource";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let gemini: InstanceType<typeof GeminiService> | undefined = undefined;
const settings = SettingsManager.get_default();

// Use just one StyleSchemeManager for all GtkSourceView widgets
const styleManager = GtkSource5.StyleSchemeManager.get_default();
styleManager.append_search_path(`${SRC}/assets/defaults/theme/sourceview`);

// Do this instead of having each individual GtkSource buffer manage its own current-theme connection
const activeBuffers = new Set<GtkSource5.Buffer>();
settings.connect("notify::current-theme", () => {
  activeBuffers.forEach((buffer) => {
    buffer.set_style_scheme(styleManager.get_scheme(settings.currentTheme));
  });
});

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  gemini: "gemini",
  speaker: "speaker",
  userSpeaker: "user",
  geminiSpeaker: "gemini",
  content: "content",
  promptText: "prompt",
  responseText: "response",
  promptEntryTextbox: "prompt-entry-textbox",
} as const;

const UI_LABELS = {
  userDisplayName: settings.config.dashHome.profile.name,
  aiDisplayName: "Gemini",
  thinkingMessage: "Thinking...",
} as const;

const LAYOUT = {
  conversationSpacing: 10,
} as const;

const KB_SHORTCUTS = {
  enterKey: Gdk.KEY_Return,
  keypadEnterKey: Gdk.KEY_KP_Enter,
  shiftModifier: Gdk.ModifierType.SHIFT_MASK,
} as const;

const COMMANDS = {
  clear: "/clear",
};

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
interface ExtendedConversationWidget extends Astal.Box {
  setContent: (responseText: string) => void;
}

/*****************************************************************************
 * Utility functions
 *****************************************************************************/

/**
 * Tokenizes a Gemini response to separate text and code blocks.
 * @param markdownResponse - Raw markdown response from Gemini
 * @returns Array of tokens representing different content types
 */
const tokenizeGeminiResponse = (markdownResponse: string): ResponseToken[] => {
  const tokens: ResponseToken[] = [];
  let remainingText = markdownResponse.replaceAll("\n\n", "\n");
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
        tokens[tokens.length - 1].content.length + "```".length,
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

/**
 * Call Gemini API with a specific prompt text and set up UI accordingly
 * @param promptText - the prompt text to pass to Gemini APi
 * @param conversationContainer - the widget containing the prompt/response content widgets
 */
const submitPrompt = (promptText: string, conversationContainer: Astal.Box) => {
  const id = conversationContainer.children.length;

  // Add user prompt immediately
  conversationContainer.append(
    ConversationPiece({
      id,
      text: promptText,
      conversationType: ConversationType.Prompt,
    }),
  );

  // Add placeholder for response
  conversationContainer.append(
    ConversationPiece({
      id: id + 1,
      text: UI_LABELS.thinkingMessage,
      conversationType: ConversationType.Response,
    }),
  );

  // Call Gemini with callbacks
  gemini!.prompt(
    id,
    promptText,
    (responseId, response) => {
      const responseWidget = conversationContainer.get_children()[
        responseId + 1
      ] as ExtendedConversationWidget;
      responseWidget.setContent(response);
    },
    (errorId, error) => {
      const responseWidget = conversationContainer.get_children()[
        errorId + 1
      ] as ExtendedConversationWidget;
      responseWidget.setContent(`Error: ${error}`);
    },
  );
};

/**
 * Runs a slash command.
 */
const runSlashCommand = (command: string, conversationContainer: Astal.Box) => {
  if (COMMANDS.clear == command) {
    clearChildren(conversationContainer);
    activeBuffers.clear();
  }
};

/*****************************************************************************
 * Widget creation functions
 *****************************************************************************/

/**
 * @brief Wrapper around GtkSourceView
 */
const SourceView = (lang: string, code: string) => {
  const topBar = Widget.Box({
    cssClasses: ["topbar"],
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: ["language"],
        label: lang,
        xalign: 0,
      }),
    ],
  });

  // Actual code
  const buffer = new GtkSource5.Buffer();
  const view = new GtkSource5.View({
    buffer,
    cssClasses: ["codeview"],
    vexpand: true,
    hexpand: true,
    showLineNumbers: true,
    autoIndent: true,
    monospace: true,
  });

  // Syntax highlighting
  const langManager = GtkSource5.LanguageManager.get_default();
  buffer.set_language(langManager.get_language(lang!));
  buffer.set_text(code.trim(), -1);

  // Themeing
  buffer.set_style_scheme(styleManager.get_scheme(settings.currentTheme));
  activeBuffers.add(buffer);

  return Widget.Box({
    cssClasses: ["sourceview-wrapper"],
    vertical: true,
    children: [topBar, view],
  });
};

/**
 * Creates a label indicating if the message was sent by the user or the LLM.
 * @param conversationType - Type of conversation (prompt or response)
 * @returns Widget containing message sender identification
 */
const MessageSenderLabel = (conversationType: ConversationType) => {
  const isUserMessage = conversationType === ConversationType.Prompt;

  return Widget.Label({
    cssClasses: [
      CSS_CLASSES.speaker,
      isUserMessage ? CSS_CLASSES.userSpeaker : CSS_CLASSES.geminiSpeaker,
    ],
    visible: isUserMessage,
    label: isUserMessage ? UI_LABELS.userDisplayName : UI_LABELS.aiDisplayName,
    xalign: 0,
  });
};

/**
 * Creates a content widget for a response token.
 * @param token - Token containing content and type information
 * @returns Widget appropriate for the token type
 */
const TokenWidget = (token: ResponseToken) => {
  if (token.type === "code") {
    return SourceView(token.language!, token.content);
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
const ConversationPiece = (
  props: ConversationPieceProps,
): ExtendedConversationWidget => {
  const speakerLabel = MessageSenderLabel(props.conversationType);

  const contentContainer = Widget.Box({
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: [
          CSS_CLASSES.content,
          props.conversationType == ConversationType.Prompt
            ? CSS_CLASSES.promptText
            : CSS_CLASSES.responseText,
        ],
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
      const tokenWidget = TokenWidget(token);
      contentContainer.append(tokenWidget);
    });
  };

  return conversationWidget;
};

/**
 * Creates the scrollable conversation container.
 * @returns Widget containing all conversation pieces
 */
const ConversationContainer = () =>
  Widget.Box({
    vertical: true,
    spacing: LAYOUT.conversationSpacing,
    children: [],
  });

/**
 * Creates the prompt input text view with keyboard handling.
 * @param conversationContainer - Reference to conversation container for ID counting
 * @returns Configured text view widget
 *
 * Note: using TextView to support multiline input.
 */
const PromptInputTextView = (conversationContainer: Astal.Box) => {
  const promptTextView = new Gtk.TextView({
    cssClasses: [CSS_CLASSES.promptEntryTextbox],
    canFocus: true,
    focusOnClick: true,
    focusable: true,
    wrapMode: Gtk.WrapMode.WORD_CHAR,
    hexpand: true,
    vexpand: false,
  });

  /**
   * Handles key press events for the prompt input.
   * This will submit a prompt or execute a slash command.
   *
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
    // Check for user pressing <Enter> to run a prompt or a slash command
    // (<Shift+Enter> will create a newline for multiline inputs)
    const isEnterKey =
      keyval === KB_SHORTCUTS.enterKey ||
      keyval === KB_SHORTCUTS.keypadEnterKey;
    const isShiftPressed = state & KB_SHORTCUTS.shiftModifier;
    if (!(isEnterKey && !isShiftPressed)) return false;

    const promptText = promptTextView.buffer.text;

    if (promptText.trim().length > 0) {
      if (Object.values(COMMANDS).includes(promptText)) {
        runSlashCommand(promptText, conversationContainer);
      } else {
        submitPrompt(promptText, conversationContainer);
      }
    }

    // Clear buffer and reset cursor pos
    promptTextView.buffer.set_text("", -1);

    return true;
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
const ScrolledConversationWindow = (conversationContainer: Astal.Box) =>
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
  gemini = GeminiService.get_default();

  const conversationContainer = ConversationContainer();
  const scrolledWindow = ScrolledConversationWindow(conversationContainer);

  const promptInput = PromptInputTextView(conversationContainer);

  return Widget.CenterBox({
    cssClasses: [CSS_CLASSES.gemini],
    orientation: Gtk.Orientation.VERTICAL,
    hexpand: false,
    startWidget: scrolledWindow,
    endWidget: promptInput,
  });
};
