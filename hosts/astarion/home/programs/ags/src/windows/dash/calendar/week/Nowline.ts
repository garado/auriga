/**
 * █▄░█ █▀█ █░█░█ █░░ █ █▄░█ █▀▀
 * █░▀█ █▄█ ▀▄▀▄▀ █▄▄ █ █░▀█ ██▄
 *
 * Current time indicator
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";
import Calendar from "@/services/Calendar";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const cal = Calendar.get_default();

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Draw function for nowline (current time indicator)
 */
const drawNowline = (self: any, cr: any, w: number, h: number) => {
  if (cal.weekDates.includes(cal.today)) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // Day of week as integer 0-6

    const timeProgress = (currentHour + currentMinute / 60) / 24;
    const nowX = currentDay * (w / 7);
    const nowY = timeProgress * h;

    // Get nowline color from CSS
    const styles = self.get_style_context();
    const fg = styles.get_color();
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, 1);

    cr.setLineWidth(2); // Thicker than grid lines

    cr.moveTo(nowX, nowY);
    cr.lineTo(nowX + w / 7, nowY);
    cr.stroke();

    // Small circle at start of indicator
    cr.arc(nowX, nowY, 6, 0, 2 * Math.PI);
    cr.fill();
  }
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Nowline = () => {
  const DrawingArea = astalify(Gtk.DrawingArea);

  return DrawingArea({
    canTarget: false,
    cssClasses: ["nowline"],
    setup: (self) => {
      self.set_draw_func(drawNowline);
      cal.connect("notify::week-dates", () => {
        self.queue_draw();
      });
    },
  });
};
