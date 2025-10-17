/**
 * ▄▀█ █▀█ █▀█
 * █▀█ █▀▀ █▀▀
 *
 * Entry point for Auriga desktop config.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, App } from "astal/gtk4";
import { exec } from "astal/process";
import { timeout } from "astal/time";

import "@/globals.ts";
import Bar from "@/views/windows/bar";
import Dash from "@/views/windows/dash";
import Utility from "@/views/windows/utility";
import Control from "@/views/windows/control";
import Launcher from "@/views/windows/launcher";
import Notifications from "@/views/windows/notifications";
import { CMD } from "@/utils/Commands";

// Required entrypoint config for sharing modules between Gtk3 lock and Gtk4 app
globalThis.App = App;
globalThis.GtkVersion = 4;

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
export const toggleWindow = (windowName: string) => {
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
  if (win.onClose) win.onClose();
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
  if (win.onOpen) win.onOpen();
};

const compileSASS = () => {
  exec(`${CMD.sass} ${SRC}/src/styles/main.sass /tmp/ags/style.css`);
};

/*****************************************************************************
 * Main content
 *****************************************************************************/

compileSASS();

App.start({
  css: "/tmp/ags/style.css",
  icons: `${SRC}/assets/icons/`,
  instanceName: "app",
  requestHandler(request: string, res: (response: any) => void) {
    const [command, ...args] = request.split(" ");

    if (command == "toggle-window" && args.length == 1) {
      toggleWindow(args[0]);
    }

    res("Unhandled command");
  },
  main() {
    // One instance per monitor
    App.get_monitors().map(Bar);
    App.get_monitors().map(Notifications);

    // These pop up on the same monitor as the cursor
    Dash();
    Utility();
    Control();
    Launcher();
  },
});

Object.assign(App, {
  toggleWindow: toggleWindow,
  closeWindow: closeWindow,
  openWindow: openWindow,
});
