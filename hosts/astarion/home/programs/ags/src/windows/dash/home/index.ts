/**
 * █░█ █▀█ █▀▄▀█ █▀▀
 * █▀█ █▄█ █░▀░█ ██▄
 *
 * Dashboard "Home" tab.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";
import { Profile } from "@/windows/dash/home/Profile";
import { Clock } from "@/windows/dash/home/Clock";
import { Github } from "@/windows/dash/home/Github";
import { Quote } from "@/windows/dash/home/Quote";
import { Player } from "@/windows/dash/home/MediaPlayer";
import { Weather } from "./Weather";
import { PinnedGoals } from "./PinnedGoals";

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
      /* Widget, Col, Row, Width, Height*/
      self.attach(Profile(), 0, 0, 1, 1);
      self.attach(Clock(), 0, 1, 1, 1);
      self.attach(Quote(), 0, 2, 1, 1);
      self.attach(Github(), 0, 3, 1, 1);

      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });

  const Middle = Grid({
    setup: (self) => {
      // Widget, Col, Row, Width, Height
      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });

  const Right = Grid({
    setup: (self) => {
      /* Widget, Col, Row, Width, Height*/
      self.attach(Weather(), 0, 0, 1, 1);
      self.attach(PinnedGoals(), 0, 1, 1, 1);
      self.attach(Player(), 0, 2, 1, 1);

      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });

  return Grid({
    cssClasses: ["home"],
    setup: (self) => {
      /* Widget, Col, Row, Width, Height*/
      self.attach(Left, 0, 0, 1, 1);
      self.attach(Middle, 1, 0, 1, 1);
      self.attach(Right, 2, 0, 1, 1);

      self.set_column_homogeneous(true);
      self.set_row_spacing(WIDGET_SPACING);
      self.set_column_spacing(WIDGET_SPACING);
    },
  });
};
