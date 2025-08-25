import { Variable } from "astal";
import { App, Gdk, Gtk, Widget } from "astal/gtk4";
import Apps from "gi://AstalApps";
import Pango from "gi://Pango?version=1.0";

const MAX_RESULTS_SHOWN = 7;

// App search instance
const appSearch = new Apps.Apps({
  nameMultiplier: 2,
  entryMultiplier: 0,
  executableMultiplier: 2,
});

// Single app entry widget
const AppEntry = (app: Apps.Application) => {
  return Widget.Button({
    cssClasses: ["result"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: app.name,
      justify: Gtk.Justification.LEFT,
      halign: Gtk.Align.FILL,
      hexpand: true,
      ellipsize: Pango.EllipsizeMode.END,
    }),
    onClicked: () => {
      App.toggle_window("launcher");
      app.launch();
    },
    onKeyPressed: (_self, keyval) => {
      if (keyval === Gdk.KEY_Return) {
        App.toggle_window("launcher");
        app.launch();
      }
    },
  });
};

// Reactive search results
export const appResults = Variable(appSearch.fuzzy_query(""));

// Reactive widget list
// To this:
export const appResultWidgets = Variable.derive([appResults], (apps) =>
  apps.slice(0, MAX_RESULTS_SHOWN).map(AppEntry),
);

// Update search results
export const updateAppSearch = (query: string) => {
  appResults.set(appSearch.fuzzy_query(query));
};

export const launchFirstApp = () => appResults.get()[0].launch();
