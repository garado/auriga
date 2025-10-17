/**
 * █▀█ █▀█ █▀█ █▀▀ █ █░░ █▀▀
 * █▀▀ █▀▄ █▄█ █▀░ █ █▄▄ ██▄
 *
 *
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk, Widget } from "astal/gtk4";
import { Gio } from "astal";
import SettingsManager from "@/services/settings";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const profileConfig = SettingsManager.get_default().config.dashHome.profile;

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Profile = () => {
  const Picture = astalify(Gtk.Picture);

  const Pfp = () =>
    Picture({
      hexpand: false,
      vexpand: false,
      cssClasses: ["pfp"],
      contentFit: Gtk.ContentFit.COVER,
      file: Gio.File.new_for_path(profileConfig.pfp),
    });

  const Username = () =>
    Widget.Label({
      cssClasses: ["username"],
      label: profileConfig.name,
    });

  const Splash = () =>
    Widget.Label({
      cssClasses: ["splash"],
      label:
        profileConfig.splashText[
          Math.floor(Math.random() * profileConfig.splashText.length)
        ],
    });

  return Widget.Box({
    vertical: true,
    hexpand: false,
    vexpand: false,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    cssClasses: ["profile"],
    children: [
      Widget.Box({
        halign: Gtk.Align.CENTER,
        hexpand: false,
        cssClasses: ["pfp-container"],
        children: [Pfp()],
      }),
      Username(),
      Splash(),
    ],
  });
};
