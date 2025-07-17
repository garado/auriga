/**
 * █░█ █▀█ █▀▄▀█ █▀▀
 * █▀█ █▄█ █░▀░█ ██▄
 *
 * Dashboard "Home" tab.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import { Profile } from "@/windows/dash/home/Profile";
import { Clock } from "@/windows/dash/home/Clock";
import { Github } from "@/windows/dash/home/Github";
import { Quote } from "@/windows/dash/home/Quote";
import { Music } from "@/windows/dash/home/Music";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const WIDGET_SPACING = 20;

const Grid = astalify(Gtk.Grid);

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () => {
  const Left = Grid({
    setup: (self) => {
      GLib.idle_add(0, () => {
        /* Widget, Col, Row, Width, Height*/
        self.attach(Profile(), 0, 0, 1, 1);
        self.attach(Clock(), 0, 1, 1, 1);
        self.attach(Quote(), 0, 2, 1, 1);
        self.attach(Github(), 0, 3, 1, 1);
        return GLib.SOURCE_REMOVE;
      });

      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });

  const Middle = Grid({
    setup: (self) => {
      // Widget, Col, Row, Width, Height
      self.attach(Music(), 1, 3, 1, 1);

      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });

  const Right = Grid({
    setup: (self) => {
      /* Widget, Col, Row, Width, Height*/

      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });

  return Widget.Box({
    vertical: false,
    cssClasses: ["home"],
    spacing: WIDGET_SPACING,
    children: [Left, Middle, Right],
  });
};
