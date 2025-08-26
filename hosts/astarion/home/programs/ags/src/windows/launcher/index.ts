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
import { setupEventController } from "@/utils/EventControllerKeySetup";
import {
  launchFirstSession,
  sessionResultWidgets,
  updateSessionSearch,
} from "./Kitty";
import {
  focusFirstWindow,
  updateWindowList,
  updateWindowSearch,
  windowResultWidgets,
} from "./Window";

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

interface TabConfig {
  icon: string;
  resultWidgets: Variable<Gtk.Widget[]>;
  updateSearch: (query: string) => void;
  launchFirstItem: () => any;
}

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const globalRevealerState = Variable(false);

const currentTabIndex = Variable(0);

const KB_SHORTCUTS = {
  PREV_TAB: "H",
  NEXT_TAB: "L",
} as const;

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
    resultWidgets: windowResultWidgets,
    launchFirstItem: focusFirstWindow,
    updateSearch: updateWindowSearch,
  },
];

const searchResults = Variable.derive(
  [
    currentTabIndex,
    appResultWidgets,
    sessionResultWidgets,
    windowResultWidgets,
  ],
  (index, app, session, window) => {
    if (index == 0) return app;
    if (index == 1) return session;
    if (index == 2) return window;
    return [];
  },
);

/*****************************************************************************
 * Helpers
 *****************************************************************************/

/** Iterate between launcher tabs */
const iterTab = (dir: number) => {
  if (dir == -1) {
    const cti = currentTabIndex.get();
    currentTabIndex.set((cti - 1 + tabList.length) % tabList.length);
  } else if (dir == 1) {
    const cti = currentTabIndex.get();
    currentTabIndex.set((cti + 1) % tabList.length);
  }
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/** Displays available launcher tabs */
const TabContainer = () => {
  /** Widget representing a single launcher tab */
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
      onKeyPressed: (_self, keyval) => {
        if (keyval === Gdk.KEY_Return) {
          currentTabIndex.set(tabListIndex);
        }
      },
    });

  return Widget.Box({
    homogeneous: true,
    hexpand: true,
    canFocus: true,
    halign: Gtk.Align.FILL,
    valign: Gtk.Align.CENTER,
    cssClasses: ["tab-select"],
    children: tabList.map((_tab, index) => Tab(index)),
  });
};

/** Display search results */
const SearchResultContainer = () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);

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

/** Text entry where user types in search query */
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
    onKeyPressed: (self, keyval) => {
      if (Gdk.KEY_Shift_L == keyval || Gdk.KEY_Shift_R == keyval) {
        self.editable = false;
      }
    },
    onKeyReleased: (self, keyval, _keycode, state) => {
      if (
        self.editable === false &&
        state === Gdk.ModifierType.NO_MODIFIER_MASK
      ) {
        self.editable = true;
        self.text += Gdk.keyval_name(keyval);
        self.set_position(self.text.length);
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

  /** Container widget */
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

      setupEventController({
        name: "launcher",
        widget: self,
        binds: {
          [KB_SHORTCUTS.NEXT_TAB]: () => {
            iterTab(1);
          },
          [KB_SHORTCUTS.PREV_TAB]: () => {
            iterTab(-1);
          },
        },
      });

      Object.assign(self, {
        onClose: () => {
          prompt.children[1].text = "";
          currentTabIndex.set(0);
        },
      });
    },
    onNotifyVisible: (self) => {
      updateWindowList();

      prompt.children[1].grab_focus();

      if (!self.visible) {
        globalRevealerState.set(!globalRevealerState.get());
      }
    },
  });
};
