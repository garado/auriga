/**
 * ▄▀█ █▀█ █▀█
 * █▀█ █▀▀ █▀▀
 *
 * Entry point for agsv2 desktop config.
 */

const initProfiler = {
  start: GLib.get_monotonic_time(),
  lastMark: GLib.get_monotonic_time(),

  mark(name: string) {
    const now = GLib.get_monotonic_time();
    const totalElapsed = (now - this.start) / 1000;
    const sinceLastMark = (now - this.lastMark) / 1000;

    console.log(
      `⏱️  ${totalElapsed.toFixed(2)}ms (+${sinceLastMark.toFixed(2)}ms) - ${name}`,
    );

    this.lastMark = now;
  },
};

initProfiler.mark("Begin");

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, App } from "astal/gtk4";
import { GLib } from "astal";
import { exec } from "astal/process";
import { idle, timeout } from "astal/time";

initProfiler.mark("Core imports end");

import "@/globals.ts";
import Bar from "@/windows/bar";
import Dash from "@/windows/dash";
import Utility from "@/windows/utility";
import Control from "@/windows/control";
import Launcher from "@/windows/launcher";
import Notifications from "@/windows/notifications";

initProfiler.mark("Custom imports end");

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const TOGGLEABLE_WINDOWS = ["dash", "utility", "control", "launcher"];

// @TODO Migrate to using window_names everywhere
export const WINDOW_NAMES = {
  UTILITY: "utility",
  DASHBOARD: "dash",
  CONTROL: "control",
  LAUNCHER: "launcher",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Hide/show window with revealer
 */
const toggleWindow = (windowName: string) => {
  const win = App.get_window(windowName);

  if (win!.visible) {
    closeWindow(windowName);
  } else {
    openWindow(windowName);
  }
};

/**
 * Close window
 */
const closeWindow = (windowName: string) => {
  const win = App.get_window(windowName);
  (win!.child as Gtk.Revealer).revealChild = false;
  timeout(260, () => win!.hide());
};

/**
 * Open window and close all others
 */
const openWindow = (windowName: string) => {
  const win = App.get_window(windowName);

  /* Close all other windows */
  TOGGLEABLE_WINDOWS.filter((w) => w != windowName).forEach(closeWindow);

  /* Open window */
  App.get_window(windowName)!.show();
  (win!.child as Gtk.Revealer).revealChild = true;
};

const compileSASS = () => {
  exec(`sass ${SRC}/src/styles/main.sass /tmp/ags/style.css`);
};

/*****************************************************************************
 * Main content
 *****************************************************************************/

initProfiler.mark("Starting config");

compileSASS();

initProfiler.mark("SASS compiled");

App.start({
  css: "/tmp/ags/style.css",
  icons: `${SRC}/assets/icons/`,
  requestHandler(request: string, res: (response: any) => void) {
    const [command, ...args] = request.split(" ");

    if (command == "toggle-window" && args.length == 1) {
      toggleWindow(args[0]);
    }

    res("Unhandled command");
  },
  main() {
    initProfiler.mark("App start called");

    App.get_monitors().map(Bar);
    initProfiler.mark("Bar");

    App.get_monitors().map(Dash);

    initProfiler.mark("Dash");
    App.get_monitors().map(Utility);
    initProfiler.mark("Utils");
    App.get_monitors().map(Control);
    initProfiler.mark("Control");
    App.get_monitors().map(Launcher);
    initProfiler.mark("Launcher");
    App.get_monitors().map(Notifications);
    initProfiler.mark("Notifs");

    initProfiler.mark("All widgets created");

    // Check when actually rendered
    idle(() => {
      initProfiler.mark("First idle callback");
      timeout(50, () => {
        initProfiler.mark("UI should be visible now");
      });
    });
  },
});

Object.assign(App, {
  toggleWindow: toggleWindow,
  closeWindow: closeWindow,
  openWindow: openWindow,
});
