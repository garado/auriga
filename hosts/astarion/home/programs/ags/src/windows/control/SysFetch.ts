/**
 * █▀ █▄█ █▀ █▀▀ █▀▀ ▀█▀ █▀▀ █░█
 * ▄█ ░█░ ▄█ █▀░ ██▄ ░█░ █▄▄ █▀█
 *
 * Small widget for showing basic system info: user, host, uptime, battery life remaining.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { bind, Binding } from "astal";
import { Gtk, Widget, astalify } from "astal/gtk4";
import { exec } from "astal/process";
import Battery from "gi://AstalBattery";
import Gio from "gi://Gio";

import SettingsManager from "@/services/settings";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const homeConfig = SettingsManager.get_default().config.dashHome;
const Picture = astalify(Gtk.Picture);
const bat = Battery.get_default();

/*****************************************************************************
 * Helper functions
 *****************************************************************************/
/**
 * @function calcUptime
 * @brief Get uptime in "<x>d <y>h <z>m" format
 */
const calcUptime = () => {
  // uptime in seconds
  const raw = Number(exec("cut -d. -f1 /proc/uptime"));

  const d = Math.floor(raw / 86400);
  const h = Math.floor((raw % 86400) / 3600);
  const m = Math.floor((raw % 3600) / 60);

  return `${d}d ${h}h ${m}m`;
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Wee little template for all of the fetch info
 */
const FetchTemplate = (key: string, value: string | Binding<string>) =>
  Widget.Box({
    vertical: false,
    children: [
      Widget.Label({
        cssClasses: ["text-highlight"],
        label: key,
      }),
      Widget.Label({
        label: typeof value === "object" ? value : ` ~ ${value}`,
      }),
    ],
  });

const Fetch = () =>
  Widget.Box({
    cssClasses: ["fetch"],
    vertical: true,
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.CENTER,
    children: [
      FetchTemplate("os", "nix"),
      FetchTemplate("machine", "fw13"),
      FetchTemplate(
        "rem",
        bind(bat, "timeToEmpty").as((seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return ` ~ ${h}h ${m}m`;
        }),
      ),
      FetchTemplate("up", calcUptime()),
    ],
  });

const Profile = () =>
  Picture({
    cssClasses: ["pfp"],
    setup: (self) => {
      self.set_content_fit(Gtk.ContentFit.COVER);
      self.set_file(Gio.File.new_for_path(homeConfig.profile.pfp));
    },
  });

export const SysFetch = () =>
  Widget.Box({
    name: "sysinfo",
    cssClasses: ["sysinfo"],
    vertical: false,
    vexpand: false,
    spacing: 20,
    halign: Gtk.Align.BASELINE_CENTER,
    children: [Profile(), Fetch()],
  });
