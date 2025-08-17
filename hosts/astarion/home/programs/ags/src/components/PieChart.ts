/**
 * █▀█ █ █▀▀   █▀▀ █░█ ▄▀█ █▀█ ▀█▀
 * █▀▀ █ ██▄   █▄▄ █▀█ █▀█ █▀▄ ░█░
 *
 * Pie chart widget and optional legend widget.
 *
 * To change the pie slice colors, in your CSS, define:
 * ```
 * .pie-slice-1
 *    color: red;
 *
 * .pie-slice-2
 *    color: blue;
 * ````
 *
 * You can change MAX_NUM_SLICE_COLORS to add more slice colors.
 *
 * Sample widget usage:
 * ```
 * const chartValues = [
 *    {
 *      category: 'First slice',
 *      total: 20301,
 *    },
 *    {
 *      category: 'Second slice',
 *      total: 1203,
 *    }
 * ]
 *
 * const PieChartAndLegend = PieChart({
 *    values: chartValues,
 *    drawLegend: true,
 *    vertical: true,
 * })
 * ```
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import SettingsManager from "@/services/settings";
import { getCairoColorFromClass } from "@/utils/Helpers";
import { Gtk, Widget, astalify } from "astal/gtk4";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const DrawingArea = astalify(Gtk.DrawingArea);

const MAX_NUM_SLICE_COLORS = 11;

const DOT_SIZE = 14;
const DOT_RADIUS_DIVISOR = 3;
const DEFAULT_SPACING = 20;

/*****************************************************************************
 * Types/interfaces
 *****************************************************************************/

export type PieChartData = {
  category: string;
  total: number;
};

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Calculate and store pie colors.
 * This is used to avoid having to getCairoColorFromClass() on every
 * draw. Doing that is inefficient and also buggy.
 * @TODO Need to clean this up a bit; don't hardcode # pie colors
 */
const cachePieColors = () => {
  const pieColors = [];

  for (let i = 0; i < MAX_NUM_SLICE_COLORS; i++) {
    pieColors.push(getCairoColorFromClass(`pie-slice-${i}`));
  }

  return pieColors;
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/* Draw a simple dot with Cairo. Use for pie chart legend. */
const Dot = (className: string) =>
  DrawingArea({
    cssClasses: className ? [className] : [""],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    setup: (self) => {
      const w = DOT_SIZE;
      self.set_size_request(w, w);
      self.set_draw_func((_, cr: any) => {
        const styles = self.get_style_context();
        const fg = styles.get_color();
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);

        // Draw a dot
        const center = w / 2;
        const rad = w / DOT_RADIUS_DIVISOR;
        const angle1 = 0;
        const angle2 = 2 * Math.PI;

        // It's slightly off-center for some reason (vertically) so offset yc by 1
        cr.arc(center, center + 1, rad, angle1, angle2);

        cr.fill();
        cr.stroke();
      });
    },
  });

/* A single entry in the legend. */
const LegendEntry = (data: PieChartData, counter = 0) =>
  Widget.Box({
    valign: Gtk.Align.CENTER,
    spacing: 4,
    vertical: false,
    children: [
      Dot(`pie-slice-${counter % MAX_NUM_SLICE_COLORS}`),
      Widget.Box({
        vertical: false,
        children: [
          Widget.Label({ label: data.category }),
          Widget.Label({
            cssClasses: ["amount-text"],
            label: `   ${data.total.toFixed(2)}`,
          }),
        ],
      }),
    ],
  });

export default (props: {
  values: Array<PieChartData>;
  drawLegend?: boolean;
  vertical?: boolean;
}) => {
  const pieColorsMap = new WeakMap();

  const Pie = DrawingArea({
    widthRequest: 200,
    heightRequest: 200,
    setup: (self) => {
      // Cache pie colors to avoid having to fetch them each draw
      pieColorsMap.set(self, cachePieColors());

      SettingsManager.get_default().connect("notify::current-theme", () => {
        pieColorsMap.set(self, cachePieColors());
      });

      // @TODO: Figure out how to set draw function using a property...
      self.set_draw_func((self, cr: any, w, h) => {
        const radius = w / 2;

        const center = {
          x: w / 2,
          y: h / 2,
        };

        cr.setLineWidth(2);

        const maxValue = props.values.reduce(
          (partialSum, a) => partialSum + a.total,
          0,
        );

        let lastAngle = 0;

        for (let i = 0; i < props.values.length; i++) {
          // Apply new color
          const clr = pieColorsMap.get(self)[i];
          cr.setSourceRGBA(clr.red, clr.green, clr.blue, 1);

          // Max angle is Math.PI * 2
          const startAngle = lastAngle;
          const diff = (props.values[i].total / maxValue) * (Math.PI * 2);

          cr.arc(center.x, center.y, radius, startAngle, startAngle + diff);
          cr.lineTo(center.x, center.y);
          cr.fill();

          lastAngle = startAngle + diff;
        }
      });
    },
  });

  let children: (typeof Pie | Gtk.Widget)[] = [Pie];

  if (props.drawLegend) {
    const Legend = Widget.Box({
      vertical: true,
      valign: Gtk.Align.CENTER,
      children: props.values.map(LegendEntry),
    });

    children.push(Legend);
  }

  return Widget.Box({
    orientation: props.vertical ? 1 : 0,
    spacing: DEFAULT_SPACING,
    children: children,
  });
};
