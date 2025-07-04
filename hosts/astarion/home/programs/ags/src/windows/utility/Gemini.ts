/**
 * █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █   ▄▀█ █▀█ █
 * █▄█ ██▄ █░▀░█ █ █░▀█ █   █▀█ █▀▀ █
 *
 * Quickly use AI
 */

/**
 * Idea and UI inspiration taken from kotontrion's chatgpt widget,
 * as posted in unixporn discord
 */

import { Gdk, Gtk, Widget, astalify } from "astal/gtk4";
import { CustomSourceView } from "@/components/CustomSourceView";
import GeminiService, {
  ConversationType,
  ConversationData,
} from "@/services/Gemini";

const gs = GeminiService.get_default();

/*************************************************************************
 * HELPERS
 *************************************************************************/

/**
 * Gemini responses have markdown markup. GJS only renders Pango markup.
 * Convert it here.
 * Taken from end-4's excellent config
 * https://github.com/end-4/CirnOS/blob/24a79b1b371c77ff7f8e6584b8551dbe67612b6c/homes/end/.config/ags/lib/md2pango.js#L1
 */
const markdownToPangoMarkup = (text: string) => {
  const monospaceFonts = "Mononoki";

  const replacements = {
    indents: [
      { name: "BULLET", re: /^(\s*)([\*\-]\s)(.*)(\s*)$/, sub: " $1- $3" },
      { name: "NUMBERING", re: /^(\s*[0-9]+\.\s)(.*)(\s*)$/, sub: " $1 $2" },
    ],
    escapes: [
      { name: "COMMENT", re: /<!--.*-->/, sub: "" },
      { name: "AMPERSTAND", re: /&/g, sub: "&amp;" },
      { name: "LESSTHAN", re: /</g, sub: "&lt;" },
      { name: "GREATERTHAN", re: />/g, sub: "&gt;" },
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
      { name: "UND", re: /(__)(\S[\s\S]*?\S)(__)/g, sub: "<u>$2</u>" },
      { name: "EMPH", re: /\*(\S.*?\S)\*/g, sub: "<i>$1</i>" },
      {
        name: "HEXCOLOR",
        re: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g,
        sub:
          '<span bgcolor="#$1" fgcolor="#000000" font_family="' +
          monospaceFonts +
          '">#$1</span>',
      },
      {
        name: "INLCODE",
        re: /(`)([^`]*)(`)/g,
        sub:
          '<span font_weight="bold" font_family="' +
          monospaceFonts +
          '">$2</span>',
      },
    ],
  };

  const replaceCategory = (text: string, replaces) => {
    for (const type of replaces) {
      text = text.replace(type.re, type.sub);
    }
    return text;
  };

  let lines = text.split("\n");
  let output = [];

  /* Replace */
  for (const line of lines) {
    let result = line;
    result = replaceCategory(result, replacements.indents);
    result = replaceCategory(result, replacements.escapes);
    result = replaceCategory(result, replacements.sections);
    result = replaceCategory(result, replacements.styles);
    output.push(result);
  }

  /* Remove trailing whitespaces */
  output = output.map((line) => line.replace(/ +$/, ""));
  return output.join("\n");
};

/**
 * Tokenize on code snippets in a Gemini response
 */
const tokenizeReponse = (markdown: string) => {
  const tokens = [];

  let remainingStr = markdown;
  let isCode = false;

  while (remainingStr != "") {
    const match = remainingStr.match("```");

    if (match) {
      let lang = undefined;

      if (isCode) {
        lang = remainingStr.split(/\s+/)[0];
        remainingStr = remainingStr.slice(lang.length);
      }

      tokens.push({
        type: isCode ? "code" : "text",
        content: remainingStr.substring(
          0,
          isCode ? match!.index! - lang!.length : match.index,
        ),
        language: lang,
      });

      remainingStr = remainingStr.slice(
        tokens[tokens.length - 1].content.length + 3,
      );
    } else {
      tokens.push({ type: "text", content: remainingStr });
      remainingStr = "";
    }

    isCode = !isCode;
  }

  return tokens;
};

/*************************************************************************
 * WIDGETS
 *************************************************************************/

/**
 * Renders a prompt or a response.
 */
const ConversationPiece = (props: {
  id: Number;
  text: string;
  ctype: ConversationType;
}) => {
  const Header = Widget.Label({
    cssClasses:
      props.ctype === ConversationType.Prompt
        ? ["speaker", "user"]
        : ["speaker", "gemini"],
    label: props.ctype === ConversationType.Prompt ? "Alexis" : "Gemini",
    xalign: 0,
  });

  const Content = Widget.Box({
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: ["content"],
        selectable: true,
        useMarkup: true,
        label: props.text,
        xalign: 0,
        wrap: true,
      }),
    ],
  });

  const Final = Widget.Box({
    vertical: true,
    children: [Header, Content],
  });

  /* Add custom function to update the widget content.
   * Mainly used for responses:
   * After you submit a prompt, it says "Thinking..."
   * And then after the API call is done, the "Thinking..." gets updated to
   * the actual response content. */
  Object.assign(Final, {
    setContent: (responseText: string) => {
      Content.remove(Content.children[0]);

      const tokens = tokenizeReponse(responseText);

      tokens.map((token) => {
        let tokenWidget = undefined;

        if (token.type == "code") {
          tokenWidget = CustomSourceView({
            code: token.content,
            lang: token.language!,
          });
        }

        if (token.type == "text") {
          tokenWidget = Widget.Label({
            label: markdownToPangoMarkup(token.content),
            cssClasses: ["content"],
            selectable: true,
            xalign: 0,
            wrap: true,
            useMarkup: true,
          });
        }

        Content.append(tokenWidget!);
      });
    },
  });

  return Final;
};

