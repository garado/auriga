
/* █▀▄ ▄▀█ █▀ █░█ */
/* █▄▀ █▀█ ▄█ █▀█ */

import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'
import Home from './home/Home.ts'
import Ledger from './ledger/Ledger.ts'

/*********************************************************** 
 * SETUP
 ***********************************************************/

type DashTabData = {
  name: string;
  icon: string;
  ui:   () => void;
}

const dashTabData: DashTabData[] = [
  {
    name: 'Ledger',
    icon: 'dollar-symbolic',
    ui:   Ledger,
  },
  {
    name: 'Home',
    icon: 'home-symbolic',
    ui:   Home,
  },
]

const activeTabIndex = Variable(0)

/*********************************************************** 
 * WIDGETS
 ***********************************************************/

/**
 * @function DashTabBar
 * @brief Left-hand tab bar for indicating and switching the 
 * currently active tab
 */
const DashTabBar = () => Widget.Box({
  orientation: 1,
  cssClasses: ['tab-bar'],
  valign: Gtk.Align.CENTER,
  children: dashTabData.map(DashTabEntry),
})

/**
 * @function DashTabEntry
 * @brief Button for a single dashboard tab
 */
const DashTabEntry = (tabData: DashTabData) => Widget.Button({
  cssClasses: ['tab-entry'],
  child: Widget.Label({
    label: tabData.name
  }),
  onClicked: self => {
    activeTabIndex.set(dashTabData.indexOf(tabData))
  }
})

/**
 * Holds tab content.
 */
const DashTabStack = () => Widget.Stack({
  cssClasses: ['tab-stack'],
  transition_type: Gtk.StackTransitionType.SLIDE_UP,
  setup: self => {
    dashTabData.map(data => self.add_named(data.ui(), data.name))
    activeTabIndex.subscribe(index => self.visibleChildName = dashTabData[index].name)
  }
})

/*********************************************************** 
 * EXPORT
 ***********************************************************/

export default (gdkmonitor: Gdk.Monitor) => {
  return Widget.Window({
    application: App,
    name: 'dash',
    cssName: 'dash',
    visible: false,
    keymode: Astal.Keymode.ON_DEMAND,
    // exclusivity: Astal.Exclusivity.EXCLUSIVE,

    child: Widget.Box({
      orientation: 0,
      cssClasses: ['dash'],
      children: [
        DashTabBar(),
        DashTabStack()
      ]
    })
  })
}
