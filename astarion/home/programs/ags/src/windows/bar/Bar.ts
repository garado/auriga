/* █▄▄ ▄▀█ █▀█ */
/* █▄█ █▀█ █▀▄ */

import { App, Astal, Gtk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import Battery from "gi://AstalBattery";
import Hyprland from "gi://AstalHyprland";

/****************************************************
 * MODULE-LEVEL VARIABLES
 ****************************************************/

const hypr = Hyprland.get_default();
const bat = Battery.get_default();
const time = Variable("").poll(1000, "date '+%H\n%M'");

/****************************************************
 * WIDGET DEFINITIONS
 ****************************************************/

/* @TODO Not displaying anything working */
/* @TODO Make this user-configurable */
const DistroIcon = () =>
  Widget.Image({
    visible: true,
    iconName: "nix-symbolic",
  });

/**
 * Container for all workspace indicators.
 */
const Workspaces = () => {
  /* @TODO Find out how to get the number of workspaces programatically */
  const wsIndices = [...Array(9).keys()];

  return Widget.Box({
    cssClasses: ["workspaces"],
    orientation: 1,
    children: wsIndices.map(WorkspaceIndicator),
  });
};

/**
 * Indicator for a single workspace.
 * Clicking focuses the respective workspace.
 *
 * @param {number} wsIdx - The 0-indexed workspace number.
 */
const WorkspaceIndicator = (wsIdx: number) => {
  /* Param wsIdx is 0-indexed, but workspaces are 1-indexed. */
  wsIdx += 1;

  const isFocused = bind(hypr, "focusedWorkspace").as((focused) => {
    return focused.id == wsIdx;
  });

  /* 'workspaces' property will only include a workspace if there are
   * clients on it. So if the workspace isn't found, then it's empty. */
  const isEmpty = bind(hypr, "workspaces").as((workspaces) => {
    return workspaces.find((ws) => ws.id == wsIdx) == undefined;
  });

  const cssClasses = Variable.derive(
    [isFocused, isEmpty],
    (isFocused: boolean, isEmpty: boolean) => {
      return [isEmpty ? "empty" : "", isFocused ? "focused" : ""];
    },
  );

  return Widget.Button({
    cssClasses: ["workspace"],
    child: Widget.Label({
      cssClasses: bind(cssClasses),
      justify: Gtk.Justification.CENTER,
      label: `${wsIdx}`,
    }),
    onClicked: () => {
      hypr.dispatch("workspace", `${wsIdx}`);
    },
  });
};

/**
 * Shows battery percentage.
 *
 * @TODO I don't think levelClass is working; returns 'none' at 37%
 */
const BatteryIndicator = () => {
  const isCharging = bind(bat, "state").as((s) => s == Battery.State.CHARGING);

  const levelClassNames = [
    "unknown",
    "none",
    "low",
    "critical",
    "normal",
    "high",
    "full",
  ];
  const levelClass = bind(bat, "batteryLevel").as(
    (lvl) => levelClassNames[lvl],
  );

  const cssClasses = Variable.derive(
    [isCharging, levelClass],
    (isCharging: boolean, levelClass: string) => {
      return [isCharging ? "charging" : "", levelClass];
    },
  );

  return Widget.Box({
    cssClasses: ["battery"],
    halign: Gtk.Align.CENTER,
    children: [
      Widget.Label({
        cssClasses: bind(cssClasses),
        justify: Gtk.Justification.CENTER,
        label: bind(bat, "percentage").as((lvl) => `${Math.round(lvl * 100)}`),
      }),
    ],
  });
};

/**
 * Shows the time HH:MM.
 */
const Time = () =>
  Widget.Label({
    justify: Gtk.Justification.CENTER,
    cssClasses: ["time"],
    label: bind(time),
  });

/****************************************************
 * UI ASSEMBLY
 ****************************************************/

const Top = () =>
  Widget.Box({
    cssClasses: ["top"],
    halign: Gtk.Align.CENTER,
    children: [DistroIcon()],
  });

const Center = () =>
  Widget.Box({
    halign: Gtk.Align.CENTER,
    cssClasses: ["center"],
    children: [Workspaces()],
  });

const Bottom = () =>
  Widget.Box({
    halign: Gtk.Align.CENTER,
    cssClasses: ["bottom"],
    orientation: 1,
    children: [BatteryIndicator(), Time()],
  });

export default () => {
  const { TOP, LEFT, BOTTOM } = Astal.WindowAnchor;

  return Widget.Window({
    visible: true,
    anchor: LEFT | TOP | BOTTOM,
    exclusivity: Astal.Exclusivity.EXCLUSIVE,
    application: App,
    name: "bar",

    child: Widget.CenterBox({
      orientation: 1,
      halign: Gtk.Align.CENTER,
      cssClasses: ["bar"],
      startWidget: Top(),
      centerWidget: Center(),
      endWidget: Bottom(),
    }),
  });
};
