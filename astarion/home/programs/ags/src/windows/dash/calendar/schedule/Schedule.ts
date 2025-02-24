import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import Calendar from "@/services/Calendar";

const WIDGET_SPACING = 20;

export const Schedule = () => {
  return Widget.Label({
    label: "Schedule",
  });
};
