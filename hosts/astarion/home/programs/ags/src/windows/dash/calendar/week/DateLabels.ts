import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib, bind } from "astal";
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
          label: bind(cal, "viewrange").as((viewrange) =>
            viewrange[i].slice(-2),
          ),
        });

        const dateLabel = Widget.Box({
          cssClasses: bind(cal, "viewrange").as((viewrange) =>
            viewrange[i] == cal.today
              ? ["date-label", "active"]
              : ["date-label"],
          ),
          vertical: true,
          children: [name, number],
        });

        self.append(dateLabel);
      }
    },
  });
};
