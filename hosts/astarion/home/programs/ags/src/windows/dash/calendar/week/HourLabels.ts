/**
 * █░█ █▀█ █░█ █▀█   █░░ ▄▀█ █▄▄ █▀▀ █░░ █▀
 * █▀█ █▄█ █▄█ █▀▄   █▄▄ █▀█ █▄█ ██▄ █▄▄ ▄█
 *
 * Hour labels overlay for the week calendar view.
 * Shows time labels (00:00, 01:00, etc.) along the left side.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";
import { uiVars } from "@/services/Calendar";

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Format hour for display
 * @param hour - Hour in 24-hour format (0-23)
 * @returns Formatted time string
 */
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const HourLabels = () => {
  const DrawingArea = astalify(Gtk.DrawingArea);
  return DrawingArea({
    widthRequest: uiVars.hourLabelWidthPx,
    vexpand: true,
    hexpand: false,
    canTarget: false,
    cssClasses: ["hour-label"],
    setup: (self) => {
      const drawFn = (self: any, cr: any, _w: number, h: number) => {
        const styles = self.get_style_context();
        const fg = styles.get_color();
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, 0.7);
        cr.selectFontFace("Sans", 0, 0);
        cr.setFontSize(12);

        const hourHeight = h / 24;

        for (let hour = 0; hour < 24; hour++) {
          const y = hour * hourHeight;
          const timeString = formatHour(hour);

          const textExtents = cr.textExtents(timeString);
          const textX = 8;
          const textY = y + textExtents.height; // Slightly below line

          cr.moveTo(textX, textY);
          cr.showText(timeString);
        }
      };

      self.set_draw_func(drawFn);
    },
  });
};
