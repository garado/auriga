/**
 * █▀▀ █▀█ █ █▀▄ █░░ █ █▄░█ █▀▀ █▀
 * █▄█ █▀▄ █ █▄▀ █▄▄ █ █░▀█ ██▄ ▄█
 *
 * Gridlines drawn beneath the week grid, providing visual separation between
 * days and hours.
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
 * Draw function for gridlines
 */
const drawGridlines = (self: any, cr: any, w: number, h: number) => {
  if (self.resized == undefined) {
    self.heightRequest = h * uiVars.heightScale;
    self.resized = true;
  }

  // Get gridline color
  const styles = self.get_style_context();
  const fg = styles.get_color();
  cr.setSourceRGBA(fg.red, fg.green, fg.blue, 1);

  // Draw horizontal lines to separate hours
  let y = 0;
  cr.moveTo(0, y);
  for (let i = 0; i < 24; i++) {
    cr.lineTo(w, y);
    y += h / 24;
    cr.moveTo(0, y);
  }

  // Draw vertical lines to separate days
  let x = 0;
  cr.moveTo(x, 0);
  for (let i = 0; i < 7; i++) {
    cr.lineTo(x, h);
    x += w / 7;
    cr.moveTo(x, 0);
  }
  cr.stroke();
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Gridlines = () => {
  const DrawingArea = astalify(Gtk.DrawingArea);

  return DrawingArea({
    vexpand: true,
    hexpand: true,
    visible: true,
    cssClasses: ["weekview-gridlines"],
    setup: (self) => {
      self.set_draw_func(drawGridlines);
    },
  });
};
