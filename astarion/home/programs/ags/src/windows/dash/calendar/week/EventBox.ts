/* █▀▀ █░█ █▀▀ █▄░█ ▀█▀ █▄▄ █▀█ ▀▄▀ */
/* ██▄ ▀▄▀ ██▄ █░▀█ ░█░ █▄█ █▄█ █░█ */

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { Event } from "@/services/Calendar";

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

  /* Making a responsive widget... */
  const isVertical = event.endFH - event.startFH > 0.75;

  const ebox = Widget.Box({
    vertical: isVertical,
    vexpand: false,
    cssClasses: ["eventbox", event.calendar],
    canFocus: true,
    heightRequest: (event.endFH - event.startFH) * (dayHeight / 24),
    children: [
      title,
      event.endFH - event.startFH > 0.75 ? times : null,
      event.endFH - event.startFH > 0.75 ? location : null,
    ],
  });

  ebox.event = event;

  return ebox;
};
