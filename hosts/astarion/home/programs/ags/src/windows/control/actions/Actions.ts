import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { bind, execAsync, Variable } from "astal";

import Bt from "gi://AstalBluetooth";

const ToggleButton = astalify(Gtk.ToggleButton);
const bt = Bt.get_default();

const BluetoothControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    active: bind(bt, "is-powered"),
    hexpand: true,
    tooltipText: "Enable/disable Bluetooth",
    child: Widget.Image({
      iconName: "bluetooth-symbolic",
    }),
  });
};

const WifiControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    tooltipText: "Enable/disable wifi",
    child: Widget.Image({
      iconName: "wifi-high-symbolic",
    }),
  });
};

const AirplaneControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    tooltipText: "Enable/disable airplane mode",
    child: Widget.Image({
      iconName: "airplane-tilt-symbolic",
    }),
  });
};

const DNDControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    tooltipText: "Enable/disable DND",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Image({
      iconName: "bell-symbolic",
    }),
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
    child: Widget.Image({
      iconName: "moon-symbolic",
    }),
    active: bind(gammastepActive),
    onDestroy: gammastepActive.drop,
    onButtonPressed: (self) => {
      const cmd = self.active ? "stop" : "start";
      execAsync(`systemctl --user ${cmd} gammastep.service`);
    },
  });
};

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
