/**
 * █░█ █ █▀ █░█ ▄▀█ █░░ █ ▀█ █▀▀ █▀█
 * ▀▄▀ █ ▄█ █▄█ █▀█ █▄▄ █ █▄ ██▄ █▀▄
 *
 * Music visualizer widget.
 * I think I got this from Kotontrion or someone else on the astal discord - I don't remember.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";
import AstalCava from "gi://AstalCava?version=0.1";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Visualizer = (props: {
  bars: number;
  barHeight: number;
  smooth: boolean;
}) => {
  const DrawingArea = astalify(Gtk.DrawingArea);
  const cava = AstalCava.get_default();

  props.bars = props.bars ? props.bars : 20;
  props.barHeight = props.barHeight ? props.barHeight : 100;

  /**
   * Update visualizer widget.
   *
   * @param self
   * @param cr - Cairo context
   */
  const onDraw = (self: Gtk.DrawingArea, cr: any) => {
    const context = self.get_style_context();
    const h = self.get_allocated_height();
    const w = self.get_allocated_width();

    const fg = context.get_color();
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);

    let lastX = 0;
    let lastY = h - h * (cava!.get_values()[0] / props.barHeight);

    cr.moveTo(lastX, lastY);

    for (let i = 1; i < cava!.get_values().length; i++) {
      const height = h * (cava!.get_values()[i] / props.barHeight);
      let y = h - height;

      cr.curveTo(
        lastX + w / (props.bars - 1) / 2,
        lastY,
        lastX + w / (props.bars - 1) / 2,
        y,
        i * (w / (props.bars - 1)),
        y,
      );

      lastX = i * (w / (props.bars - 1));
      lastY = y;
    }

    cr.lineTo(w, h);
    cr.lineTo(0, h);
    cr.fill();
  };

  return DrawingArea({
    vexpand: true,
    hexpand: true,
    cssClasses: ["visualizer"],
    setup: (self) => {
      self.set_draw_func(onDraw);

      cava?.connect("notify::values", () => {
        self.queue_draw();
      });
    },
  });
};
