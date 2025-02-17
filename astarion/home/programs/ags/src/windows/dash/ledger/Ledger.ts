
import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import { DashTabLayout, DashLayout } from '../../../components/DashTabLayout.ts'
import { Ledger } from '../../../services/Ledger.ts'
import { Overview } from './overview/Overview.ts'
import { Fire } from './fire/Fire.ts'

export default () => {
  return DashTabLayout({
    name: 'Ledger',
    cssClasses: ['ledger'],
    pages: [
      { name: 'Overview', ui: Overview },
      { name: 'FIRE', ui: Fire },
    ],
  })
}
