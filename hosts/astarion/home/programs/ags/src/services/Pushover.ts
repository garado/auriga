/**
 * █▀█ █░█ █▀ █░█ █▀█ █░█ █▀▀ █▀█   ▄▀█ █▀█ █
 * █▀▀ █▄█ ▄█ █▀█ █▄█ ▀▄▀ ██▄ █▀▄   █▀█ █▀▀ █
 *
 * For interfacing with the Pushover API:
 * https://pushover.net/api
 */

/**********************************************
 * IMPORTS
 **********************************************/

import { GObject, register } from "astal/gobject";
import { execAsync } from "astal/process";
import { log } from "@/globals.js";
import SettingsManager from "./settings";
import { CMD } from "@/utils/Commands";
import { getSecret } from "@/utils/Secrets";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export interface PushoverMessage {
  message: string;
  title?: string;
  url?: string;
  url_title?: string;
}

/**********************************************
 * MODULE LEVEL VARIABLES
 **********************************************/

const PUSHOVER_USER_SECRET =
  SettingsManager.get_default().config.secrets.pushover.user;

const PUSHOVER_API_SECRET =
  SettingsManager.get_default().config.secrets.pushover.api;

/** Rate limit: 1 message per RATE_LIMIT_MS */
const RATE_LIMIT_MS = 2000;

/** Unix epoch timestamp of the last request */
let timestampLastRequest = 0;

/**********************************************
 * UTILITY
 **********************************************/

const checkRateLimit = () => {
  return new Date().getTime() - timestampLastRequest > RATE_LIMIT_MS;
};

const makeApiCall = async (
  message: string,
  title?: string,
  url?: string,
  url_title?: string,
): Promise<void> => {
  const canSend = checkRateLimit();

  if (!canSend) {
    throw new Error(`Rate limited. Wait ${RATE_LIMIT_MS}ms between messages.`);
  }

  const data = {
    user: getSecret(PUSHOVER_USER_SECRET),
    token: getSecret(PUSHOVER_API_SECRET),
    message,
    ...(title && { title }),
    ...(url && { url }),
    ...(url_title && { url_title }),
  };

  const formData = Object.entries(data)
    .map(([key, value]) => `-F "${key}=${value}"`)
    .join(" ");

  const cmd = `${CMD.curl} -s ${formData} https://api.pushover.net/1/messages.json`;

  try {
    await execAsync(cmd);
    timestampLastRequest = new Date().getTime();
    log("pushoverService", "Message sent successfully");
  } catch (error) {
    log("pushoverService", `Failed to send message: ${error}`);
    throw error;
  }
};

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Pushover" })
export default class Pushover extends GObject.Object {
  static instance: Pushover;

  static get_default() {
    if (!this.instance) {
      this.instance = new Pushover();
    }
    return this.instance;
  }

  constructor() {
    super();
  }

  /**
   * @function send
   * @brief Send a notification via Pushover.
   */
  send = async (data: PushoverMessage): Promise<void> => {
    return makeApiCall(data.message, data.title, data.url, data.url_title);
  };

  /**
   * @function sendSimple
   * @brief Send a simple message.
   */
  sendSimple = async (message: string, title?: string): Promise<void> => {
    return makeApiCall(message, title);
  };

  /**
   * @function sendWithUrl
   * @brief Send a message with URL.
   */
  sendWithUrl = async (
    message: string,
    url: string,
    title?: string,
    urlTitle?: string,
  ): Promise<void> => {
    return makeApiCall(message, title, url, urlTitle);
  };
}
