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

import { Schedule } from "@/windows/dash/calendar/schedule/Schedule";
import { DashTabLayout } from "@/components/DashTabLayout";
import { Week } from "./week";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () => {
  return DashTabLayout({
    name: "Calendar",
    cssClasses: ["calendar"],
    pages: [
      { name: "Week", ui: Week },
      { name: "Schedule", ui: Schedule },
    ],
  });
};
