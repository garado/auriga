/**
 * █▀▀ █ ▀█▀ █░█ █░█ █▄▄   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █ █▄▄ █▀
 * █▄█ █ ░█░ █▀█ █▄█ █▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █ █▄█ ▄█
 *
 * Displays Github contributions.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { bind } from "astal";
import SettingsManager from "@/services/settings";
import { getCairoColorFromClass } from "@/utils/Helpers";
import GithubService from "@/services/Github";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const MAX_INTENSITY = 5;
const MAX_CONTRIB_BOXES = 160;
const NUM_ROWS = 7;
const SQUARE_WIDTH = 9;
const SQUARE_SPACING = 8;

const CSS_CLASSES = {
  CONTAINER: "github",
  HEADER: "header",
  SUBHEADER: "subheader",
  CONTRIB_GRID: "contrib-container",
} as const;

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const DrawingArea = astalify(Gtk.DrawingArea);

let github: InstanceType<typeof GithubService> | undefined = undefined;

let intensityColors: string[] = [];
let cachedDrawData: Array<{ intensity: number }> | null = null;

/*****************************************************************************
 * Functions
 *****************************************************************************/

const processCachedData = () => {
  cachedDrawData = github!.contributions
    .slice(0, MAX_CONTRIB_BOXES)
    .map((contrib) => ({
      intensity: Math.min(contrib?.intensity || 0, intensityColors.length - 1),
    }));
};

const cacheIntensityColors = () => {
  intensityColors = Array.from({ length: MAX_INTENSITY }, (_, i) =>
    getCairoColorFromClass(`intensity-${i}`),
  );
  processCachedData();
};

const ContribGrid = () =>
  DrawingArea({
    cssClasses: [CSS_CLASSES.CONTRIB_GRID],
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
        if (!cachedDrawData) return;

        cachedDrawData.forEach((item, i) => {
          const col = Math.floor(i / NUM_ROWS);
          const row = i % NUM_ROWS;
          const x = col * (SQUARE_WIDTH + SQUARE_SPACING);
          const y = row * (SQUARE_WIDTH + SQUARE_SPACING);

          const color = intensityColors[item.intensity];
          cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha);
          cr.rectangle(x, y, SQUARE_WIDTH, SQUARE_WIDTH);
          cr.fill();
        });
      });

      hook(self, github!, "notify::contributions", () => {
        processCachedData();
        self.queue_draw();
      });

      SettingsManager.get_default().connect("notify::current-theme", () => {
        cacheIntensityColors();
        self.queue_draw();
      });
    },
  });

export const Github = () => {
  github = GithubService.get_default();

  return Widget.Box({
    cssClasses: [CSS_CLASSES.CONTAINER, "widget-container"],
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.HEADER],
        label: bind(github, "totalContributions").as((tc) => `${tc}`),
      }),
      Widget.Label({
        cssClasses: [CSS_CLASSES.SUBHEADER],
        label: "total lifetime contributions",
      }),
      ContribGrid(),
    ],
  });
};
