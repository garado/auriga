/**
 * █▀▀ █░░ █▀█ █▄▄ ▄▀█ █░░ █▀
 * █▄█ █▄▄ █▄█ █▄█ █▀█ █▄▄ ▄█
 *
 * Global functions/definitions for project.
 */

/*****************************************************************************
 * Globals
 *****************************************************************************/

/** Logging flags to enable targeted module debugging. */
const logFlags: { [key: string]: boolean } = {
  // Main execution (windows opening, SASS reload, etc)
  program: false,
  bar: false,
  notrofi: false,
  kitty: false,
  notif: false,

  // Dashboard stuff
  dash: false,
  goalTab: false,
  calTab: false,

  // Other stuff
  ctrlGemini: false,

  // Service logging
  dashService: false,
  taskService: true,
  calService: false,
  goalService: false,
  habitifyService: false,
  lifeService: false,
  ledgerService: false,

  eventControllerKey: false,
};

/**
 * Usage:
 * log('goalService', 'log message here')
 *
 * The above will be displayed if the `goalService` flag is true.
 */
export function log(section: string, str: string) {
  if (logFlags[section]) {
    console.log(`${section.toUpperCase()}: ${str}`);
  }
}

/** Add things to globalThis so they can be used anywhere. */
Object.assign(globalThis, {
  log: log,
});
