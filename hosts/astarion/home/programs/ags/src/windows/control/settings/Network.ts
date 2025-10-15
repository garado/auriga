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
import NmcliService, { AccessPoint } from "@/services/Nmcli";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const nmcli = NmcliService.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Network = (globalRevealerState: Variable<boolean>) => {
  const NetworkItem = (ap: AccessPoint) =>
    Widget.Box({
      visible: ap.ssid != undefined,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: ap.ssid,
        }),
      ],
      onButtonPressed: () => {
        nmcli.activate(ap.ssid);
      },
    });

  return ExpansionPanel({
    icon: "wifi-high-symbolic",
    label: bind(nmcli, "status").as((status) => status?.ssid ?? "Disconnected"),
    children: bind(nmcli, "accessPoints").as((ap) => ap.map(NetworkItem)),
    cssClasses: ["wifi"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
