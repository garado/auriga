
import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import { Profile } from './Profile.ts'
import { Clock } from './Clock.ts'
import { Github } from './Github.ts'

const Grid = astalify(Gtk.Grid)

const WIDGET_SPACING = 20

export default  () => {
  return Grid({
    cssClasses: ['home'],
    row_spacing: WIDGET_SPACING,
    column_spacing: WIDGET_SPACING,
    setup: self => {
      /*          Widget          Col   Row   Width   Height*/
      self.attach(Profile(),      0,    0,    1,      1)
      self.attach(Clock(),        0,    1,    1,      1)
      self.attach(Github(),       0,    2,    1,      1)
    }
  })
}
