/* █▀▀ █░░ █▀█ █▄▄ ▄▀█ █░░ */
/* █▄█ █▄▄ █▄█ █▄█ █▀█ █▄▄ */

/* Global project definitions */

import { Variable } from "astal";
import UserConfig from "../userconfig.js";

const logFlags = {
  /* Main execution (windows opening, SASS reload, etc) */
  program: false,
  bar: false,
  notrofi: false,
  kitty: false,
  notif: false,

  /* Dashboard stuff */
  dash: false,
  goalTab: false,
  calTab: false,

  /* Other stuff */
  ctrlGemini: false,

  /* Service logging */
  dashService: false,
  taskService: false,
  calService: false,
  goalService: false,
  habitifyService: false,
  lifeService: false,
  ledgerService: true,
};

export function log(section: string, str: string) {
  if (logFlags[section]) {
    console.log(`${section.toUpperCase()}: ${str}`);
  }
}

/* Overwrite `log` (defaults to console.log) with my own thing */
globalThis.log = log;

/* Theme */
globalThis.systemTheme = Variable(`${UserConfig.currentTheme}`);
