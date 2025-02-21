import { App, Astal, Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";
import { GObject } from "astal/gobject";
import Apps, { Application } from "gi://AstalApps";

/******************************************
 * MODULE-LEVEL VARIABLES
 ******************************************/

enum LauncherTabs {
  Apps,
  Windows,
  Sessions,
}

const Scrollable = astalify(Gtk.ScrolledWindow);

const currentTab = LauncherTabs.Apps;

const globalRevealerState = Variable(false);

const appSearch = new Apps.Apps({
  nameMultiplier: 2,
  entryMultiplier: 0,
  executableMultiplier: 2,
});

const searchResults = Variable(appSearch.fuzzy_query(""));

/******************************************
 * WIDGETS
 ******************************************/

/**
 * Application
 */
const AppEntry = (app) => {
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
    onButtonPressed: (self) => {
      app.launch();
    },
  });

  /* Assign helper function */
  Object.assign(Final, {
    launch: app.launch,
  });

  return Final;
};

/**
 * Contains all search results
 */
const SearchResultContainer = () => {
  return Scrollable({
    vexpand: true,
    visible: true,
    child: [
      Widget.Box({
        vertical: true,
        children: bind(searchResults).as((x) => x.map(AppEntry)),
      }),
    ],
  });
};

/**
 * Type stuff here
 */
const PromptBox = () =>
  Widget.Entry({
    hexpand: true,
    canFocus: true,
    cssClasses: ["prompt"],
    onActivate: (self) => {
      searchResults.get()[0].launch();
      self.text = "";
    },
    onKeyReleased: (self) => {
      searchResults.set(appSearch.fuzzy_query(self.text));
    },
    onFocusEnter: (self) => {
      self.add_css_class("focus");
    },
    onFocusLeave: (self) => {
      self.remove_css_class("focus");
    },
  });

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
      /* Workaround for revealer bug.
       * https://github.com/wmww/gtk4-layer-shell/issues/60 */
      self.set_default_size(1, 1);
    },
    onNotifyVisible: (self) => {
      Prompt.grab_focus();

      if (!self.visible) {
        globalRevealerState.set(!globalRevealerState.get());
      }
    },
    onKeyPressed: (self, event: Gdk.Event) => {
      if (event.get_keyval()[1] === Gdk.KEY_Escape) {
        self.hide();
      }
    },
  });
};
