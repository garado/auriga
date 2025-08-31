import { Gtk, Widget } from "astal/gtk4";

export const Decoration = () =>
  Widget.Box({
    cssClasses: ["decoration"],
    vertical: true,
    spacing: 30,
    vexpand: true,
    valign: Gtk.Align.CENTER,
    children: [
      Widget.Image({
        cssClasses: ["circle"],
        iconName: "circle-symbolic",
      }),
      Widget.Image({
        cssClasses: ["circle"],
        iconName: "circle-symbolic",
      }),
    ],
  });
