/**
 * █▄▄ ▄▀█ █▀█
 * █▄█ █▀█ █▀▄
 *
 * Minimalist bar implementation.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, bind, timeout } from "astal";
import Battery from "gi://AstalBattery";
import Hyprland from "gi://AstalHyprland";
import Wp from "gi://AstalWp";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

/** @TODO Determine this programmatically */
const NUM_WORKSPACES = 9;

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const wp = Wp.get_default();
const hypr = Hyprland.get_default();
const bat = Battery.get_default();
const time = Variable("").poll(1000, "date '+%H\n%M'");

let barInstances = 0;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

// @TODO Make this user-configurable
const DistroIcon = () =>
  Widget.Image({
    visible: true,
    iconName: "nix-symbolic",
  });

/**
 * Container for all workspace indicators
 */
const Workspaces = () => {
  // @TODO Find out how to get the number of workspaces programatically
  const wsIndices = [...Array(NUM_WORKSPACES).keys()];

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
 * @param {number} workspaceIndex - The 0-indexed workspace number (0-8 for workspaces 1-9)
 */
const WorkspaceIndicator = (workspaceIndex: number) => {
  // Convert 0-indexed to 1-indexed workspace ID
  const localWorkspaceId = workspaceIndex + 1;

  // Calculate actual workspace ID for multi-monitor setup
  // If barInstances = 1 (first monitor): workspaces 1-9
  // If barInstances = 2 (second monitor): workspaces 10-18
  // If barInstances = 3 (third monitor): workspaces 19-27
  const actualWorkspaceId =
    (barInstances - 1) * NUM_WORKSPACES + localWorkspaceId;

  const isFocused = bind(hypr, "focusedWorkspace").as((focused) => {
    return focused?.id === actualWorkspaceId; // Use === for comparison
  });

  /* Check if the ACTUAL workspace ID is empty, not the local one */
  const isEmpty = bind(hypr, "workspaces").as((workspaces) => {
    return workspaces.find((ws) => ws.id === actualWorkspaceId) === undefined;
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
      label: `${localWorkspaceId}`, // Show local workspace number (1-9)
    }),
    onClicked: () => {
      hypr.dispatch("workspace", `${actualWorkspaceId}`); // Dispatch to actual workspace
    },
  });
};

/**
 * Shows battery percentage.
 *
 * Note: I don't think levelClass is working; returns 'none' at 37%
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

// @TODO Slider does not show when oriented vertically
const VolumeSlider = () => {
  const revealSlider = Variable(false);
  let timer: any = null;

  wp!.audio.default_speaker.connect("notify::volume", () => {
    if (timer) {
      timer.cancel();
    }

    revealSlider.set(true);

    timer = timeout(2000, () => {
      timer.cancel();
      timer = null;
      revealSlider.set(false);
    });
  });

  return Widget.Revealer({
    revealChild: bind(revealSlider),
    transitionType: Gtk.RevealerTransitionType.SLIDE_UP,
    child: Widget.Box({
      cssClasses: ["volume"],
      vertical: true,
      children: [
        Widget.Slider({
          min: 0,
          max: 100,
          orientation: Gtk.Orientation.VERTICAL,
          value: bind(wp!.audio.default_speaker, "volume").as(
            (volume) => volume * 100,
          ),
          onChangeValue: ({ value }) => {
            wp!.audio.default_speaker.set_volume(value / 100.0);
          },
        }),
        Widget.Image({
          iconName: "speaker-low-symbolic",
        }),
      ],
    }),
  });
};

/*****************************************************************************
 * Final composition
 *****************************************************************************/

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
    children: [VolumeSlider(), BatteryIndicator(), Time()],
  });

export default (monitor: Gdk.Monitor) => {
  barInstances += 1;

  const { TOP, LEFT, BOTTOM } = Astal.WindowAnchor;

  return Widget.Window({
    visible: true,
    anchor: LEFT | TOP | BOTTOM,
    exclusivity: Astal.Exclusivity.EXCLUSIVE,
    application: App,
    name: "bar",
    gdkmonitor: monitor,

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
