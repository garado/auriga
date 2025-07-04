/* █▀▀ █░░ █▀█ █▄▄ ▄▀█ █░░ */
/* █▄█ █▄▄ █▄█ █▄█ █▀█ █▄▄ */

/* Global project definitions */

import { Variable } from "astal";
import UserConfig from "../userconfig.js";

const logFlags: { [key: string]: boolean } = {
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
  taskService: true,
  calService: false,
  goalService: false,
  habitifyService: false,
  lifeService: false,
  ledgerService: false,

  eventControllerKey: false,
};

export function log(section: string, str: string) {
  if (logFlags[section]) {
    console.log(`${section.toUpperCase()}: ${str}`);
  }
}

Object.assign(globalThis, {
  log: log,

  /* Might be able to remove this now that we have the Settings service */
  systemTheme: Variable(`${UserConfig.currentTheme}`),
});
