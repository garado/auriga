/* █▀█ █▀█ █▀█ █▀▀ █ █░░ █▀▀ */
/* █▀▀ █▀▄ █▄█ █▀░ █ █▄▄ ██▄ */

import { astalify, Gtk, Widget } from "astal/gtk4";

import UserConfig from "../../../../userconfig.js";
import { Gio } from "astal";

const PFP_PATH = UserConfig.profile.pfp;
const PROFILE_NAME = UserConfig.profile.name;
const SPLASH_OPTS = UserConfig.profile.splashText;

export const Profile = () => {
  const Picture = astalify(Gtk.Picture);

  const Pfp = () =>
    Picture({
      hexpand: false,
      vexpand: false,
      cssClasses: ["pfp"],
      contentFit: Gtk.ContentFit.COVER,
      file: Gio.File.new_for_path(PFP_PATH),
    });

  const Username = () =>
    Widget.Label({
      cssClasses: ["username"],
      label: PROFILE_NAME,
    });

  const Splash = () =>
    Widget.Label({
      cssClasses: ["splash"],
      label: SPLASH_OPTS[Math.floor(Math.random() * SPLASH_OPTS.length)],
    });

  return Widget.Box({
    vertical: true,
    hexpand: false,
    vexpand: false,
    halign: Gtk.Align.BASELINE_CENTER,
    valign: Gtk.Align.BASELINE_CENTER,
    cssClasses: ["profile"],
    children: [
      Widget.Box({
        halign: Gtk.Align.BASELINE_CENTER,
        hexpand: true,
        cssClasses: ["pfp-container"],
        children: [Pfp()],
      }),
      Username(),
      Splash(),
    ],
  });
};
