
import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import { Accounts } from './Accounts.ts'
import { DebtsLiabilities } from './DebtsLiabilities.ts'
import { Breakdown } from './Breakdown.ts'

const WIDGET_SPACING = 20

export const Overview = () => {
  return Widget.Box({
    cssClasses: ['overview'],
    spacing: WIDGET_SPACING,
    children: [
      Accounts(),
      DebtsLiabilities(),
      Breakdown(),
    ]
  })
}
