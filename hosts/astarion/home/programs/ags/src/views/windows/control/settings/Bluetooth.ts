/**
 * █▄▄ █░░ █░█ █▀▀ ▀█▀ █▀█ █▀█ ▀█▀ █░█
 * █▄█ █▄▄ █▄█ ██▄ ░█░ █▄█ █▄█ ░█░ █▀█
 *
 * Bluetooth settings.
 *
 * Currently only supports connecting to devices.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/views/components/ExpansionPanel.js";
import Bt, { AstalBluetoothDevice } from "gi://AstalBluetooth";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const bt = Bt.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

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
    label: bind(bt, "isConnected").as((state) => {
      if (state) {
        const connectedDevices = bt.devices.filter(
          (device) => device.connected,
        );

        return connectedDevices[0]?.name || "None";
      } else {
        return "None";
      }
    }),
    children: bind(bt, "devices").as((bt) => bt.map(BluetoothWidget)),
    cssClasses: ["bluetooth"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
