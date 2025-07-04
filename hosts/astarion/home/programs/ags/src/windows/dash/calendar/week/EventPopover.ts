import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { Event } from "@/services/Calendar";

/**
 * For editing a
 */
export const EventPopover = (event: Event) => {
  const Popover = astalify(Gtk.Popover);

  const Pop = Popover({
    child: Widget.Label({
      label: event.description,
    }),
  });

  return Pop;
};
