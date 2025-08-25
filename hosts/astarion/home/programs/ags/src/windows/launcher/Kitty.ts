import { listAllFilesFromDir } from "@/utils/File";
import { execAsync, GLib, Variable } from "astal";
import { App, Gdk, Gtk, Widget } from "astal/gtk4";
import Pango from "gi://Pango?version=1.0";

const KITTY_SESSION_DIR = `${GLib.getenv("HOME")}/.config/kitty/sessions/`;

const allSessions = listAllFilesFromDir(KITTY_SESSION_DIR).sort() || [];

// Single entry widget
const SessionEntry = (sessionName: string) => {
  return Widget.Button({
    cssClasses: ["result"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: sessionName,
      justify: Gtk.Justification.LEFT,
      halign: Gtk.Align.FILL,
      hexpand: true,
      ellipsize: Pango.EllipsizeMode.END,
    }),
    onClicked: () => launchKittySession(sessionName),
    onKeyPressed: (_self, keyval) => {
      if (keyval === Gdk.KEY_Return) {
        launchKittySession(sessionName);
      }
    },
  });
};

// Reactive search results
export const sessionResults = Variable(allSessions);

// Reactive widget list
export const sessionResultWidgets = Variable.derive(
  [sessionResults],
  (sessions) => sessions.map(SessionEntry),
);

// Update search results
export const updateSessionSearch = (query: string) => {
  const filtered = allSessions.filter((session) =>
    session.toLowerCase().includes(query.toLowerCase()),
  );
  sessionResults.set(filtered);
};

const launchKittySession = (sessionName: string) => {
  App.toggle_window("launcher");
  execAsync([
    "kitty",
    "--session",
    `sessions/${sessionName}`,
    `--title`,
    sessionName,
  ]).catch((error) => console.error("Failed to launch kitty session:", error));
};

export const launchFirstSession = () =>
  launchKittySession(sessionResults.get()[0]);
