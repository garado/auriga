/**
 * █▀█ █▀▀ █▀█ ▄▄ █▀▄▀█ █▀█ █▄░█ █ ▀█▀ █▀█ █▀█   █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀
 * █▀▀ ██▄ █▀▄ ░░ █░▀░█ █▄█ █░▀█ █ ░█░ █▄█ █▀▄   █▄▄ █▄█ █░▀█ █▀░ █ █▄█
 *
 * Per-monitor settings.
 *
 * Uses `hyprctl` instead of Gdk or astal libs because hyprctl will show disabled monitors.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { GLib, Variable } from "astal";

import { ExpansionPanel } from "@/components/ExpansionPanel";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export interface MonitorData {
  name: string;
  description: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  refreshRate: number;
  focused: boolean;
  disabled?: boolean;
}

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

const getMonitorData = () => {
  try {
    const [success, stdout] = GLib.spawn_command_line_sync(
      "hyprctl monitors all -j",
    );
    if (success && stdout != null) {
      const output = new TextDecoder().decode(stdout);
      return JSON.parse(output);
    }
  } catch (error) {
    console.error("Failed to parse hyprctl JSON:", error);
  }
};

const setMonitorEnable = (monitorName: string, enable: boolean) => {
  print(`enable: ${enable}`);
  GLib.spawn_command_line_async(
    `hyprctl keyword monitor ${monitorName},${enable ? "enable" : "disable"}`,
  );
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Widget providing settings for a single monitor.
 */
const Monitor = (monitorData: MonitorData) => {
  const Switch = astalify(Gtk.Switch);

  const enableSwitch = Switch({
    heightRequest: 20,
    setup: (self) => {
      self.set_cursor(Gdk.Cursor.new_from_name("pointer"));
      self.set_active(!monitorData.disabled);
      self.set_visible(true);
      self.connect("state-set", (_self, state) => {
        setMonitorEnable(monitorData.name, state);
        return false;
      });
    },
  });

  return Widget.CenterBox({
    cssClasses: ["expander-tab"],
    startWidget: Widget.Label({
      label: monitorData.name,
    }),
    endWidget: enableSwitch,
    setup: (self) => {
      self.set_orientation(Gtk.Orientation.HORIZONTAL);
    },
  });
};

export const PerMonitorSettings = () => {
  const allMonitorData = getMonitorData();

  return Widget.Box({
    spacing: 8,
    vertical: true,
    children: allMonitorData.map(Monitor),
  });
};
