/**
 * █▄░█ █▀▀ ▀█▀ █░█░█ █▀█ █▀█ █▄▀   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░
 * █░▀█ ██▄ ░█░ ▀▄▀▄▀ █▄█ █▀▄ █░█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄
 *
 * Wifi controls.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import NmcliService, { AccessPoint } from "@/services/Nmcli";

/*****************************************************************************
 * Module-level variables and constants
 *****************************************************************************/

const nmcli = NmcliService.get_default();

const CSS_CLASSES = {
  CONTAINER: "wifi",
  NETWORK_PASSWORD_ENTRY: "password-entry",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

const getStrengthIcon = (signal: number): string => {
  if (signal >= 66) return "wifi-high-symbolic";
  if (signal >= 33) return "wifi-medium-symbolic";
  if (signal >= 0) return "wifi-low-symbolic";
  return "wifi-none-symbolic";
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const NetworkItem = (ap: AccessPoint) => {
  const revealerState = Variable(false);

  const passwordEntry = Widget.Entry({
    cssClasses: [CSS_CLASSES.NETWORK_PASSWORD_ENTRY],
    placeholderText: "Enter network password",
    visibility: false,
    onActivate: (self) => {
      nmcli.activate(ap.ssid, self.text);
      revealerState.set(false);
    },
  });

  const basicInfo = Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Box({
      visible: ap.ssid != undefined,
      spacing: 8,
      vertical: false,
      children: [
        Widget.Image({
          iconName: getStrengthIcon(ap.strength),
        }),
        Widget.Label({
          label: ap.ssid,
        }),
      ],
    }),
    endWidget: Widget.Image({
      visible: ap.security != "",
      iconName: "lock-simple-symbolic",
    }),
  });

  const revealer = Widget.Revealer({
    child: passwordEntry,
    transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
    revealChild: bind(revealerState),
  });

  return Widget.Box({
    vertical: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    children: [basicInfo, revealer],
    onHoverLeave: () => {
      revealerState.set(false);
    },
    onButtonPressed: () => {
      if (ap.security === "" || ap.known) {
        nmcli.activate(ap.ssid);
      } else {
        revealerState.set(true);
        passwordEntry.grab_focus();
      }
    },
  });
};

export const Network = (globalRevealerState: Variable<boolean>) =>
  ExpansionPanel({
    icon: "wifi-high-symbolic",
    label: bind(nmcli, "status").as((status) => status?.ssid ?? "Disconnected"),
    children: bind(nmcli, "accessPoints").as((ap) => ap.map(NetworkItem)),
    cssClasses: [CSS_CLASSES.CONTAINER],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
