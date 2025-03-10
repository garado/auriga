import { GObject, register, property, signal } from "astal/gobject";
import { execAsync } from "astal/process";
import UserConfig from "../../userconfig.js";

const GEMINI_API_KEY = UserConfig.gemini.api;

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export enum ConversationType {
  Prompt,
  Response,
}

export type ConversationData = {
  type: ConversationType;
  content: string;
};

/**********************************************
 * PRIVATE TYPEDEFS
 **********************************************/

/**********************************************
 * UTILITY
 **********************************************/

/**
 * Escape quotes
 * (CANNOT get this to work so im just removing it all for now)
 */
const escapeQuotes = (text: string) => {
  text = text.replaceAll('"', "");
  text = text.replaceAll("'", "");
  return text;
};

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Gemini" })
export default class Gemini extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Gemini;

  static get_default() {
    if (!this.instance) {
      this.instance = new Gemini();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @signal(Number, String)
  declare promptReceived: (id: number, prompt: string) => void;

  @signal(Number, String)
  declare responseReceived: (id: number, response: string) => void;

  @property(Boolean)
  declare continue: boolean;

  @property(Boolean)
  declare concise: boolean;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();
    this.continue = false;
    this.concise = true;
  }

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/

  /**
   * Call Gemini API with user input
   */
  prompt(id: number, promptText: string) {
    this.emit("prompt-received", id, promptText);

    const cmd = `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}" \
                  -H 'Content-Type: application/json' -X POST -d '{ "contents": [{ "parts":[{"text": "answer concisely ${escapeQuotes(promptText)}"}] }] }'`;

    execAsync(cmd)
      .then((result) => {
        const response =
          JSON.parse(result).candidates[0].content.parts[0].text.trim();
        this.emit("response-received", id + 1, response);
      })
      .catch((err) => print(`prompt: ${err}`));
  }
}
