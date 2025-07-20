/**
 * █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █
 * █▄█ ██▄ █░▀░█ █ █░▀█ █
 *
 * Service for interacting with Gemini API.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property, signal } from "astal/gobject";
import { execAsync } from "astal/process";
import SettingsManager from "./settings";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const GEMINI_API_KEY = SettingsManager.get_default().config.misc.geminiAPI;

/*****************************************************************************
 * Types/interfaces
 *****************************************************************************/

export enum ConversationType {
  Prompt,
  Response,
}

export type ConversationData = {
  type: ConversationType;
  content: string;
};

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Escape quotations.
 * (CANNOT get this to work, so I'm just removing it all for now)
 */
const escapeQuotes = (text: string) => {
  text = text.replaceAll('"', "");
  text = text.replaceAll("'", "");
  return text;
};

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "Gemini" })
export default class Gemini extends GObject.Object {
  // Set up singleton --------------------------------------------------------
  static instance: Gemini;

  static get_default() {
    if (!this.instance) {
      this.instance = new Gemini();
    }

    return this.instance;
  }

  // Properties --------------------------------------------------------------
  @signal(Number, String)
  declare promptReceived: (id: number, prompt: string) => void;

  @signal(Number, String)
  declare responseReceived: (id: number, response: string) => void;

  @property(Boolean)
  declare continue: boolean;

  @property(Boolean)
  declare concise: boolean;

  // Private functions -------------------------------------------------------
  constructor() {
    super();
    this.continue = false;
    this.concise = true;
  }

  // Public functions --------------------------------------------------------

  /**
   * Call Gemini API with user input.
   *
   * @param {number} id - The interaction identifier number.
   * @param {string} promptText - User's prompt text.
   */
  prompt(id: number, promptText: string) {
    this.emit("prompt-received", id, promptText);

    const cmd = `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}" \
                  -H 'Content-Type: application/json' -X POST -d '{ "contents": [{ "parts":[{"text": "${escapeQuotes(promptText)}"}] }] }'`;

    execAsync(cmd)
      .then((result) => {
        const response =
          JSON.parse(result).candidates[0].content.parts[0].text.trim();
        this.emit("response-received", id + 1, response);
      })
      .catch((err) => print(`prompt: ${err}`));
  }
}
