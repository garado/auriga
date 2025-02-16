
import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'
import { Accounts } from './Accounts.ts'

export const Overview = () => {
  return Widget.Box({
    cssClasses: ['overview'],
    children: [
      Accounts(),
    ]
  })
}
