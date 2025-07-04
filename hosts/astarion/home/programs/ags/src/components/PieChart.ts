/* █▀█ █ █▀▀   █▀▀ █░█ ▄▀█ █▀█ ▀█▀ */
/* █▀▀ █ ██▄   █▄▄ █▀█ █▀█ █▀▄ ░█░ */

/**
 * Pie chart and optional legend widget.
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

import { Gtk, Widget, astalify } from "astal/gtk4";

const DrawingArea = astalify(Gtk.DrawingArea);

const MAX_NUM_SLICE_COLORS = 11;

/*****************************************
 * CUSTOM TYPES
 *****************************************/

export type PieChartData = {
  category: string;
  total: number;
};

/*****************************************
 * UTILS
 *****************************************/

/**
 * Given class names as a string, get the CSS 'color' value.
 */
const getCairoColorFromClass = (...rest: Array<string>) => {
  /* @TODO Check if there is a better way to do this in Gtk4 */
  const dummyWidget = new Gtk.Box();
  const dummyContext = dummyWidget.get_style_context();

  for (const c of rest) {
    dummyContext.add_class(c);
  }

  return dummyContext.get_color();
};

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

/*****************************************
 * WIDGETS
 *****************************************/

/**
 * Draw a simple dot with Cairo.
 * Use for pie chart legend.
 */
const Dot = (className: string) =>
  DrawingArea({
    cssClasses: className ? [className] : [""],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    setup: (self) => {
      const w = 14;
      self.set_size_request(w, w);
      self.set_draw_func((_, cr) => {
        const styles = self.get_style_context();
        const fg = styles.get_color();
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);

        /* Draw a dot */
        const center = w / 2;
        const rad = w / 3;
        const angle1 = 0;
        const angle2 = 2 * Math.PI;

        /* It's slightly off-center (vertically) so offset yc by 1 */
        cr.arc(center, center + 1, rad, angle1, angle2);

        cr.fill();
        cr.stroke();
      });
    },
  });

/**
 * A single entry in the legend.
 */
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
  const Pie = DrawingArea({
    widthRequest: 200,
    heightRequest: 200,
    setup: (self) => {
      /* Cache pie colors to avoid having to fetch them each draw */
      self.pieColors = cachePieColors();

      // globalThis.systemTheme.connect('changed', () => {
      //   self.pieColors = cachePieColors()
      // })

      /* @TODO: Figure out how to set draw function using a property... */
      self.set_draw_func((self, cr, w, h) => {
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

        let r = 1; // to change color
        let lastAngle = 0;

        for (let i = 0; i < props.values.length; i++) {
          /* Apply new color */
          const clr = self.pieColors[i];
          cr.setSourceRGBA(clr.red, clr.green, clr.blue, 1);

          /* Max angle is Math.PI * 2 */
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

  let children = [Pie];

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
    spacing: 20,
    children: children,
  });
};
