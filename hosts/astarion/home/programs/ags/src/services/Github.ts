/**
 * █▀▀ █ ▀█▀ █░█ █░█ █▄▄   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █ █▄▄ █▀
 * █▄█ █ ░█░ █▀█ █▄█ █▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █ █▄█ ▄█
 *
 * Queries Github contributions for a user.
 *
 * https://github-contributions.vercel.app/api/v1/
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GLib, readFile } from "astal";
import { exec, execAsync } from "astal/process";
import { GObject, register, property } from "astal/gobject";
import SettingsManager from "./settings";
import { fileWrite } from "@/utils/File";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const USERNAME = SettingsManager.get_default().config.dashHome.github;

const CACHEFILE = `${GLib.get_user_cache_dir()}/astal/github/contributions.json`;
const TS_FILE = `${GLib.get_user_cache_dir()}/astal/github/last_fetched`;

/** Fetch data daily */
const FETCH_INTERVAL_MS = 24 * 60 * 60 * 1000;

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

interface ContributionData {
  date: string;
  count: number;
  intensity: number;
}

interface YearData {
  year: string;
  total: number;
}

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "Github" })
export default class Github extends GObject.Object {
  // Set up singleton ---------------------------------------------------------
  static instance: Github;

  static get_default() {
    if (!this.instance) {
      this.instance = new Github();
    }
    return this.instance;
  }

  // Properties ---------------------------------------------------------------
  @property(Object)
  declare contributions: ContributionData[];

  @property(Number)
  declare totalContributions: number;

  // Private functions --------------------------------------------------------
  constructor() {
    super();

    this.contributions = [];
    this.totalContributions = 0;

    this.#loadContributions();
  }

  async #loadContributions() {
    let cachedData: string | undefined = undefined;
    let dataIsRecent: boolean = false;

    /**
     * Try cache first. To use cache, cachefile must exist and cached data must have been
     * fetched within the last FETCH_INTERVAL_MS ms (default 1 day).
     */
    try {
      // Does cachefile exist?
      cachedData = readFile(CACHEFILE);

      // Is the timestamp recent enough?
      const lastFetched = Number(readFile(TS_FILE));
      dataIsRecent = Date.now() - lastFetched < FETCH_INTERVAL_MS;
    } catch {
      cachedData = undefined;
      dataIsRecent = false;
    }

    try {
      if (cachedData && dataIsRecent) {
        const data = JSON.parse(cachedData);
        this.#processData(data);
      } else {
        // Fetch fresh data and cache it
        console.log("Fetching Github contribution data from API");
        const cmd = `bash -c "curl -s https://github-contributions.vercel.app/api/v1/${USERNAME} | tee ${CACHEFILE}"`;
        const raw = await execAsync(cmd);
        const data = JSON.parse(raw);
        this.#processData(data);

        // Log fetch timestamp so we can fetch it daily
        fileWrite(TS_FILE, `${Date.now()}`);
      }
    } catch (err) {
      console.warn(`Failed to load GitHub data: ${err}`);
    }
  }

  #processData(data: any) {
    const daysLeftInYear = 365 - Number(exec("date +%j"));
    this.contributions = data.contributions.slice(daysLeftInYear);

    this.totalContributions = data.years.reduce(
      (sum: number, y: YearData) => sum + y.total,
      0,
    );
  }
}
