/**
 * █▄░█ █▀▀ ▀█▀ █░█░█ █▀█ █▀█ █▄▀   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░
 * █░▀█ ██▄ ░█░ ▀▄▀▄▀ █▄█ █▀▄ █░█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄
 *
 * Wifi controls.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import Nw, { AstalNetworkAccessPoint } from "gi://AstalNetwork";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const nw = Nw.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Network = (globalRevealerState: Variable<boolean>) => {
  const NetworkItem = (ap: AstalNetworkAccessPoint) =>
    Widget.Box({
      visible: ap.ssid != undefined,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: ap.ssid,
        }),
      ],
      onButtonPressed: () => {
        nw.set_active_connection(ap.ssid);
      },
    });

  return ExpansionPanel({
    icon: "wifi-high-symbolic",
    label: bind(nw.wifi, "ssid").as((ssid) => ssid || "Disconnected"),
    children: bind(nw.wifi, "accessPoints").as((ap) => ap.map(NetworkItem)),
    cssClasses: ["wifi"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
