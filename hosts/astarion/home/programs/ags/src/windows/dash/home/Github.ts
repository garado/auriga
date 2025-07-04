/* █▀▀ █ ▀█▀ █░█ █░█ █▄▄   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █ █▄▄ █▀ */
/* █▄█ █ ░█░ █▀█ █▄█ █▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █ █▄█ ▄█ */

/* Github contributions widget.
 * @TODO This needs serious optimization. */

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { Variable, bind } from "astal";
import { exec, execAsync } from "astal/process";

const DrawingArea = astalify(Gtk.DrawingArea);
const Grid = astalify(Gtk.Grid);

const contribData = Variable({});
const contribCount = Variable(0);

const MAX_CONTRIB_BOXES = 180;
const NUM_ROWS = 7;
const SQUARE_WIDTH = 10;
const SQUARE_SPACING = 6;

/* Populate the contribData and contribCount variables */
const url = "/tmp/ags/github/2025-02-08";
execAsync(`bash -c 'cat ${url}'`)
  .then((x) => {
    const out = JSON.parse(x);

    /* API returns data for the entire year including days
     * in the future, so remove the last (365 - day of year) entries. */
    const daysLeftInYear = 365 - Number(exec("date +%j"));
    contribData.set(out.contributions.slice(daysLeftInYear));

    /* Count total contribs */
    let _contribCount = 0;
    out.years.forEach((y: number) => (_contribCount += y.total));
    contribCount.set(_contribCount);
  })
  .catch((err) => print(err));

/* Widget for a single contrib square */
const ContribBox = (intensity = 0) =>
  DrawingArea({
    cssClasses: [`intensity-${intensity}`],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    setup: (self) => {
      const styles = self.get_style_context();
      const fg = styles.get_color();

      /* Size */
      const w = SQUARE_WIDTH;
      self.set_size_request(SQUARE_WIDTH, SQUARE_WIDTH);

      self.set_draw_func((_, cr) => {
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
        cr.rectangle(0, 0, SQUARE_WIDTH, SQUARE_WIDTH);
        cr.fill();
      });
    },
  });

/* Squares representing contribution amounts for each day */
const ContribGrid = () =>
  Grid({
    hexpand: true,
    vexpand: false,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    rowSpacing: SQUARE_SPACING,
    columnSpacing: SQUARE_SPACING,
    cssClasses: ["contrib-container"],
    setup: (self) =>
      hook(self, contribData, (self) => {
        for (let i = 0; i < NUM_ROWS; i++) {
          self.insert_row(i);
        }

        const numCols = Math.ceil(MAX_CONTRIB_BOXES / NUM_ROWS);
        for (let i = 0; i < numCols; i++) {
          self.insert_column(i);
        }

        const span = 1;

        for (let i = 0; i < MAX_CONTRIB_BOXES; i++) {
          const intensity = contribData.get()[i].intensity;
          self.attach(
            ContribBox(intensity),
            Math.floor(i / NUM_ROWS),
            i % NUM_ROWS,
            span,
            span,
          );
        }
      }),
  });

const TotalContribs = () =>
  Widget.Label({
    cssClasses: ["header"],
    label: bind(contribCount).as((value) => value.toString()),
  });

export const Github = () =>
  Widget.Box({
    cssClasses: ["github", "widget-container"],
    hexpand: true,
    vertical: true,
    spacing: 2,
    children: [
      TotalContribs(),
      Widget.Label({
        cssClasses: ["subheader"],
        label: "total lifetime contributions",
      }),
      ContribGrid(),
    ],
  });
