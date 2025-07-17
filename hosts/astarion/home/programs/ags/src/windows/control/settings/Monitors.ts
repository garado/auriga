/**
 * █▀▄▀█ █▀█ █▄░█ █ ▀█▀ █▀█ █▀█   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░
 * █░▀░█ █▄█ █░▀█ █ ░█░ █▄█ █▀▄   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄
 *
 * Hyprland monitor control widget.
 *
 * Currently doesn't do much and only shows the connected monitors.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import Hyprland, { AstalHyprlandMonitor } from "gi://AstalHyprland";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const hypr = Hyprland.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Monitors = (globalRevealerState: Variable<boolean>) => {
  const MonitorItem = (mon: AstalHyprlandMonitor) =>
    Widget.Box({
      visible: true,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: mon.name,
        }),
      ],
      onButtonPressed: () => {},
    });

  return ExpansionPanel({
    icon: "monitor-symbolic",
    label: bind(hypr, "monitors").as((monitors) => monitors[0].name ?? "None"),
    children: bind(hypr, "monitors").as((monitors) =>
      monitors.map(MonitorItem),
    ),
    cssClasses: ["monitor"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
