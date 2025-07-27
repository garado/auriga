/**
 * █▀▀ █ ▀█▀ █░█ █░█ █▄▄   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █ █▄▄ █▀
 * █▄█ █ ░█░ █▀█ █▄█ █▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █ █▄█ ▄█
 *
 * Github contributions widget.
 *
 * @TODO This needs serious optimization.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { Variable, bind } from "astal";
import { exec, execAsync } from "astal/process";
import SettingsManager from "@/services/settings";
import { getCairoColorFromClass } from "@/utils/Helpers";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const DrawingArea = astalify(Gtk.DrawingArea);

const contribData = Variable({});
const contribCount = Variable(0);

const MAX_INTENSITY = 5;
const MAX_CONTRIB_BOXES = 180;
const NUM_ROWS = 7;
const SQUARE_WIDTH = 10;
const SQUARE_SPACING = 8;

let intensityColors = {};

// Populate the contribData and contribCount variables
// @TODO This is hardcoded
const url = "/tmp/ags/github/2025-07-27";

execAsync(`bash -c 'cat ${url}'`)
  .then((x) => {
    const out = JSON.parse(x);

    // API returns data for the entire year including days in the future
    // so remove the last (365 - day of year) entries
    const daysLeftInYear = 365 - Number(exec("date +%j"));
    contribData.set(out.contributions.slice(daysLeftInYear));

    // Count total contribs
    let _contribCount = 0;
    out.years.forEach((y) => (_contribCount += y.total));
    contribCount.set(_contribCount);
  })
  .catch((err) => print(err));

const cacheIntensityColors = () => {
  intensityColors = Array.from({ length: MAX_INTENSITY }, (_, i) =>
    getCairoColorFromClass(`intensity-${i}`),
  );
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/* Widget for a single contrib square */
const ContribBox = (intensity = 0) =>
  DrawingArea({
    cssClasses: [`intensity-${intensity}`],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    setup: (self) => {
      const styles = self.get_style_context();
      const fg = styles.get_color();

      // Size
      self.set_size_request(SQUARE_WIDTH, SQUARE_WIDTH);

      self.set_draw_func((_, cr: any) => {
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
        cr.rectangle(0, 0, SQUARE_WIDTH, SQUARE_WIDTH);
        cr.fill();
      });
    },
  });

const ContribGrid = () =>
  DrawingArea({
    cssClasses: ["contrib-container"],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    setup: (self) => {
      cacheIntensityColors();

      const totalWidth =
        Math.ceil(MAX_CONTRIB_BOXES / NUM_ROWS) *
          (SQUARE_WIDTH + SQUARE_SPACING) -
        SQUARE_SPACING;

      const totalHeight =
        NUM_ROWS * (SQUARE_WIDTH + SQUARE_SPACING) - SQUARE_SPACING;

      self.set_size_request(totalWidth, totalHeight);

      self.set_draw_func((_, cr: any) => {
        const data = contribData.get();

        for (let i = 0; i < Math.min(MAX_CONTRIB_BOXES, data.length); i++) {
          const col = Math.floor(i / NUM_ROWS);
          const row = i % NUM_ROWS;
          const x = col * (SQUARE_WIDTH + SQUARE_SPACING);
          const y = row * (SQUARE_WIDTH + SQUARE_SPACING);

          const intensity = Math.min(
            data[i]?.intensity || 0,
            intensityColors.length - 1,
          );
          const color = intensityColors[intensity];

          cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha);
          cr.rectangle(x, y, SQUARE_WIDTH, SQUARE_WIDTH);
          cr.fill();
        }
      });

      hook(self, contribData, () => self.queue_draw());

      SettingsManager.get_default().connect("notify::current-theme", () => {
        cacheIntensityColors();
      });
    },
  });

/*****************************************************************************
 * Composition
 *****************************************************************************/

export const Github = () =>
  Widget.Box({
    cssClasses: ["github", "widget-container"],
    hexpand: true,
    vertical: true,
    spacing: 2,
    children: [
      Widget.Label({
        cssClasses: ["header"],
        label: bind(contribCount).as((value) => value.toString()),
      }),
      Widget.Label({
        cssClasses: ["subheader"],
        label: "total lifetime contributions",
      }),
      ContribGrid(),
    ],
  });
