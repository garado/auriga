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

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/**
 * Widget representing a single application in the launcher.
 */
const AppEntry = (app: Apps.Application) => {
  const Final = Widget.Box({
    cssClasses: ["result"],
    vexpand: false,
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    children: [
      Widget.Label({
        label: app.name,
      }),
    ],
    onButtonPressed: app.launch,
  });

  /* Assign helper function */
  Object.assign(Final, {
    launch: app.launch,
  });

  return Final;
};

/**
 * Contains all search results.
 */
const SearchResultContainer = () => {
  return Scrollable({
    vexpand: true,
    visible: true,
    setup: (self) => {
      self.set_child(
        Widget.Box({
          vertical: true,
          children: bind(searchResults).as((x) => x.map(AppEntry)),
        }),
      );
    },
  });
};

/**
 * Text entry box for user to search for applications.
 */
const PromptBox = () => {
  const SearchIcon = Widget.Image({
    cssClasses: ["search-icon"],
    iconName: "magnifying-glass-symbolic",
  });

  const PromptEntryBox = Widget.Entry({
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
    canFocus: true,
    cssClasses: ["promptbox"],
    children: [SearchIcon, PromptEntryBox],
    onFocusEnter: (self) => {
      self.add_css_class("focus");
    },
    onFocusLeave: (self) => {
      self.remove_css_class("focus");
    },
  });
};

export default () => {
  const Prompt = PromptBox();

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
      children: [Prompt, SearchResultContainer()],
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
      Prompt.children[1].grab_focus();

      if (!self.visible) {
        globalRevealerState.set(!globalRevealerState.get());
      }
    },
  });
};
