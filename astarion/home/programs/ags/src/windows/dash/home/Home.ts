import { Gtk, astalify } from "astal/gtk4";

import { Profile } from "@/windows/dash/home/Profile";
import { Clock } from "@/windows/dash/home/Clock";
import { Github } from "@/windows/dash/home/Github";
import { Quote } from "@/windows/dash/home/Quote";
import { Music } from "@/windows/dash/home/Music";

const Grid = astalify(Gtk.Grid);

const WIDGET_SPACING = 20;

export default () => {
  return Grid({
    cssClasses: ["home"],
    row_spacing: WIDGET_SPACING,
    column_spacing: WIDGET_SPACING,
    setup: (self) => {
      /* Widget, Col, Row, Width, Height*/
      self.attach(Profile(), 0, 0, 1, 1);
      self.attach(Clock(), 0, 1, 1, 1);
      self.attach(Quote(), 0, 2, 1, 1);
      self.attach(Github(), 0, 3, 1, 1);

      self.attach(Music(), 1, 3, 1, 1);
    },
  });
};
