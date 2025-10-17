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

import Home from "@/views/windows/dash/home";
import Ledger from "@/views/windows/dash/ledger";
import Calendar from "@/views/windows/dash/calendar";
import Goals from "@/views/windows/dash/goals";
import Tasks from "@/views/windows/dash/tasks";
import Maps from "@/views/windows/dash/maps";
import {
  AnimatedStack,
  AnimatedStackChild,
} from "@/views/components/AnimatedStack";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import SettingsManager from "@/services/settings";

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

// User-specified tab order
const customTabOrder = SettingsManager.get_default().config.dashTabs;

const activeTabIndex = Variable(0);

const dashTabData: DashTabData[] = [
  {
    name: "Home",
    icon: "house-symbolic",
    ui: Home,
  },
  {
    name: "Map",
    icon: "compass-symbolic",
    ui: Maps,
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

/** Arrange tabs according to user-specified order */
const reorderTabs = (tabs: DashTabData[], order: string[]): DashTabData[] => {
  return order
    .map((name) => tabs.find((tab) => tab.name === name))
    .filter((tab): tab is DashTabData => tab !== undefined);
};

const orderedTabs = reorderTabs(dashTabData, customTabOrder);

/** Set active tab by index */
export const setActiveTab = (index: number) => {
  if (index >= 0 && index < orderedTabs.length) {
    activeTabIndex.set(index);
  }
};

/** Set active tab by name */
export const setActiveTabByName = (name: string) => {
  const index = orderedTabs.findIndex((tab) => tab.name === name);
  if (index !== -1) {
    activeTabIndex.set(index);
  }
};

/**
 * @function DashTabBar
 * @brief Left-hand tab bar for indicating and switching the currently active tab
 */
const DashTabBar = (tabSpec: DashTabData[]) => {
  /** Navigation button for a single dashboard tab */
  const DashTabEntry = (tabData: DashTabData) =>
    Widget.Button({
      canFocus: false,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      cssClasses: bind(activeTabIndex).as((index) =>
        index == tabSpec.indexOf(tabData)
          ? ["active", "tab-entry"]
          : ["tab-entry"],
      ),
      child: Widget.Image({
        cssClasses: ["icon"],
        iconName: tabData.icon,
      }),
      onClicked: () => {
        activeTabIndex.set(tabSpec.indexOf(tabData));
      },
    });

  /** Contains all dashboard tab buttons */
  return Widget.CenterBox({
    orientation: 1,
    cssClasses: ["tab-bar"],
    centerWidget: Widget.Box({
      vertical: true,
      children: tabSpec.map(DashTabEntry),
    }),
  });
};

/** Holds tab content. */
const DashTabStack = (tabSpec: DashTabData[]) =>
  AnimatedStack({
    name: "DashTabStack",
    cssClasses: ["tab-stack"],
    activePageIndex: activeTabIndex,
    vertical: true,
    children: tabSpec.map((tabData) => {
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
  const TabBar = DashTabBar(orderedTabs);
  const TabStack = DashTabStack(orderedTabs);

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

      for (let i = 0; i < orderedTabs.length; i++) {
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
