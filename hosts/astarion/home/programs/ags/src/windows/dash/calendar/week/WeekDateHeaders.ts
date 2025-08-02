/**
 * █░█░█ █▀▀ █▀▀ █▄▀   █▀▄ ▄▀█ ▀█▀ █▀▀   █░█ █▀▀ ▄▀█ █▀▄ █▀▀ █▀█ █▀
 * ▀▄▀▄▀ ██▄ ██▄ █░█   █▄▀ █▀█ ░█░ ██▄   █▀█ ██▄ █▀█ █▄▀ ██▄ █▀▄ ▄█
 *
 * The labels above every day column indicating the day and weekday.
 * Creates a horizontal box with 7 date labels, each showing the day name and date number.
 * The current day is highlighted with an "active" CSS class.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { bind } from "astal";

import Calendar, { DAY_NAMES } from "@/services/Calendar";

/*****************************************************************************
 * Module-level variablse
 *****************************************************************************/

const DAYS_PER_WEEK = 7;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * The labels above every day column indicating the day and weekday.
 * Creates a horizontal box with 7 date labels, each showing the day name and date number.
 *
 * @returns Widget containing date labels for the current week
 */
export const WeekDateHeaders = () => {
  const cal = Calendar.get_default();

  return Widget.Box({
    homogeneous: true,
    hexpand: true,
    setup: (self) => {
      // Create labels for each day of the week
      for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex++) {
        const name = Widget.Label({
          cssClasses: ["day-name"],
          label: `${DAY_NAMES[dayIndex]}`,
        });

        const number = Widget.Label({
          cssClasses: ["number"],
          label: bind(cal, "weekDates").as((weekDates) =>
            weekDates[dayIndex].slice(-2),
          ),
        });

        const dateLabel = Widget.Box({
          cssClasses: bind(cal, "weekDates").as((weekDates) =>
            weekDates[dayIndex] == cal.today
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
