/* █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █   ▄▀█ █▀█ █ */
/* █▄█ ██▄ █░▀░█ █ █░▀█ █   █▀█ █▀▀ █ */

/**
 * Idea and UI inspiration taken from kotontrion's chatgpt widget,
 * as posted in unixporn discord
 */

import { App, Astal, Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, GLib, bind } from "astal";
import Gio from "gi://Gio";
import { CustomSourceView } from "@/components/CustomSourceView";
import GeminiService, {
  ConversationType,
  ConversationData,
} from "@/services/Gemini";
import { setConsoleLogDomain } from "console";

const gs = GeminiService.get_default();

const Scrollable = astalify(Gtk.ScrolledWindow);

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
      // { name: 'EMPH', re: /_(\S.*?\S)_/g, sub: "<i>$1</i>" },
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
      // { name: 'UND', re: /(__|\*\*)(\S[\s\S]*?\S)(__|\*\*)/g, sub: "<u>$2</u>" },
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
      /* Grab language */
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
 * Just a header thingy that says "Gemini".
 */
const HeaderBar = () =>
  Widget.CenterBox({
    startWidget: Widget.Label({
      hexpand: true,
      cssClasses: ["header"],
      label: "Gemini",
      xalign: 0,
    }),
  });

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
    /* This is triggered after callback */
    setContent: (responseText: string) => {
      /* Remove 'Thinking...' */
      Content.remove(Content.children[0]);

      /* Tokenize to check if there's code snippets */
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

  /**
   * Where the user types in prompts to Gemini
   * Commands (put these at beginning of prompt)
   *    - /clr  to clear all responses
   *    - /cont to toggle continuing the conversation (TODO)
   *    - /cns  to toggle responding concisely (TODO)
   */
  const PromptEntryBox = Widget.Entry({
    cssClasses: ["prompt-entry"],
    canFocus: true,
    focusOnClick: true,
    focusable: true,
    placeholderText: "Talk to Gemini",
    onActivate: (self) => {
      /* Check for commands */
      if ("/clr" == self.text) {
        Container.children.forEach((child) => {
          Container.remove(child);
        });
      } else if ("/cont" == self.text) {
        self.text = "/cont ";
      } else {
        gs.prompt(Container.children.length, self.text);
      }
      self.text = "";
    },
    onFocusEnter: (self) => {
      self.add_css_class("focus");
    },
    onFocusLeave: (self) => {
      self.remove_css_class("focus");
    },
  });

  const Final = Widget.CenterBox({
    cssClasses: ["gemini"],
    orientation: 1,
    hexpand: false,
    // startWidget: Widget.Box({
    //   vertical: true,
    //   vexpand: true,
    //   children: [Container],
    // }),
    startWidget: Scrollable({
      vexpand: true,
      hexpand: false,
      child: Container,
      visible: true,
    }),
    endWidget: PromptEntryBox,
  });

  return Final;
};
