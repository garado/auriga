
/* █▀▀ █░░ █▀█ █▀▀ █▄▀ */
/* █▄▄ █▄▄ █▄█ █▄▄ █░█ */

import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

const time = Variable('').poll(1000, "date '+%H:%M'")
const date = Variable('').poll(1000, "date '+%A %d %B %Y'")

export const Clock = () => Widget.Box({
  cssClasses: ['clock'],
  spacing: 6,
  vertical: true,
  children: [
    Widget.Label({
      cssClasses: ['time'],
      label: bind(time)
    }),
    Widget.Label({
      cssClasses: ['date'],
      label: bind(date)
    }),
  ]
})