/**
 * Holds all prompts and responses
 */
const ConversationContainer = () =>
  Widget.Box({
    vertical: true,
    spacing: 10,
    children: [],
    setup: (self) => {
      gs.connect("prompt-received", (_, id: number, prompt: string) => {
        self.append(
          ConversationPiece({
            id: id,
            text: prompt,
            ctype: ConversationType.Prompt,
          }),
        );

        self.append(
          ConversationPiece({
            id: id + 1,
            text: "Thinking...",
            ctype: ConversationType.Response,
          }),
        );
      });

      gs.connect("response-received", (_, id: number, response: string) => {
        self.get_children()[id].setContent(response);
      });
    },
  });

export const Gemini = () => {
  const Container = ConversationContainer();

  const PromptEntryBox = new Gtk.TextView({
    cssClasses: ["prompt-entry"],
    canFocus: true,
    focusOnClick: true,
    focusable: true,
    wrapMode: Gtk.WrapMode.WORD_CHAR, // Enable text wrapping
    hexpand: true, // Allow horizontal expansion
    vexpand: false, // Start with minimal vertical size
  });

  const keyController = new Gtk.EventControllerKey();
  PromptEntryBox.add_controller(keyController);

  keyController.connect(
    "key-pressed",
    (_controller, keyval, _keycode, state) => {
      if (
        (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) &&
        !(state & Gdk.ModifierType.SHIFT_MASK)
      ) {
        print("pressed entr");
        gs.prompt(Container.children.length, PromptEntryBox.buffer.text);
        PromptEntryBox.buffer.set_text("", -1);
        return true;
      }
      return false;
    },
  );

  const Final = Widget.CenterBox({
    cssClasses: ["gemini"],
    orientation: 1,
    hexpand: false,
    startWidget: new Gtk.ScrolledWindow({
      vexpand: true,
      hexpand: false,
      child: Container,
      visible: true,
    }),
    endWidget: PromptEntryBox,
  });

  return Final;
};
