import { Gtk, App } from "astal/gtk4";
import { GObject } from "astal/gobject";
import { exec } from "astal/process";
import { timeout } from "astal/time";

import "@/globals.ts";
import Bar from "@/windows/bar/Bar.ts";
import Dash from "@/windows/dash/Dash.ts";
import Utility from "@/windows/utility/Utility.ts";
import Control from "@/windows/control/Control.ts";

const TOGGLEABLE_WINDOWS = ["dash", "utility", "control"];

/*******************************************
 * FUNCTIONS
 *******************************************/

/**
 * Hide/show window with revealer
 */
const toggleWindow = (windowName: string) => {
  const win = App.get_window(windowName);

  /* Check if visible */
  let whatthefuck = new GObject.Value();
  win.get_property("visible", whatthefuck);
  const isVisible = whatthefuck.get_boolean();

  if (isVisible) {
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

/*******************************************
 * RUN
 *******************************************/

exec("sass ./src/styles/main.sass /tmp/ags/style.css");

App.start({
  css: "/tmp/ags/style.css",
  icons: "./src/assets/icons/",
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
  },
});
