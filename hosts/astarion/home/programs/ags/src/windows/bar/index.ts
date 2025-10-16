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
import { Variable, bind, interval, timeout } from "astal";
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
const time = Variable("");

interval(1000, () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const newTime = `${hours}\n${minutes}`;
  time.set(newTime);
});

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
    vertical: true,
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
      return [isEmpty ? "empty" : "not-empty", isFocused ? "focused" : ""];
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

/**
 * Volume slider
 * Note: wireplumber does cubic root volumes for some fucking reason
 * @TODO this is so confusingly written. however, i do not care
 */
const VolumeSlider = () => {
  const sliderReveal = Variable(false);
  const muteStatus = bind(wp!.audio.default_speaker, "mute");

  // Show slider for 2 seconds after any volume adjustment
  let timer: any = null;
  wp!.audio.default_speaker.connect("notify::volume", () => {
    if (timer) {
      timer.cancel();
    }

    sliderReveal.set(true);

    timer = timeout(2000, () => {
      timer.cancel();
      timer = null;
      sliderReveal.set(false);
    });
  });

  // Show icon when muted or when slider is displayed
  const iconReveal = Variable.derive(
    [sliderReveal, muteStatus],
    (sliderReveal: boolean, muteStatus: boolean) => {
      return sliderReveal || muteStatus;
    },
  );

  // Change icon based on mute/volume state
  const volume = bind(wp!.audio.default_speaker, "volume");
  const speakerIcon = Variable.derive(
    [muteStatus, volume],
    (muteStatus, volume) => {
      const percent = Math.cbrt(volume) * 100;
      if (muteStatus) return "speaker-x-symbolic";
      if (percent < 40) return "speaker-none-symbolic";
      if (percent < 80) return "speaker-low-symbolic";
      return "speaker-high-symbolic";
    },
  );

  const sliderContainer = Widget.Revealer({
    revealChild: bind(sliderReveal),
    transitionType: Gtk.RevealerTransitionType.SLIDE_UP,
    cssClasses: ["volume"],
    vexpand: false,
    child: Widget.Slider({
      min: 0,
      max: 1.2,
      step: 0.1,
      heightRequest: 100,
      visible: bind(sliderReveal),
      orientation: Gtk.Orientation.VERTICAL,
      inverted: true,
      value: bind(wp!.audio.default_speaker, "volume"),
      onChangeValue: ({ value }) => {
        wp!.audio.default_speaker.set_volume(value);
      },
    }),
  });

  const iconContainer = Widget.Revealer({
    revealChild: bind(iconReveal),
    transitionType: Gtk.RevealerTransitionType.SLIDE_UP,
    vexpand: false,
    child: Widget.Box({
      vertical: true,
      children: [
        Widget.Image({
          iconName: bind(speakerIcon),
          vexpand: true,
          valign: Gtk.Align.END,
        }),
      ],
    }),
  });

  return Widget.Box({
    vertical: true,
    children: [sliderContainer, iconContainer],
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
