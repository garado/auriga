import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { DAY_NAMES } from "@/services/Calendar";
import { Gridlines } from "@/windows/dash/calendar/week/Gridlines";

/**
 * The labels above every day column indicating the day and weekday.
 */
export const DateLabels = () => {
  const cal = Calendar.get_default();

  return Widget.Box({
    homogeneous: true,

    setup: (self) => {
      for (let i = 0; i < 7; i++) {
        const name = Widget.Label({
          cssClasses: ["day-name"],
          label: `${DAY_NAMES[i]}`,
        });

        const number = Widget.Label({
          cssClasses: ["number"],
        });

        const dateLabel = Widget.Box({
          cssClasses: [
            "date-label",
            // CalSvc.viewrange[i] == CalSvc.today ? "active" : "",
          ],
          vertical: true,
          children: [name, number],
        });

        self.append(dateLabel);
      }
    },
  });
};
