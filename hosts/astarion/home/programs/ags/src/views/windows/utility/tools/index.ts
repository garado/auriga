/**
 * ▀█▀ █▀█ █▀█ █░░ █▀
 * ░█░ █▄█ █▄█ █▄▄ ▄█
 *
 * Collection of miscellaneous tools.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk, Widget } from "astal/gtk4";

import { Metronome } from "./Metronome";
import { PaintMixer } from "./PaintMixer";
import Calculator from "./Calculator";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const Scrollable = astalify(Gtk.ScrolledWindow);

export const Tools = () => {
  return Scrollable({
    hexpand: true,
    setup: (self) => {
      self.hscrollbar_policy = Gtk.PolicyType.NEVER;
      self.vscrollbar_policy = Gtk.PolicyType.ALWAYS;
      self.set_child(
        Widget.Box({
          cssClasses: ["tools"],
          vexpand: true,
          hexpand: true,
          vertical: true,
          spacing: 20,
          children: [Metronome(), PaintMixer()],
        }),
      );
    },
  });
};
