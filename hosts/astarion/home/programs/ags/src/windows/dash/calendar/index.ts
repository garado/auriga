/**
 * █▀▀ ▄▀█ █░░ █▀▀ █▄░█ █▀▄ ▄▀█ █▀█
 * █▄▄ █▀█ █▄▄ ██▄ █░▀█ █▄▀ █▀█ █▀▄
 *
 * Entry point for dashboard calendar tab.
 *
 * Includes:
 *    - Week view page: Typical 7-day calendar view
 *    - Schedule page: List view of scheduled events
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { bind } from "astal";

import { Schedule } from "@/windows/dash/calendar/schedule";
import { DashTabLayout } from "@/components/DashTabLayout";
import { Week } from "./week";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import Calendar from "@/services/Calendar";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const KEYBINDS = {
  REFRESH_DATA: "r",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Get a formatted month-year string given a set of dates within a week
 * @returns {string} Formatted month-year string
 */
const tabNameTransform = (weekDates: string[]): string => {
  if (!weekDates || weekDates.length === 0) return "Calendar";

  const firstDate = new Date(weekDates[0] + "T00:00:00");
  const lastDate = new Date(weekDates[weekDates.length - 1] + "T00:00:00");

  // Get month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const firstMonth = monthNames[firstDate.getMonth()];
  const lastMonth = monthNames[lastDate.getMonth()];
  const year = firstDate.getFullYear();

  if (firstDate.getMonth() === lastDate.getMonth()) {
    return `${firstMonth} ${year}`;
  } else {
    const lastYear = lastDate.getFullYear();
    if (year === lastYear) {
      return `${firstMonth} - ${lastMonth} ${year}`;
    } else {
      return `${firstMonth} ${year} - ${lastMonth} ${lastYear}`;
    }
  }
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () => {
  const calendarTab = DashTabLayout({
    name: bind(Calendar.get_default(), "weekDates").as((weekDates) =>
      tabNameTransform(weekDates),
    ),
    cssClasses: ["calendar"],
    pages: [
      { name: "Week", ui: Week },
      { name: "Schedule", ui: Schedule },
    ],
    actions: [{ name: "hi", action: () => {} }],
  });

  setupEventController({
    widget: calendarTab,
    binds: {
      [KEYBINDS.REFRESH_DATA]: () => {
        Calendar.get_default().updateCache();
      },
    },
  });

  return calendarTab;
};
