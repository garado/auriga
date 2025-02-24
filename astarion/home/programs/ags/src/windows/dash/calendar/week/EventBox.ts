/* █▀▀ █░█ █▀▀ █▄░█ ▀█▀ █▄▄ █▀█ ▀▄▀ */
/* ██▄ ▀▄▀ ██▄ █░▀█ ░█░ █▄█ █▄█ █░█ */

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { Event } from "@/services/Calendar";

import UserConfig from "../../../../../userconfig.ts";

/**
 * Create a single event box.
 */
export const EventBox = (event: Event, dayHeight: number, dayWidth: number) => {
  const title = Widget.Label({
    cssClasses: ["title"],
    wrap: true,
    xalign: 0,
    label: event.description,
  });

  const times = Widget.Label({
    cssClasses: ["times"],
    wrap: true,
    xalign: 0,
    label: `${event.startTime} - ${event.endTime}`,
  });

  const location = Widget.Label({
    cssClasses: ["location"],
    label: event.location,
    wrap: true,
    xalign: 0,
  });

  /* Adjust color based on which calendar */
  let bgcolor = "";
  if (UserConfig.calendar.colors[event.calendar]) {
    bgcolor = UserConfig.calendar.colors[event.calendar];
  }

  /* Making a responsive widget... */
  const isVertical = event.endFH - event.startFH > 0.75;

  const ebox = Widget.Box({
    vertical: isVertical,
    vexpand: false,
    cssClasses: ["eventbox"],
    canFocus: true,
    heightRequest: (event.endFH - event.startFH) * (dayHeight / 24),
    css: `${bgcolor != "" ? `background-color: ${bgcolor}` : ""}`,
    children: [
      title,
      event.endFH - event.startFH > 0.75 ? times : null,
      event.endFH - event.startFH > 0.75 ? location : null,
    ],
  });

  return ebox;
};
