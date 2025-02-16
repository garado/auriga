
import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import { Accounts } from './Accounts.ts'
import { Debts } from './DebtsLiabilities.ts'
import { Breakdown } from './Breakdown.ts'
import { Transactions } from './RecentTransactions.ts'

const WIDGET_SPACING = 20

const Grid = astalify(Gtk.Grid)

export const Overview = () => {
  return Grid({
    cssClasses: ['overview'],
    row_spacing: WIDGET_SPACING,
    column_spacing: WIDGET_SPACING,
    setup: self => {
      /*          Widget          Col   Row   Width   Height*/
      self.attach(Accounts(),     0,    0,    1,      2)
      self.attach(Debts(),        2,    0,    1,      1)
      self.attach(Transactions(), 1,    0,    1,      1)
      self.attach(Breakdown(),    1,    1,    1,      1)
    }
  })
}
