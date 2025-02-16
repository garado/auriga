
/* █▀▄ ▄▀█ █▀ █░█ */
/* █▄▀ █▀█ ▄█ █▀█ */

import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import Home from './home/Home.ts'
import Ledger from './ledger/Ledger.ts'
import { SmartStack } from '../../components/SmartStack.ts'

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
    name: 'Home',
    icon: 'house-symbolic',
    ui:   Home,
  },
  {
    name: 'Ledger',
    icon: 'currency-dollar-symbolic',
    ui:   Ledger,
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
  child: Widget.Image({
    cssClasses: ['icon'],
    iconName: tabData.icon,
  }),
  onClicked: self => {
    activeTabIndex.set(dashTabData.indexOf(tabData))
  }
})

/**
 * Holds tab content.
 */
const DashTabStack = () => SmartStack({
  cssClasses: ['tab-stack'],
  bindNumberedSwitchTo: activeTabIndex,
  vertical: true,
  children: dashTabData,
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
