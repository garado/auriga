/**
 * Can't seem to get gtksourceview5 and webkit6 to work with
 * Astal4, so this is a DIY GtkSourceView implementation that is built
 * on top of Gtk.TextView
 */

import { App, Astal, Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, GLib, bind } from "astal";
import { exec, execAsync } from "astal/process";
import Gio from "gi://Gio";
import Pango from "gi://Pango";

const TextView = astalify(Gtk.TextView);

/******************************************
 * HELPERS
 ******************************************/

export const CustomSourceView = (props: { lang: string; code: string }) => {
  /**
   * Displays some information about the code we're rendering.
   */
  const TopBar = Widget.CenterBox({
    cssClasses: ["topbar"],
    vertical: false,
    children: [
      Widget.Label({
        cssClasses: ["language"],
        label: props.lang,
        xalign: 0,
      }),
    ],
  });

  /**
   * Contains the actual code to display.
   */
  const Content = TextView({
    cssClasses: ["code"],
    wrapMode: true,
    editable: false,
    acceptsTab: false,
    monospace: true,
    vexpand: false,
    hexpand: false,
    xalign: 0,
    setup: (self) => {
      self.buffer.text = props.code;
    },
  });

  const Final = Widget.Box({
    cssClasses: ["sourceview"],
    vertical: true,
    children: [TopBar, Content],
  });

  return Final;
};
