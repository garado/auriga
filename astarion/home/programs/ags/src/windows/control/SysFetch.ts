/* █▀ █▄█ █▀ █ █▄░█ █▀▀ █▀█ */
/* ▄█ ░█░ ▄█ █ █░▀█ █▀░ █▄█ */

/* Small widget for showing basic system info -
 * user, host, uptime, battery life remaining */

import { bind } from "astal";
import { Gtk, Widget, astalify } from "astal/gtk4";
import { exec } from "astal/process";
import Battery from "gi://AstalBattery";
import Gio from "gi://Gio";

import UserConfig from "../../../userconfig.js";

const Picture = astalify(Gtk.Picture);
const bat = Battery.get_default();

/******************************
 * HELPERS
 ******************************/

/**
 * @function calcUptime
 * @brief Get uptime in "<x>d <y>h <z>m" format
 */
const calcUptime = () => {
  /* uptime in seconds */
  const raw = Number(exec("cut -d. -f1 /proc/uptime"));

  const d = Math.floor(raw / 86400);
  const h = Math.floor((raw % 86400) / 3600);
  const m = Math.floor((raw % 3600) / 60);

  return `${d}d ${h}h ${m}m`;
};

/******************************
 * WIDGETS
 ******************************/

/**
 * Wee little template for all of the fetch info
 */
const FetchTemplate = (key: string, value: string) => {
  const labelValue = typeof value === "object" ? value : ` ~ ${value}`;

  return Widget.Box({
    vertical: false,
    children: [
      Widget.Label({
        cssClasses: ["text-highlight"],
        label: key,
      }),
      Widget.Label({
        label: labelValue,
      }),
    ],
  });
};

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
        bind(bat, "time-to-empty").as((seconds: number) => {
          /* @TODO Not working */
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
    contentFit: Gtk.ContentFit.COVER,
    file: Gio.File.new_for_path(UserConfig.profile.pfp),
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
