/* █▀▄ ▄▀█ █▀ █░█ */
/* █▄▀ █▀█ ▄█ █▀█ */

import { App, Astal, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";

import Home from "@/windows/dash/home/Home";
import Ledger from "@/windows/dash/ledger/Ledger";
import Calendar from "@/windows/dash/calendar/Calendar";
import Goals from "@/windows/dash/goals/Goals";
import { SmartStack } from "@/components/SmartStack";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

/***********************************************************
 * SETUP
 ***********************************************************/

type DashTabData = {
  name: string;
  icon: string;
  ui: () => void;
};

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
    name: "Goals",
    icon: "target-symbolic",
    ui: Goals,
  },
];

const activeTabIndex = Variable(0);

/***********************************************************
 * WIDGETS
 ***********************************************************/

/**
 * @function DashTabBar
 * @brief Left-hand tab bar for indicating and switching the
 * currently active tab
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
    cssClasses: ["tab-entry"],
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
  SmartStack({
    name: "DashTabStack",
    cssClasses: ["tab-stack"],
    bindNumberedSwitchTo: activeTabIndex,
    vertical: true,
    children: dashTabData,
  });

/***********************************************************
 * EXPORT
 ***********************************************************/

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
      /* Workaround for revealer bug.
       * https://github.com/wmww/gtk4-layer-shell/issues/60 */
      self.set_default_size(1, 1);

      const binds = {};

      for (let i = 0; i < dashTabData.length; i++) {
        binds[`${i + 1}`] = () => {
          activeTabIndex.set(i);
        };
      }

      EventControllerKeySetup({
        name: "DashWindow",
        widget: self,
        forwardTo: () => TabStack.get_visible_child(),
        binds: binds,
      });
    },
  });
};
