/**
 * ▄▀█ █▀█ █▀█   █░░ ▄▀█ █░█ █▄░█ █▀▀ █░█ █▀▀ █▀█
 * █▀█ █▀▀ █▀▀   █▄▄ █▀█ █▄█ █░▀█ █▄▄ █▀█ ██▄ █▀▄
 *
 * Simple app launcher widget.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Astal, Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";
import Apps from "gi://AstalApps";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const Scrollable = astalify(Gtk.ScrolledWindow);

const globalRevealerState = Variable(false);

const appSearch = new Apps.Apps({
  nameMultiplier: 2,
  entryMultiplier: 0,
  executableMultiplier: 2,
});

const searchResults = Variable(appSearch.fuzzy_query(""));

interface TabConfig {
  icon: string;
  resultsFactory?: () => (typeof Widget.Box)[];
}

const tabList: TabConfig[] = [
  {
    // App launcher
    icon: "squares-four-symbolic",
  },
  {
    // Kitty session launcher
    icon: "terminal-symbolic",
  },
  {
    // Window select
    icon: "app-window-symbolic",
  },
];

const currentTabIndex = Variable(0);

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/**
 * Widget representing a single application in the launcher.
 */
const AppEntry = (app: Apps.Application) => {
  const Final = Widget.Button({
    cssClasses: ["result"],
    vexpand: false,
    hexpand: true,
    canFocus: true,
    canTarget: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: app.name,
      justify: Gtk.Justification.LEFT,
      hexpand: true,
    }),
    onButtonPressed: () => {
      app.launch();
    },
    onKeyPressed: (_self, keyval, _keycode, _state) => {
      if (keyval == Gdk.KEY_Return) {
        app.launch();
      }
    },
  });

  return Final;
};

const Tab = (tabConfig: TabConfig) =>
  Widget.Button({
    cssClasses: ["tab"],
    hexpand: true,
    halign: Gtk.Align.FILL,
    valign: Gtk.Align.CENTER,
    child: Widget.Image({
      halign: Gtk.Align.CENTER,
      hexpand: true,
      iconName: tabConfig.icon,
    }),
  });

const TabContainer = () =>
  Widget.Box({
    homogeneous: true,
    hexpand: true,
    canFocus: true,
    halign: Gtk.Align.FILL,
    valign: Gtk.Align.CENTER,
    cssClasses: ["tab-select"],
    children: tabList.map(Tab),
  });

/**
 * Contains all search results.
 */
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
          children: bind(searchResults).as((x) => x.map(AppEntry)),
        }),
      );

      self.hscrollbarPolicy = Gtk.PolicyType.NEVER;
    },
  });
};

/**
 * Text entry box for user to search for applications.
 */
const Prompt = () => {
  const SearchIcon = Widget.Image({
    cssClasses: ["search-icon"],
    iconName: "magnifying-glass-symbolic",
  });

  const TextEntryBox = Widget.Entry({
    hexpand: true,
    canFocus: true,
    cssClasses: ["text-entry"],
    onActivate: (self) => {
      searchResults.get()[0].launch();
      App.toggle_window("launcher");
      self.text = "";
    },
    onKeyReleased: (self) => {
      searchResults.set(appSearch.fuzzy_query(self.text));
    },
  });

  return Widget.Box({
    cssClasses: ["text-entry-container"],
    children: [SearchIcon, TextEntryBox],
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
      children: [prompt, SearchResultContainer()],
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
