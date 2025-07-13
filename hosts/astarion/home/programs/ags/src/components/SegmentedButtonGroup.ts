/* █▀ █▀▀ █▀▀ █▀▄▀█ █▀▀ █▄░█ ▀█▀ █▀▀ █▀▄   █▄▄ █░█ ▀█▀ ▀█▀ █▀█ █▄░█ */
/* ▄█ ██▄ █▄█ █░▀░█ ██▄ █░▀█ ░█░ ██▄ █▄▀   █▄█ █▄█ ░█░ ░█░ █▄█ █░▀█ */

/* Implements Material Design segmented button group. */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Binding } from "astal";
import { Gdk, Gtk, Widget, astalify } from "astal/gtk4";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ToggleButton = astalify(Gtk.ToggleButton);

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export type SegmentedButtonProps = {
  name: string;
  action: () => void;
  active: boolean | Binding<boolean>;
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const SegmentedButtonGroup = (props: {
  buttons: Array<SegmentedButtonProps>;
  active?: boolean | Binding<boolean>;
  exclusive?: boolean;
}) => {
  const Container = Widget.Box({
    orientation: 0,
    spacing: 0,
    canFocus: false,
    cssClasses: ["segmented-toggle-button-container"],
    children: props.buttons.map((btn) =>
      ToggleButton({
        cursor: Gdk.Cursor.new_from_name("pointer", null),
        cssClasses: ["segmented-toggle-button"],
        onClicked: btn.action,
        setup: (self) => {
          self.set_label(btn.name);

          // Handle both boolean and Binding<boolean>
          if (typeof btn.active === "boolean") {
            self.set_active(btn.active);
          } else {
            self.set_active(btn.active.get());
            btn.active.subscribe((value) => self.set_active(value));
          }
        },
      }),
    ),
  });

  // Add to button group, where only one button is active at a time
  if (props.exclusive) {
    const buttons = Container.get_children();
    const firstButton = buttons[0] as Gtk.ToggleButton;

    buttons.slice(1).forEach((btn) => {
      (btn as Gtk.ToggleButton).set_group(firstButton);
    });
  }

  return Container;
};
