/**
 * █░░ ▄▀█ █░█ █▄░█ █▀▀ █░█ █▀▀ █▀█
 * █▄▄ █▀█ █▄█ █░▀█ █▄▄ █▀█ ██▄ █▀▄
 *
 * Launcher for:
 * - starting applications
 * - starting kitty sessions
 * - viewing and navigating to windows
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Astal, Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";
import { appResultWidgets, updateAppSearch, launchFirstApp } from "./App";
import {
  launchFirstSession,
  sessionResultWidgets,
  updateSessionSearch,
} from "./Kitty";
import { setupEventController } from "@/utils/EventControllerKeySetup";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const KB_SHORTCUTS = {
  PREV_TAB: "H",
  NEXT_TAB: "L",
} as const;

const Scrollable = astalify(Gtk.ScrolledWindow);

const globalRevealerState = Variable(false);

interface TabConfig {
  icon: string;
  resultWidgets: Variable<Gtk.Widget[]>;
  updateSearch: (query: string) => void;
  launchFirstItem: () => any;
}

const tabList: TabConfig[] = [
  {
    // App launcher
    icon: "squares-four-symbolic",
    resultWidgets: appResultWidgets,
    launchFirstItem: launchFirstApp,
    updateSearch: updateAppSearch,
  },
  {
    // Kitty session launcher
    icon: "terminal-symbolic",
    resultWidgets: sessionResultWidgets,
    launchFirstItem: launchFirstSession,
    updateSearch: updateSessionSearch,
  },
  {
    // Window select
    icon: "app-window-symbolic",
    resultWidgets: [],
    updateSearch: () => {},
    launchFirstItem: () => {},
  },
];

const currentTabIndex = Variable(0);

const iterTab = (dir: number) => {
  if (dir == -1) {
    const cti = currentTabIndex.get();
    currentTabIndex.set((cti - 1 + tabList.length) % tabList.length);
  } else if (dir == 1) {
    const cti = currentTabIndex.get();
    currentTabIndex.set((cti + 1) % tabList.length);
  }
};

const searchResults = Variable.derive(
  [currentTabIndex, appResultWidgets, sessionResultWidgets],
  (index, app, session) => {
    if (index == 0) return app;
    if (index == 1) return session;
    return [];
  },
);

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const Tab = (tabListIndex: number) =>
  Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    cssClasses: bind(currentTabIndex).as((i) =>
      i == tabListIndex ? ["selected", "tab"] : ["tab"],
    ),
    hexpand: true,
    halign: Gtk.Align.FILL,
    valign: Gtk.Align.CENTER,
    child: Widget.Image({
      halign: Gtk.Align.CENTER,
      hexpand: true,
      iconName: tabList[tabListIndex].icon,
    }),
    onButtonPressed: () => {
      currentTabIndex.set(tabListIndex);
    },
  });

const TabContainer = () =>
  Widget.Box({
    homogeneous: true,
    hexpand: true,
    canFocus: true,
    halign: Gtk.Align.FILL,
    valign: Gtk.Align.CENTER,
    cssClasses: ["tab-select"],
    children: tabList.map((_tab, index) => Tab(index)),
  });

const SearchResultContainer = () => {
  return Scrollable({
    vexpand: true,
    visible: true,
    canFocus: true,
    canTarget: true,
    setup: (self) => {
      self.set_child(
        Widget.Box({
          cssClasses: ["search-result-container"],
          vertical: true,
          children: bind(searchResults),
        }),
      );

      self.hscrollbarPolicy = Gtk.PolicyType.NEVER;
    },
  });
};

const Prompt = () => {
  const searchIcon = Widget.Image({
    cssClasses: ["search-icon"],
    iconName: "magnifying-glass-symbolic",
  });

  const textEntryBox = Widget.Entry({
    placeholderText: "Search",
    hexpand: true,
    canFocus: true,
    cssClasses: ["text-entry"],
    onActivate: (self) => {
      tabList[currentTabIndex.get()].launchFirstItem();
      App.toggle_window("launcher");
      self.text = "";
    },
    onKeyReleased: (self, keyval) => {
      if (KB_SHORTCUTS.PREV_TAB == Gdk.keyval_name(keyval)) {
        self.set_text(self.text.slice(0, self.text.length - 1));
        iterTab(-1);
      } else if (KB_SHORTCUTS.NEXT_TAB == Gdk.keyval_name(keyval)) {
        self.set_text(self.text.slice(0, self.text.length - 1));
        iterTab(1);
      }

      tabList[currentTabIndex.get()].updateSearch(self.text);
    },
    setup: (self) => {
      currentTabIndex.subscribe(() => {
        self.text = "";
      });
    },
  });

  return Widget.Box({
    cssClasses: ["text-entry-container"],
    children: [searchIcon, textEntryBox],
    onFocusEnter: (self) => {
      self.add_css_class("focus");
    },
    onFocusLeave: (self) => {
      self.remove_css_class("focus");
    },
  });
};

export default () => {
  const prompt = Prompt();

  /**
   * Container widget
   */
  const Launcher = () => {
    return Widget.Box({
      vexpand: false,
      hexpand: false,
      vertical: true,
      spacing: 20,
      cssClasses: ["launcher"],
      children: [prompt, SearchResultContainer(), TabContainer()],
    });
  };

  return Widget.Window({
    application: App,
    name: "launcher",
    cssName: "launcher",
    keymode: Astal.Keymode.EXCLUSIVE,
    child: Widget.Revealer({
      revealChild: false,
      transitionDuration: 100,
      transitionType: Gtk.RevealerTransitionType.SLIDE_UP,
      child: Launcher(),
    }),
    setup: (self) => {
      // Workaround for revealer bug. https://github.com/wmww/gtk4-layer-shell/issues/60
      self.set_default_size(1, 1);
    },
    onNotifyVisible: (self) => {
      prompt.children[1].grab_focus();

      if (!self.visible) {
        globalRevealerState.set(!globalRevealerState.get());
      }
    },
  });
};
