import { Binding } from "astal";
import { Gtk, Widget } from "astal/gtk4";

export type BadgeProps = {
  number: number | Binding<number>;
};

export const Badge = (props: BadgeProps) => {
  const BadgeWidget = Widget.Label({
    hexpand: false,
    vexpand: false,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    heightRequest: 20,
    widthRequest: 20,
    cssClasses: ["badge"],
    label: `${props.number}`,
  });

  return BadgeWidget;
};
