/* █▀ █▀▀ █▀▀ █▀▄▀█ █▀▀ █▄░█ ▀█▀ █▀▀ █▀▄   █▄▄ █░█ ▀█▀ ▀█▀ █▀█ █▄░█ */
/* ▄█ ██▄ █▄█ █░▀░█ ██▄ █░▀█ ░█░ ██▄ █▄▀   █▄█ █▄█ ░█░ ░█░ █▄█ █░▀█ */

/* Attempts to implement Material Design segmented button group */

import { Binding } from "astal";
import { Gdk, Gtk, Widget, astalify } from "astal/gtk4";

const ToggleButton = astalify(Gtk.ToggleButton);

export type SegmentedButtonProps = {
  name: string;
  action: () => void;
  active: boolean | Binding<boolean>;
};

export const SegmentedButtonGroup = (props: {
  buttons: Array<SegmentedButtonProps>;
  active?: boolean | Binding<boolean>;
  exclusive?: boolean;
}) => {
  const Container = Widget.Box({
    orientation: 0,
    spacing: 0,
    cssClasses: ["segmented-toggle-button-container"],
    children: props.buttons.map((btn) =>
      ToggleButton({
        cursor: Gdk.Cursor.new_from_name("pointer", null),
        cssClasses: ["segmented-toggle-button"],
        label: btn.name,
        onClicked: btn.action,
        active: btn.active ?? false,
      }),
    ),
  });

  /* Add to button group, where only one button is active at a time */
  if (props.exclusive) {
    const group = Container.get_children()[0];

    Container.get_children()
      .slice(1)
      .map((btn) => {
        btn.set_group(group);
      });
  }

  return Container;
};
