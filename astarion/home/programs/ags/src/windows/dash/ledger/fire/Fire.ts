
import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

export const Fire = () => Widget.Box({
  children: [
    Widget.Label({ label: 'FIRE page!' })
  ]
})
