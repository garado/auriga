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
  const Image = astalify(Gtk.Image);

  const Pfp = () =>
    Image({
      cssClasses: ["pfp"],
      overflow: Gtk.Overflow.HIDDEN,
      setup: (self) => {
        self.set_from_file(profileConfig.pfp);
      },
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
    hexpand: true,
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
