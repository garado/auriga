
/* █▀█ █▀█ █▀█ █▀▀ █ █░░ █▀▀ */
/* █▀▀ █▀▄ █▄█ █▀░ █ █▄▄ ██▄ */

import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import UserConfig from '../../../../userconfig.js'

const PFP_PATH = UserConfig.profile.pfp
const PROFILE_NAME = UserConfig.profile.name
const SPLASH_OPTS = UserConfig.profile.splashText

export const Profile = () => {
  const Picture = () => Widget.Image({
    cssClasses: ['pfp'],
    file: PFP_PATH,
  })

  const Username = () => Widget.Label({
    cssClasses: ['username'],
    label: PROFILE_NAME,
  })
  
  const Splash = () => Widget.Label({
    cssClasses: ['splash'],
    label: SPLASH_OPTS[Math.floor(Math.random() * SPLASH_OPTS.length)]
  })

  return Widget.Box({
    vertical: true,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    cssClasses: ['profile'],
    children: [
      Picture(),
      Username(),
      Splash(),
    ]
  })
}
