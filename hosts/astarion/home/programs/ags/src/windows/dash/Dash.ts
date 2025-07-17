/**
 * █▀▄ ▄▀█ █▀ █░█
 * █▄▀ █▀█ ▄█ █▀█
 *
 * Entrypoint for the dashboard, setting up the window and instantiating all tabs.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk4";
import { bind, Variable } from "astal";

import Home from "@/windows/dash/home/Home";
import Ledger from "@/windows/dash/ledger/Ledger";
import Calendar from "@/windows/dash/calendar/Calendar";
import Goals from "@/windows/dash/goals/";
import Tasks from "@/windows/dash/tasks/Tasks";
import { AnimatedStack, AnimatedStackChild } from "@/components/AnimatedStack";
import { setupEventController } from "@/utils/EventControllerKeySetup";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

interface DashTabData {
  ui: () => Gtk.Widget;
  name: string;
  icon: string;
}

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const activeTabIndex = Variable(0);

const dashTabData: DashTabData[] = [
  {
    name: "Home",
    icon: "house-symbolic",
    ui: Home,
  },
  {
    name: "Ledger",
    icon: "currency-dollar-symbolic",
    ui: Ledger,
  },
  {
    name: "Calendar",
    icon: "calendar-symbolic",
    ui: Calendar,
  },
  {
    name: "Tasks",
    icon: "check-circle-symbolic",
    ui: Tasks,
  },
  {
    name: "Goals",
    icon: "target-symbolic",
    ui: Goals,
  },
];

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * @function DashTabBar
 * @brief Left-hand tab bar for indicating and switching the currently active tab
 */
const DashTabBar = () =>
  Widget.CenterBox({
    orientation: 1,
    cssClasses: ["tab-bar"],
    centerWidget: Widget.Box({
      vertical: true,
      children: dashTabData.map(DashTabEntry),
    }),
  });

/**
 * @function DashTabEntry
 * @brief Button for a single dashboard tab
 */
const DashTabEntry = (tabData: DashTabData) =>
  Widget.Button({
    canFocus: false,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    cssClasses: bind(activeTabIndex).as((index) =>
      index == dashTabData.indexOf(tabData)
        ? ["active", "tab-entry"]
        : ["tab-entry"],
    ),
    child: Widget.Image({
      cssClasses: ["icon"],
      iconName: tabData.icon,
    }),
    onClicked: () => {
      activeTabIndex.set(dashTabData.indexOf(tabData));
    },
  });

/**
 * Holds tab content.
 */
const DashTabStack = () =>
  AnimatedStack({
    name: "DashTabStack",
    cssClasses: ["tab-stack"],
    activePageIndex: activeTabIndex,
    vertical: true,
    children: dashTabData.map((tabData) => {
      return {
        ui: tabData.ui,
        name: tabData.name,
      } as AnimatedStackChild;
    }),
  });

/*****************************************************************************
 * Export
 *****************************************************************************/

export default () => {
  const TabBar = DashTabBar();
  const TabStack = DashTabStack();

  return Widget.Window({
    application: App,
    name: "dash",
    cssName: "dash",
    visible: false,
    keymode: Astal.Keymode.ON_DEMAND,
    child: Widget.Revealer({
      revealChild: false,
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      child: Widget.Box({
        orientation: 0,
        cssClasses: ["dash"],
        children: [TabBar, TabStack],
      }),
    }),
    setup: (self) => {
      // Workaround for revealer bug. https://github.com/wmww/gtk4-layer-shell/issues/60
      self.set_default_size(1, 1);

      const binds: Record<string, () => void> = {};

      for (let i = 0; i < dashTabData.length; i++) {
        const thisIndex = `${i + 1}`;
        binds[thisIndex] = () => {
          activeTabIndex.set(i);
        };
      }

      setupEventController({
        name: "DashWindow",
        widget: self,
        forwardTarget: () => TabStack.get_visible_child(),
        binds: binds,
      });
    },
  });
};
