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

import { Schedule } from "@/windows/dash/calendar/schedule";
import { DashTabLayout } from "@/components/DashTabLayout";
import { Week } from "./week";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import Calendar from "@/services/Calendar";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () => {
  const calendarTab = DashTabLayout({
    name: "Calendar",
    cssClasses: ["calendar"],
    pages: [
      { name: "Week", ui: Week },
      { name: "Schedule", ui: Schedule },
    ],
  });

  setupEventController({
    widget: calendarTab,
    binds: {
      r: () => {
        Calendar.get_default().updateCache();
      },
    },
  });

  return calendarTab;
};
