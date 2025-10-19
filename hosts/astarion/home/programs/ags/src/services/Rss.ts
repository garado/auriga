/**
 * ▀█▀ ▀█▀ █▀█ █▀ █▀
 * ░█░ ░█░ █▀▄ ▄█ ▄█
 *
 * Query ttrss (Tiny Tiny RSS) API for feed headlines.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GLib, readFile } from "astal";
import { execAsync } from "astal/process";
import { GObject, register, property } from "astal/gobject";
import SettingsManager from "./settings";
import { fileWrite } from "@/utils/File";
import { CMD } from "@/utils/Commands";
import { fetch } from "@/utils/Fetch";
import { getSecret } from "@/utils/Secrets";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const TTRSS_URL = SettingsManager.get_default().config.ttrss.url;

const TTRSS_USER_SECRET =
  SettingsManager.get_default().config.secrets.ttrss.user;

const TTRSS_PASS_SECRET =
  SettingsManager.get_default().config.secrets.ttrss.pass;

const SESSION_FILE = `${GLib.get_user_cache_dir()}/astal/ttrss/session_id`;

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

export interface Headline {
  id: number;
  guid: string;
  unread: boolean;
  marked: boolean;
  published: boolean;
  updated: number;
  is_updated: boolean;
  title: string;
  link: string;
  feed_id: number;
  tags: string[];
  attachments: Attachment[];
  labels: any[];
  feed_title: string;
  comments_count: number;
  comments_link: string;
  always_display_attachments: boolean;
  author: string;
  score: number;
  note: string | null;
  lang: string;
  site_url: string;
  excerpt: string;
}

export interface Attachment {
  id: number;
  content_url: string;
  content_type: string;
  title: string;
  duration: string;
  width: number;
  height: number;
  post_id: number;
}

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "TTRSS" })
export default class TTRSS extends GObject.Object {
  // Set up singleton ---------------------------------------------------------
  static instance: TTRSS;

  static get_default() {
    if (!this.instance) {
      this.instance = new TTRSS();
    }
    return this.instance;
  }

  // Properties ---------------------------------------------------------------
  @property(String)
  declare sessionId: string;

  @property(Object)
  declare headlines: Headline[];

  // Private functions --------------------------------------------------------
  constructor() {
    super();

    this.sessionId = "";
    this.headlines = [];

    this.#loadSession();
  }

  async #loadSession() {
    try {
      this.sessionId = readFile(SESSION_FILE).trim();
    } catch {
      await this.#login();
    }
  }

  async #login() {
    try {
      const response = await fetch(`${TTRSS_URL}/api/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          op: "login",
          user: getSecret(TTRSS_USER_SECRET),
          password: getSecret(TTRSS_PASS_SECRET),
        }),
      });

      const data = JSON.parse(response);

      if (data.content?.session_id) {
        this.sessionId = data.content.session_id;
        fileWrite(SESSION_FILE, this.sessionId);
      } else {
        console.error("TTRSS login failed:", data);
      }
    } catch (err) {
      console.error(`TTRSS login error: ${err}`);
    }
  }

  async fetchHeadlines(limit: number = 5, feedId: number = -4) {
    if (!this.sessionId) {
      await this.#login();
    }

    try {
      const response = await fetch(`${TTRSS_URL}/api/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          op: "getHeadlines",
          sid: this.sessionId,
          feed_id: feedId,
          limit: limit,
          output_mode: "json",
          show_excerpt: true,
          excerpt_length: 500,
        }),
      });

      const data = JSON.parse(response);

      if (data.content) {
        this.headlines = data.content;
      } else {
        console.error("Failed to fetch headlines:", data);
      }
    } catch (err) {
      console.error(`Failed to fetch TTRSS headlines: ${err}`);
    }
  }
}
