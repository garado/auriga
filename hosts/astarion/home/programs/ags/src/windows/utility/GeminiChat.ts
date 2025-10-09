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

import { CustomSourceView } from "@/components/CustomSourceView";
import GeminiService, { ConversationType } from "@/services/Gemini";
import SettingsManager from "@/services/settings";
import { convertMarkdownToPangoMarkup } from "@/utils/MarkdownToMarkup";
import { clearChildren } from "@/utils/BoxUtils";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let gemini: InstanceType<typeof GeminiService> | undefined = undefined;
const settings = SettingsManager.get_default();

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
    createConversationPiece({
      id,
      text: promptText,
      conversationType: ConversationType.Prompt,
    }),
  );

  // Add placeholder for response
  conversationContainer.append(
    createConversationPiece({
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
  }
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
const createConversationContainer = () =>
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
const createPromptInputTextView = (conversationContainer: Astal.Box) => {
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
const createScrolledConversationWindow = (conversationContainer: Astal.Box) =>
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
