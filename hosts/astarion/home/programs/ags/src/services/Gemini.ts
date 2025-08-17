/**
 * █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █
 * █▄█ ██▄ █░▀░█ █ █░▀█ █
 *
 * Service for interacting with Gemini API.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property } from "astal/gobject";
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

export type GeminiError = {
  code: number;
  message: string;
  status: string;
};

export type GeminiResponse = {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: GeminiError;
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

/**
 * Get user-friendly error message based on error code
 */
const getErrorMessage = (error: GeminiError): string => {
  switch (error.code) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "API key is invalid or missing.";
    case 403:
      return "Access denied. Check your API permissions.";
    case 404:
      return "Model not found.";
    case 429:
      return "Rate limit exceeded. Please wait before trying again.";
    case 500:
      return "Gemini server error. Please try again later.";
    case 503:
      return "Gemini is overloaded. Please try again in a few moments.";
    default:
      return error.message || "An unknown error occurred.";
  }
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
   * @param {function} callback - Success callback function.
   * @param {function} errorCallback - Optional error callback function.
   */
  prompt(
    id: number,
    promptText: string,
    callback: (id: number, response: string) => void,
    errorCallback?: (id: number, error: string, errorCode?: number) => void,
  ) {
    const cmd = `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}" \
                  -H 'Content-Type: application/json' -X POST -d '{ "contents": [{ "parts":[{"text": "${escapeQuotes(promptText)}"}] }] }'`;

    execAsync(cmd)
      .then((result) => {
        try {
          const jsonResponse: GeminiResponse = JSON.parse(result);

          // Check if response contains an error
          if (jsonResponse.error) {
            const errorMessage = getErrorMessage(jsonResponse.error);
            console.error(
              `Gemini API Error ${jsonResponse.error.code}:`,
              errorMessage,
            );

            if (errorCallback) {
              errorCallback(id, errorMessage, jsonResponse.error.code);
            } else {
              // Fallback: call success callback with error message
              callback(id, `Error: ${errorMessage}`);
            }
            return;
          }

          // Check if response has the expected structure
          if (
            !jsonResponse.candidates ||
            !jsonResponse.candidates[0] ||
            !jsonResponse.candidates[0].content ||
            !jsonResponse.candidates[0].content.parts ||
            !jsonResponse.candidates[0].content.parts[0]
          ) {
            const errorMsg = "Invalid response structure from Gemini API";
            console.error(errorMsg, jsonResponse);

            if (errorCallback) {
              errorCallback(id, errorMsg);
            } else {
              callback(id, `Error: ${errorMsg}`);
            }
            return;
          }

          // Success: extract and return the response
          const response =
            jsonResponse.candidates[0].content.parts[0].text.trim();
          callback(id, response);
        } catch (parseError) {
          const errorMsg = "Failed to parse Gemini API response";
          console.error(errorMsg, parseError, result);

          if (errorCallback) {
            errorCallback(id, errorMsg);
          } else {
            callback(id, `Error: ${errorMsg}`);
          }
        }
      })
      .catch((execError) => {
        const errorMsg = "Failed to execute Gemini API request";
        console.error(errorMsg, execError);

        if (errorCallback) {
          errorCallback(id, errorMsg);
        } else {
          callback(id, `Error: ${errorMsg}`);
        }
      });
  }
}
