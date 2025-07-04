import { Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import Bt, { AstalBluetoothDevice } from "gi://AstalBluetooth";

const bt = Bt.get_default();

export const Bluetooth = (globalRevealerState: Variable<boolean>) => {
  const BluetoothWidget = (device: AstalBluetoothDevice) =>
    Widget.Box({
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: `${device.name}`,
        }),
      ],
      onButtonPressed: () => {
        if (device.connected) {
          device.disconnect_device(() => {});
        } else {
          device.connect_device(() => {});
        }
      },
    });

  return ExpansionPanel({
    icon: "bluetooth-symbolic",
    label: bind(bt, "isConnected").as((state) =>
      state ? bt.devices[0].name : "None",
    ),
    children: bind(bt, "devices").as((bt) => bt.map(BluetoothWidget)),
    cssClasses: ["bluetooth"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
