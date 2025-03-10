import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";

const ToggleButton = astalify(Gtk.ToggleButton);

const BluetoothControl = () => {
  return ToggleButton({
    cssClasses: ["action-btn"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
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
  return ToggleButton({
    cssClasses: ["action-btn"],
    hexpand: true,
    tooltipText: "Enable/disable nightshift (gammastep)",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Image({
      iconName: "moon-symbolic",
    }),
  });
};

export const Actions = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: ["actions"],
    spacing: 15,
    children: [
      Widget.Label({
        cssClasses: ["section-header"],
        label: "Actions and settings",
        xalign: 0,
      }),
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
};
