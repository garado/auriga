/**
 * ▄▀█ █▀▀ ▀█▀ █ █▀█ █▄░█ █▀
 * █▀█ █▄▄ ░█░ █ █▄█ █░▀█ ▄█
 *
 * Implements quick actions in the control panel.
 *
 * These are simple on/off buttons to control toggleable settings,
 * such as airplane mode, night shift, and DND.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { bind, execAsync, Variable } from "astal";
import Bt from "gi://AstalBluetooth";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ToggleButton = astalify(Gtk.ToggleButton);
const bt = Bt.get_default();

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const BluetoothControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: true,
    tooltipText: "Enable/disable Bluetooth",
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "bluetooth-symbolic",
        }),
      );

      // Manually bind the property, because the property throws an LSP error
      bind(bt, "isPowered").subscribe((value) => {
        self.active = Boolean(value);
      });
    },
  });
};

const WifiControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    tooltipText: "Enable/disable wifi",
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "wifi-high-symbolic",
        }),
      );
    },
  });
};

const AirplaneControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    tooltipText: "Enable/disable airplane mode",
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "airplane-tilt-symbolic",
        }),
      );
    },
  });
};

const DNDControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    tooltipText: "Enable/disable DND",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "bell-symbolic",
        }),
      );
    },
  });
};

const GammastepControl = () => {
  const gammastepActive = Variable(false).watch(
    "bash -c 'systemctl --user is-active gammastep.service'",
    (out) => {
      return out === "active";
    },
  );

  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    tooltipText: "Enable/disable nightshift (gammastep)",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onDestroy: gammastepActive.drop,
    onButtonPressed: (self) => {
      const cmd = self.active ? "stop" : "start";
      execAsync(`systemctl --user ${cmd} gammastep.service`);
    },
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "moon-symbolic",
        }),
      );

      // Manually bind the property, because the property throws an LSP error
      bind(gammastepActive).subscribe((value) => {
        self.active = Boolean(value);
      });
    },
  });
};

/*****************************************************************************
 * Composition
 *****************************************************************************/

export const Actions = () =>
  Widget.Box({
    vertical: true,
    cssClasses: ["actions"],
    spacing: 15,
    children: [
      Widget.Box({
        vertical: false,
        homogeneous: true,
        spacing: 20,
        hexpand: true,
        children: [
          GammastepControl(),
          AirplaneControl(),
          WifiControl(),
          BluetoothControl(),
          DNDControl(),
        ],
      }),
    ],
  });
