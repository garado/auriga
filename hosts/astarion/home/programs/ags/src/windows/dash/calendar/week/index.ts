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
import { GLib } from "astal";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const KEYBINDS = {
  PREV_WEEK: "h",
  NEXT_WEEK: "l",
  CURR_WEEK: "gg",
  SCROLL_UP: "k",
  SCROLL_DOWN: "j",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Smoothly scroll a ScrolledWindow up or down by a small amount
 *
 * @param scrolledWindow - The Gtk.ScrolledWindow to scroll
 * @param direction - 1 for down, -1 for up
 * @param amount - How much to scroll (default: 50 pixels)
 * @param duration - Animation duration in milliseconds (default: 200ms)
 */
export function smoothScroll(
  scrolledWindow: Gtk.ScrolledWindow,
  direction: number,
  amount: number = 50,
  duration: number = 200,
): void {
  const vAdjustment = scrolledWindow.get_vadjustment();
  const startValue = vAdjustment.get_value();
  const targetValue = Math.max(
    0,
    Math.min(
      startValue + direction * amount,
      vAdjustment.get_upper() - vAdjustment.get_page_size(),
    ),
  );

  // If no change needed, return early
  if (Math.abs(targetValue - startValue) < 1) return;

  const startTime = Date.now();
  const totalDistance = targetValue - startValue;

  const animate = (): boolean => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out animation curve
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    const currentValue = startValue + totalDistance * easedProgress;
    vAdjustment.set_value(currentValue);

    // Continue animation if not complete
    return progress < 1;
  };

  // Start the animation loop
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, animate);
}

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

  const weekGridContainer = Scrollable({
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
    children: [_WeekDateHeaders, _MultiDayEvents, weekGridContainer],
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
          [KEYBINDS.CURR_WEEK]: () => {
            Calendar.get_default().jumpToToday();
          },
          [KEYBINDS.SCROLL_UP]: () => {
            smoothScroll(weekGridContainer, -1, 200, 150);
          },
          [KEYBINDS.SCROLL_DOWN]: () => {
            smoothScroll(weekGridContainer, 1, 200, 150);
          },
        },
      });
    },
  });
};
