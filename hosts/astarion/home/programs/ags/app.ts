/**
 * ▄▀█ █▀█ █▀█
 * █▀█ █▀▀ █▀▀
 *
 * Entry point for agsv2 desktop config.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, App } from "astal/gtk4";
import { exec } from "astal/process";
import { timeout } from "astal/time";

import "@/globals.ts";
import Bar from "@/windows/bar";
import Dash from "@/windows/dash";
import Utility from "@/windows/utility";
import Control from "@/windows/control";
import Launcher from "@/windows/launcher";
import Notifications from "@/windows/notifications";

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

compileSASS();

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
    App.get_monitors().map(Bar);
    App.get_monitors().map(Dash);
    App.get_monitors().map(Utility);
    App.get_monitors().map(Control);
    App.get_monitors().map(Launcher);
    App.get_monitors().map(Notifications);
  },
});

Object.assign(App, {
  toggleWindow: toggleWindow,
  closeWindow: closeWindow,
  openWindow: openWindow,
});
