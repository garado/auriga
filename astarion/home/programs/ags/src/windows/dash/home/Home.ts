import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import { Profile } from "@/windows/dash/home/Profile";
import { Clock } from "@/windows/dash/home/Clock";
import { Github } from "@/windows/dash/home/Github";
import { Quote } from "@/windows/dash/home/Quote";
import { Music } from "@/windows/dash/home/Music";

const WIDGET_SPACING = 20;

const Grid = astalify(Gtk.Grid);

export default () => {
  const Left = Grid({
    rowSpacing: WIDGET_SPACING,
    columnSpacing: WIDGET_SPACING,
    setup: (self) => {
      GLib.idle_add(null, () => {
        /* Widget, Col, Row, Width, Height*/
        self.attach(Profile(), 0, 0, 1, 1);
        self.attach(Clock(), 0, 1, 1, 1);
        self.attach(Quote(), 0, 2, 1, 1);
        self.attach(Github(), 0, 3, 1, 1);
        return GLib.SOURCE_REMOVE;
      });
    },
  });

  const Middle = Grid({
    rowSpacing: WIDGET_SPACING,
    columnSpacing: WIDGET_SPACING,
    setup: (self) => {
      /* Widget, Col, Row, Width, Height*/
      self.attach(Music(), 1, 3, 1, 1);
    },
  });

  const Right = Grid({
    rowSpacing: WIDGET_SPACING,
    columnSpacing: WIDGET_SPACING,
    setup: (self) => {
      /* Widget, Col, Row, Width, Height*/
    },
  });

  return Widget.Box({
    vertical: false,
    cssClasses: ["home"],
    children: [Left, Middle, Right],
  });
};
