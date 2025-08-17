/**
 * █▀ █▀▀ ▄▀█ █░░ █ █▄░█ █▀▀
 * ▄█ █▄▄ █▀█ █▄▄ █ █░▀█ █▄█
 *
 * Scale desktop shell using Gtk4 DPI setting
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { ExpansionPanel } from "@/components/ExpansionPanel";
import { Variable } from "astal";
import { Gtk, Widget } from "astal/gtk4";

/*****************************************************************************
 * Module-level variables and helper functions
 *****************************************************************************/

// 96: default Gtk DPI
// 1024: GTK stores DPI as a fixed-point number; 1024 = 2^10 is the scaling
// factor to convert from floating point to fixed-point
const GTK_DPI_SCALE_FACTOR = 96 * 1024;

const gtkSettings = Gtk.Settings.get_default();

const updateUiScale = (newScale: number) => {
  if (gtkSettings === null) return;
  gtkSettings.set_property("gtk-xft-dpi", GTK_DPI_SCALE_FACTOR * newScale);
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Scaling = (globalRevealerState: Variable<boolean>) => {
  const uiScaler = Widget.Slider({
    value: gtkSettings?.gtkXftDpi! / GTK_DPI_SCALE_FACTOR || 1,
    min: 0.5,
    max: 1.3,
    step: 0.1,
    digits: 1, // number of decimal places
    roundDigits: 1,
    drawValue: true,
    cssClasses: ["ui-scaler"],
    setup: (self) => {
      self.set_orientation(Gtk.Orientation.HORIZONTAL);
    },
    onKeyReleased: (self) => {
      updateUiScale(self.value);
    },
    onButtonReleased: (self) => {
      updateUiScale(self.value);
    },
  });

  return ExpansionPanel({
    icon: "resize-symbolic",
    label: "UI scaling",
    children: [uiScaler],
    cssClasses: ["scaling"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
