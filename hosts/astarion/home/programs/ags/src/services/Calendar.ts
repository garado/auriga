/* █▀▀ ▄▀█ █░░ █▀▀ █▄░█ █▀▄ ▄▀█ █▀█ */
/* █▄▄ █▀█ █▄▄ ██▄ █░▀█ █▄▀ █▀█ █▀▄ */

/**
 * A service to interface with gcalcli. Also provides helper functions
 * and stores variables for the UI.
 *
 * This service is supporting:
 *  - Calendar tab week view
 *  - Calendar tab schedule view
 *  - Home tab agenda view
 *
 * Terminology:
 *  - weekDates
 *      - For calendar weekview, this is the range of viewable dates
 *        for the current week (starting Sunday)
 *
 * Calendar week view program flow:
 *  - constructor
 *    - initWeekData: Init weekDates for the current week
 *      - setNewweekDates(str: date): Find all dates for the week which
 *        includes `date`
 *        - readCache(array: dates): Read all event data starting or
 *          ending on the given dates
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property, signal } from "astal/gobject";
import { execAsync } from "astal/process";
import { log } from "@/globals";

/*****************************************************************************
 * Types/interfaces
 *****************************************************************************/

export interface Event {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  location: string;
  calendar: string;
  allDay: boolean;
  multiDay: boolean;
  startedBeforeThisWeek: boolean;
  endsAfterThisWeek: boolean;
  startTS: number; // Starting timestamp of event (epoch)
  endTS: number; // Ending timestamp of event (epoch)
  startFH: number; // Start time of event as fractional hour (5:30PM -> 17.5)
  endFH: number; // End time of event as fractional hour
  durationFH: number; // Duration of event as fractional hour
  widget?: any;
}

// Specifies how data is ordered when parsing lines from gcalcli TSV output.
enum GcalcliCSVEnum {
  startDate,
  startTime,
  endDate,
  endTime,
  description,
  location,
  calendar,
  LENGTH,
}

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

/**
 * heightScale = 1 ==> weekview is the same height as dash
 * heightScale = 2 ==> weekview is 2x as tall as dash (and is wrapped in a scrollable)
 */
export const uiVars = {
  heightScale: 1.75,
};

export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const TMPFILE = "/tmp/ags/gcalcli";
const USER_UTC_OFFSET = new Date().getTimezoneOffset() / -60;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MS_PER_HOUR = 1000 * 60 * 60;
const DAYS_PER_WEEK = 7;
const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

export const fhToTimeStr = (fh: number): string => {
  const hh = Math.floor(fh).toString().padStart(2, "0");
  const mm = ((fh % 1) * 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "Calendar" })
export default class Calendar extends GObject.Object {
  /* Set up singleton ********************************************************/
  static instance: Calendar;

  static get_default() {
    if (!this.instance) {
      this.instance = new Calendar();
    }

    return this.instance;
  }

  /* Properties **************************************************************/
  @property(String)
  declare today: string;

  @property(Object)
  declare weekDates: Array<string>;

  @property(Object)
  declare weekEvents: Record<string, Array<Event>>;

  @signal(Object, Object)
  declare weekdatesChanged: (
    weekDates: Array<string>,
    weekEvents: Object,
  ) => void;

  /* Private functions *******************************************************/

  /**
   * Given a date object, return the DateString.
   * For this application, a DateString is the date in YYYY-MM-DD.
   *
   * @param {Date} date - A JSDate object
   * @return {string} date string YYYY-MM-DD
   */
  getDateStr(date: Date): string {
    /* Make sure toISOstring returns the local time instead of UTC time */
    date.setUTCHours(date.getUTCHours() + USER_UTC_OFFSET);
    return date.toISOString().split("T")[0];
  }

  /**
   * Given a certain date (YYYY-MM-DD), query all of the events
   * from the cache file.
   *
   * @param {string} dateStr - A string YYYY-MM-DD
   */
  queryEventsFromDate(dateStr: string) {
    if (this.weekDates.includes(dateStr)) {
      return this.weekEvents[dateStr];
    }

    const cmd = `grep -E '(${dateStr})' ${TMPFILE}`;
    execAsync(`bash -c "${cmd}"`)
      .then((out) => {
        this.#parseEventFromTSV(out);
      })
      .catch((err) => {
        console.log("calService", `queryEventsFromDate: ${err}`);
      });
  }

  /**
   * Given a line of TSV from the cache file, return event data.
   *
   * @param {string} line - A line from the gcalcli TSV output file.
   */
  #parseEventFromTSV(line: string) {
    const rawData = line.trim().split("\t");

    if (rawData.length != GcalcliCSVEnum.LENGTH) {
      return null; // Invalid data
    }

    const event: Partial<Event> = {};

    // Populate event data with information parsed from TSV
    event.startDate = rawData[GcalcliCSVEnum.startDate];
    event.startTime = rawData[GcalcliCSVEnum.startTime];
    event.endDate = rawData[GcalcliCSVEnum.endDate];
    event.endTime = rawData[GcalcliCSVEnum.endTime];
    event.description = rawData[GcalcliCSVEnum.description];
    event.location = rawData[GcalcliCSVEnum.location];
    event.calendar = rawData[GcalcliCSVEnum.calendar];

