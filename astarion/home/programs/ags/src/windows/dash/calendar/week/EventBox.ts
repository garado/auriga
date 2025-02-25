/* █▀▀ █░█ █▀▀ █▄░█ ▀█▀ █▄▄ █▀█ ▀▄▀ */
/* ██▄ ▀▄▀ ██▄ █░▀█ ░█░ █▄█ █▄█ █░█ */

import { App, Gtk, Gdk, Widget, astalify, hook } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { Event } from "@/services/Calendar";

/*****************************************************
 * HELPER FUNCTIONS
 *****************************************************/

class DragData {
  x: number = 0;
  y: number = 0;
  dx: number = 0;
  dy: number = 0;
  dragging: boolean = false;
  parentTotalWidth: number = 0;
  parentTotalHeight: number = 0;
}

const coordToFloatHour = (dragData: DragData): number => {
  return (
    Math.round(
      (((dragData.y + dragData.dy) / dragData.parentTotalHeight) * 24) / 0.25,
    ) * 0.25
  );
};

const coordToWeekday = (dragData: DragData): number => {
  return Math.round(
    ((dragData.x + dragData.dx) / dragData.parentTotalWidth) * 7,
  );
};

/*****************************************************
 * WIDGET DEFINITION
 *****************************************************/

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

  /* Attempting to make a responsive widget */
  const isVertical = event.endFH - event.startFH > 0.75;

  const ebox = Widget.Box({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    vertical: isVertical,
    vexpand: false,
    cssClasses: ["eventbox", event.calendar],
    canFocus: true,
    heightRequest: (event.endFH - event.startFH) * (dayHeight / 24),
    children: [title],
    setup: (self) => {
      if (event.endFH - event.startFH > 0.75) {
        self.append(times);
        self.append(location);
      }
    },
  });

  ebox.event = event;

  /* Set up drag-and-drop */
  const drag = new Gtk.GestureDrag();
  const dragData = new DragData();

  /* Handle drag start */
  drag.connect("drag-begin", (_, x, y) => {
    ebox.add_css_class("dragging");

    dragData.dragging = true;

    dragData.parentTotalWidth = ebox.get_parent()!.get_allocated_width();
    dragData.parentTotalHeight = ebox.get_parent()!.get_allocated_height();

    [dragData.x, dragData.y] = ebox.get_parent()!.get_child_position(ebox);
  });

  /* Handle drag update */
  drag.connect("drag-update", (_, dx, dy) => {
    if (!dragData.dragging) return;

    dragData.dx = dx;
    dragData.dy = dy;

    dragData.x = coordToWeekday(dragData) * (dragData.parentTotalWidth / 7);
    dragData.y = coordToFloatHour(dragData) * (dragData.parentTotalHeight / 24);

    /* Stay within bounds */
    dragData.x < 0 ? (dragData.x = 0) : dragData.x;

    ebox.get_parent().move(ebox, dragData.x, dragData.y);

    /* Update label */
    const startH = Math.floor(coordToFloatHour(dragData))
      .toString()
      .padStart(2, "0");

    const startM = ((coordToFloatHour(dragData) % 1) * 60)
      .toString()
      .padStart(2, "0");

    const endH = Math.floor(coordToFloatHour(dragData) + event.durationFH)
      .toString()
      .padStart(2, "0");

    const endM = (((coordToFloatHour(dragData) + event.durationFH) % 1) * 60)
      .toString()
      .padStart(2, "0");

    times.label = `${startH}:${startM} - ${endH}:${endM}`;
  });

  /* Handle drag end */
  drag.connect("drag-end", () => {
    ebox.remove_css_class("dragging");
    dragData.dragging = false;
  });

  ebox.add_controller(drag);
  return ebox;
};
