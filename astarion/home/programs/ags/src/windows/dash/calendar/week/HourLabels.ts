import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import { DayView } from "@/windows/dash/calendar/week/DayView";
import Calendar from "@/services/Calendar";

export const HourLabels = () => {
  return Widget.Box({
    homogeneous: true,
    vertical: true,
    vexpand: true,
    hexpand: false,
    children: [...Array(24).keys()].map((hour) =>
      Widget.Label({
        label: `${hour}`,
      }),
    ),
  });
};
