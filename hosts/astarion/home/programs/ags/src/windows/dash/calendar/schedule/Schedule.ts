/**
 * █▀ █▀▀ █░█ █▀▀ █▀▄ █░█ █░░ █▀▀
 * ▄█ █▄▄ █▀█ ██▄ █▄▀ █▄█ █▄▄ ██▄
 *
 * A page in the Calendar tab showing upcoming events in a list format.
 * Very WIP.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import Calendar from "@/services/Calendar";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const WIDGET_SPACING = 20;

export const Schedule = () => {
  return Widget.Label({
    label: "Schedule",
  });
};
