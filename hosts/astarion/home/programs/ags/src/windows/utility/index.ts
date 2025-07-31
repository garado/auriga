/**
 * █░█ ▀█▀ █ █░░ █ ▀█▀ █▄█   █▀█ ▄▀█ █▄░█ █▀▀ █░░
 * █▄█ ░█░ █ █▄▄ █ ░█░ ░█░   █▀▀ █▀█ █░▀█ ██▄ █▄▄
 *
 * Left-hand panel containing commonly used tools.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Astal, Gdk, Gtk, Widget, astalify } from "astal/gtk4";

import { GeminiChat } from "@/windows/utility/GeminiChat";
import { Tools } from "@/windows/utility/tools";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import { AnimatedStack, AnimatedStackChild } from "@/components/AnimatedStack";
import { bind, Variable } from "astal";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const Notebook = astalify(Gtk.Notebook);

const KEYBOARD_SHORTCUTS = {
  CLOSE_UTILITY: "Escape",
  SHOW_TOOLS: "h",
  SHOW_GEMINI: "l",
} as const;

const activeTabIndex = Variable(0);

const utilityTabData: any[] = [
  {
    name: "Tools",
    icon: "wrench-symbolic",
    ui: Tools,
  },
  {
    name: "Gemini",
    icon: "google-logo-symbolic",
    ui: GeminiChat,
  },
];

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const UtilityTabLabel = (tabData: any) =>
  Widget.Button({
    canFocus: false,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    cssClasses: bind(activeTabIndex).as((index) =>
      index == utilityTabData.indexOf(tabData)
        ? ["active", "tab-entry"]
        : ["tab-entry"],
    ),
    child: Widget.Box({
      children: [
        Widget.Image({
          cssClasses: ["icon"],
          iconName: tabData.icon,
        }),
        Widget.Label({
          label: tabData.name,
        }),
      ],
    }),
    onClicked: () => {
      activeTabIndex.set(utilityTabData.indexOf(tabData));
    },
  });

const UtilityPanel = () =>
  AnimatedStack({
    name: "UtilityStack",
    cssClasses: ["tab-stack"],
    activePageIndex: activeTabIndex,
    vertical: false,
    children: utilityTabData.map((tabData) => {
      return {
        ui: tabData.ui,
        name: tabData.name,
      } as AnimatedStackChild;
    }),
  });

export default () => {
  const { TOP, LEFT, BOTTOM } = Astal.WindowAnchor;

  const utilityPanel = UtilityPanel();

  const utilityTabBar = Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    cssClasses: ["tab-bar"],
    centerWidget: Widget.Box({
      vertical: false,
      children: utilityTabData.map(UtilityTabLabel),
    }),
  });

  return Widget.Window({
    application: App,
    name: "utility",
    cssName: "utility",
    keymode: Astal.Keymode.ON_DEMAND,
    anchor: LEFT | TOP | BOTTOM,
    child: Widget.Revealer({
      revealChild: false,
      transitionDuration: 250,
      transitionType: Gtk.RevealerTransitionType.SLIDE_LEFT,
      child: Widget.Box({
        vertical: true,
        cssClasses: ["utility"],
        children: [utilityTabBar, utilityPanel],
      }),
    }),
    setup: (self) => {
      // Workaround for revealer bug. https://github.com/wmww/gtk4-layer-shell/issues/60
      self.set_default_size(1, 1);

      setupEventController({
        name: "UtilityPanel",
        widget: self,
        forwardTarget: utilityPanel,
        binds: {
          [KEYBOARD_SHORTCUTS.CLOSE_UTILITY]: () => {
            App.closeWindow("utility");
          },
          [KEYBOARD_SHORTCUTS.SHOW_TOOLS]: () => {
            utilityPanel.iterTab(-1);
          },
          [KEYBOARD_SHORTCUTS.SHOW_GEMINI]: () => {
            utilityPanel.iterTab(1);
          },
        },
      });
    },
  });
};
