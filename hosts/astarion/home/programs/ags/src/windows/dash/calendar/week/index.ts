/**
 * █░█░█ █▀▀ █▀▀ █▄▀
 * ▀▄▀▄▀ ██▄ ██▄ █░█
 *
 * Entry point for dashboard calendar tab's "Week" page.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gridlines } from "@/windows/dash/calendar/week/Gridlines";
import { MultiDayEvents } from "@/windows/dash/calendar/week/MultiDayEvents";
import { WeekGrid } from "@/windows/dash/calendar/week/WeekGrid";
import { astalify, Gtk, Widget } from "astal/gtk4";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import { WeekDateHeaders } from "./WeekDateHeaders";
import Calendar from "@/services/Calendar";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const KEYBINDS = {
  PREV_WEEK: "h",
  NEXT_WEEK: "l",
} as const;

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Week = () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);

  // Instantiate components
  const _WeekDateHeaders = WeekDateHeaders();
  const _MultiDayEvents = MultiDayEvents();
  const _WeekGridContent = WeekGrid();
  const _Gridlines = Gridlines();

  const WeekGridContainer = Scrollable({
    vexpand: true,
    hexpand: true,
    visible: true,
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    child: Widget.Overlay({
      child: _Gridlines,
      setup: (self) => {
        self.add_overlay(_WeekGridContent);
      },
    }),
  });

  return Widget.Box({
    name: "week",
    cssClasses: ["week"],
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [_WeekDateHeaders, _MultiDayEvents, WeekGridContainer],
    setup: (self) => {
      setupEventController({
        widget: self,
        forwardTarget: _WeekGridContent,
        binds: {
          [KEYBINDS.PREV_WEEK]: () => {
            Calendar.get_default().iterWeek(-1);
          },
          [KEYBINDS.NEXT_WEEK]: () => {
            Calendar.get_default().iterWeek(1);
          },
        },
      });
    },
  });
};
