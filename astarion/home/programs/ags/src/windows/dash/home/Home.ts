
import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

export default () => {
  return Widget.Box({
    name: 'Home',
    children: [
      Widget.Label({
        label: 'Home tab'
      })
    ],
  })
}