    // Populate inferred data
    event.multiDay = event.startDate != event.endDate;
    event.allDay = event.startTime == "" && event.endTime == "";
    event.startedBeforeThisWeek = !this.weekDates.includes(event.startDate);
    event.endsAfterThisWeek = !this.weekDates.includes(event.endDate);

    if (event.multiDay || event.allDay) {
      return event as Event; // No need to populate the rest
    }

    // Get unix epoch timetamps
    event.startTS = new Date(`${event.startDate} ${event.startTime}`).getTime();
    event.endTS = new Date(`${event.endDate} ${event.endTime}`).getTime();

    // Get fractional hours. 5:30PM -> 17.5; 9:15AM -> 9.25
    const startRe = /(\d\d):(\d\d)/.exec(event.startTime);
    const endRe = /(\d\d):(\d\d)/.exec(event.endTime);

    if (!startRe || !endRe) {
      console.warn(
        `Invalid time format: start=${event.startTime}, end=${event.endTime}`,
      );
      return event as Event;
    }

    event.startFH = Number(startRe[1]) + Number(startRe[2]) / MINUTES_PER_HOUR;
    event.endFH = Number(endRe[1]) + Number(endRe[2]) / MINUTES_PER_HOUR;
    event.durationFH = (event.endTS - event.startTS) / MS_PER_HOUR;

    return event as Event;
  }

  constructor() {
    super();
    this.#initWeekData();
  }

  /**
   * Initialize data for the service.
   * @param startDate The week whose data to fetch
   */
  #initWeekData(startDate = new Date()) {
    log("calService", `#initWeekData: Called with d = ${startDate}`);
    this.today = this.getDateStr(startDate);
    this.#setNewweekDates(this.today);
  }

  /**
   * Given a start date YYYY-MM-DD, figure out the new weekDates and grab data for the new weekDates.
   *
   * @param {string} dateStr The date to set the weekDates to.
   */
  #setNewweekDates(dateStr: string) {
    log("calService", `#setNewweekDates: Starting ${dateStr}`);

    this.weekDates = [];
    this.weekEvents = {};

    // Initialize the timestamp to the Sunday of the given week
    const date = new Date(dateStr);

    // Determine the days in that week
    let ts = date.setDate(date.getUTCDate() - date.getUTCDay());

    for (let i = 0; i < DAYS_PER_WEEK; i++) {
      const localDate = new Date(ts);
      const dateStr = this.getDateStr(localDate);
      this.weekDates.push(dateStr);
      this.weekEvents[dateStr] = [];
      ts += MS_PER_DAY;
    }

    this.#readCache(this.weekDates);
  }

  /**
   * Read cached data from cache and save to this.weekEvents for displaying
   *
   * @param dates Array of strings (YYYY-MM-DD) which represent the dates to whose data to fetch from the cache.
   */
  #readCache(dates: Array<string>) {
    log("calService", `#readCache: ${dates}`);

    const cmd = `grep -E '(${dates.join("|")})' ${TMPFILE}`;

    execAsync(`bash -c "${cmd}"`)
      .then((out) => {
        this.#parseData(out);
      })
      .catch((err) => {
        console.log("calService", `#readCache error: ${err}`);
      });
  }

  /**
   * Make Google Calendar API call and save data to cachefile.
   */
  #updateCache() {
    log("calService", "Updating cache");

    const cmd =
      "gcalcli agenda '8 months ago' 'in 8 months' --details calendar --details location --military --tsv";

    execAsync(`bash -c "${cmd} | tee ${TMPFILE}"`)
      .then(() => this.#initWeekData())
      .catch((err) => {
        if (err.includes("expired or revoked")) {
          console.log("Gcalcli: updateCache: Authentication expired!");
        } else {
          log("calService", `updateCache: ${err}`);
        }
      });
  }

  /**
   * Parse TSV data from cachefile.
   *
   * @param {string} out Raw TSV from cachefile.
   */
  #parseData(out: string) {
    log("calService", "#parseData: Parsing data");

    out.split("\n").forEach((eventLine) => {
      const event = this.#parseEventFromTSV(eventLine);
      if (event === null) return;

      if (event.startedBeforeThisWeek) {
        this.weekEvents[event.endDate].push(event);
      } else {
        this.weekEvents[event.startDate].push(event);
      }
    });

    // Sort events for each day
    for (let i = 0; i < this.weekDates.length; i++) {
      const thisDateStr = this.weekDates[i];
      this.#sortEvents(this.weekEvents[thisDateStr]);
    }

    this.emit("weekdates-changed", this.weekDates, this.weekEvents);
  }

  /**
   * Sort an array of events.
   *
   * @param {Array<Event>} events Events to sort.
   */
  #sortEvents(events: Array<Event>): Array<Event> {
    return events.sort(function (a, b) {
      if (a.startFH < b.startFH) return -1;
      if (a.startFH > b.startFH) return 1;
      if (a.endFH < b.endFH) return -1;
      if (a.endFH > b.endFH) return 1;
      return 0;
    });
  }
}
