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
 *  - viewrange
 *      - For calendar weekview, this is the range of viewable dates
 *        for the current week (starting Sunday)
 *
 * Calendar week view program flow:
 *  - constructor
 *    - initWeekData: Init viewrange for the current week
 *      - setNewViewrange(str: date): Find all dates for the week which
 *        includes `date`
 *        - readCache(array: dates): Read all event data starting or
 *          ending on the given dates
 */

import { GObject, register, property, signal } from "astal/gobject";
import { exec, execAsync } from "astal/process";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export type Event = {
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
  startTS: number;
  endTS: number;
  startFH: number;
  endFH: number;
  durationFH: number;
  widget: any;
};

export const uiVars = {
  /**
   * heightScale = 1 ==> weekview is the same height as dash
   * heightScale = 2 ==> weekview is 2x as tall as dash (and is wrapped in a scrollable)
   */
  heightScale: 2,
};

export const fhToTimeStr = (fh: number): string => {
  const hh = Math.floor(fh).toString().padStart(2, "0");
  const mm = ((fh % 1) * 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

/**********************************************
 * PRIVATE TYPEDEFS
 **********************************************/

/**
 * Specifies how data is ordered when parsing
 * lines from gcalcli.
 */
enum GcalcliCSVEnum {
  startDate,
  startTime,
  endDate,
  endTime,
  description,
  location,
  calendar,
}

/**********************************************
 * UTILITY
 **********************************************/

const dayNames = [0, 1, 2, 3, 4, 5, 6];

export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const TMPFILE = "/tmp/ags/gcalcli";

/**
 * The user's UTC offset.
 *
 * date +%z returns "-0700" for UTC-7, so there's extra math to
 * convert that string to a usable integer.
 */
const USER_UTC_OFFSET = Number(exec("date +%z")) / 100;

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Calendar" })
export default class Calendar extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Calendar;

  static get_default() {
    if (!this.instance) {
      this.instance = new Calendar();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @property(String)
  declare today: String;

  @property(Object)
  declare viewrange: Array<String>;

  @property(Object)
  declare viewdata: Object;

  @signal(Object, Object)
  declare viewrangeChanged: (
    viewrange: Array<String>,
    viewdata: Object,
  ) => void;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

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
    if (this.viewrange.includes(dateStr)) {
      return this.viewdata[dateStr];
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
   */
  #parseEventFromTSV(line: string) {
    const rawData = line.trim().split("\t");
    const event = {};

    /* Populate event data with information parsed from TSV */
    for (let i = 0; i < rawData.length; i++) {
      event[GcalcliCSVEnum[i]] = rawData[i];
    }

    event.multiDay = event.startDate != event.endDate;
    event.allDay = event.startTime == "" && event.endTime == "";
    event.startedBeforeThisWeek = !this.viewrange.includes(event.startDate);
    event.endsAfterThisWeek = !this.viewrange.includes(event.endDate);

    if (event.multiDay || event.allDay) {
      return event;
    }

    /* Get unix epoch timetamps */
    event.startTS = new Date(`${event.startDate} ${event.startTime}`).getTime();
    event.endTS = new Date(`${event.endDate} ${event.endTime}`).getTime();

    /* Get fractional hours. 5:30PM -> 17.5; 9:15AM -> 9.25 */
    const startRe = /(\d\d):(\d\d)/.exec(event.startTime);
    event.startFH = Number(startRe[1]) + Number(startRe[2]) / 60;

    const endRe = /(\d\d):(\d\d)/.exec(event.endTime);
    event.endFH = Number(endRe[1]) + Number(endRe[2]) / 60;

    event.durationFH = (event.endTS - event.startTS) / (60 * 60 * 1000);

    return event;
  }

  constructor() {
    super();
    this.#initWeekData();
  }

  /**
   * Initialize data for the service.
   */
  #initWeekData(d = new Date()) {
    log("calService", `#initWeekData: Called with d = ${d}`);
    this.today = this.getDateStr(d);
    this.#setNewViewrange(this.today);
  }

  /**
   * Given a start date YYYY-MM-DD, figure out the new viewrange and grab
   * data for the new viewrange.
   */
  #setNewViewrange(date: string) {
    log("calService", `#setNewViewrange: Starting ${date}`);

    this.viewrange = [];
    this.viewdata = {};

    /* Initialize the timestamp to the Sunday of the given week */
    date = new Date(date);
    let ts = date.setDate(date.getUTCDate() - date.getUTCDay());
    log("calService", `#setNewViewrange: Timestamp is ${new Date(ts)}`);

    for (let i = 0; i < 7; i++) {
      const localDate = new Date(ts);
      const dateStr = this.getDateStr(localDate);
      this.viewrange.push(dateStr);
      this.viewdata[dateStr] = [];
      ts += MS_PER_DAY;
    }

    this.#readCache(this.viewrange);
  }

  /**
   * Read cached data from cache and save to this.viewdata for displaying
   *
   * @param dates Array of strings (YYYY-MM-DD) which represent the dates to
   *              whose data to fetch from the cache.
   */
  #readCache(dates: Array<String>) {
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
      .then(this.#initWeekData)
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
   * @param out Raw TSV from cachefile.
   */
  #parseData(out) {
    log("calService", "#parseData: Parsing data");

    out.split("\n").forEach((eventLine) => {
      const event = this.#parseEventFromTSV(eventLine);
      if (event.startedBeforeThisWeek) {
        this.viewdata[event.endDate].push(event);
      } else {
        this.viewdata[event.startDate].push(event);
      }
    });

    /* Sort events */
    for (let i = 0; i < this.viewrange.length; i++) {
      const thisDateStr = this.viewrange[i];
      this.#sortEvents(this.viewdata[thisDateStr]);
    }

    this.emit("viewrange-changed", this.viewrange, this.viewdata);
  }

  #sortEvents(events) {
    return events.sort(function (a, b) {
      if (a.startFH < b.startFH) return -1;
      if (a.startFH > b.startFH) return 1;
      if (a.endFH < b.endFH) return -1;
      if (a.endFH > b.endFH) return 1;
      return 0;
    });
  }

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/
}
