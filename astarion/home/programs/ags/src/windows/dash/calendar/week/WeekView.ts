/**
 * Displays events for a given week.
 */

import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import { Gridlines } from "@/windows/dash/calendar/week/Gridlines";
import { DayView } from "@/windows/dash/calendar/week/DayView";
import Calendar from "@/services/Calendar";

export const WeekView = () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);

  const _Gridlines = Gridlines();

  const _WeekView = Widget.Box({
    homogeneous: true,
    vexpand: true,
    hexpand: false,
    children: [
      DayView(0),
      DayView(1),
      DayView(2),
      DayView(3),
      DayView(4),
      DayView(5),
      DayView(6),
    ],
  });

  return Scrollable({
    vexpand: true,
    hexpand: true,
    visible: true,
    hscrollbarPolicy: Gtk.PolicyType.NEVER,
    vscrollbarPolicy: Gtk.PolicyType.AUTOMATIC,
    child: Widget.Overlay({
      child: _Gridlines,
      setup: (self) => {
        self.add_overlay(_WeekView);
      },
    }),
  });
};
