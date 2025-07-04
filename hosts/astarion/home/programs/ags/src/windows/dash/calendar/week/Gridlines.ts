/* █▀▀ █▀█ █ █▀▄ █░░ █ █▄░█ █▀▀ █▀ */
/* █▄█ █▀▄ █ █▄▀ █▄▄ █ █░▀█ ██▄ ▄█ */

import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { uiVars } from "@/services/Calendar";

const DrawingArea = astalify(Gtk.DrawingArea);

/**
 * The gridLines underneath the day columns.
 */
export const Gridlines = () => {
  const cal = Calendar.get_default();

  return DrawingArea({
    vexpand: true,
    visible: true,
    cssClasses: ["weekview-gridlines"],
    setup: (self) => {
      const drawFn = (self, cr, w, h) => {
        if (self.resized == undefined) {
          self.heightRequest = h * uiVars.heightScale;
          self.resized = true;
        }

        /* Get the color used for the weekview-gridlines class */
        const styles = self.get_style_context();
        const fg = styles.get_color();
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, 1);

        /* Draw horizontal lines to separate hours */
        let y = 0;
        cr.moveTo(0, y);
        for (let _ = 0; _ < 24; _++) {
          cr.lineTo(w, y);
          y += h / 24;
          cr.moveTo(0, y);
        }

        /* Draw vertical lines to separate days */
        let x = 0;
        cr.moveTo(x, 0);

        for (let i = 0; i < 8; i++) {
          cr.lineTo(x, h);
          x += w / 7;
          cr.moveTo(x, 0);
        }

        cr.stroke();
      };

      self.set_draw_func(drawFn);
    },
  });
};
