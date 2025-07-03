import { App, Astal, Gdk, Gtk, Widget, astalify } from "astal/gtk4";
import { Variable, GLib, bind } from "astal";

/******************************************
 * MODULE-LEVEL VARIABLES
 ******************************************/

// prettier-ignore
const buttons = [
  "7", "8", "9", "/",
  "4", "5", "6", "*",
  "1", "2", "3", "-",
  "0", ".", "=", "+"
];

/******************************************
 * HELPERS
 ******************************************/

const safeEvaluate = (expression: string) => {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error("Invalid characters in expression.");
  }

  return Function('"use strict"; return (' + expression + ")")();
};

/******************************************
 * WIDGETS
 ******************************************/

export default () => {
  let grid = undefined;
  let entry: any = undefined;

  const history: Array<string> = [];
  let historyIndex = 0;

  const evaluate = () => {
    try {
      const expr = entry.get_text();
      const result = safeEvaluate(expr);
      entry.set_text(result.toString());
      entry.set_position(-1);
      history.push(expr);
      historyIndex = history.length - 1;
    } catch (e) {
      entry.set_text("Error");
    }
  };

  entry = Widget.Entry({
    cssClasses: ["entry"],
    hexpand: true,
    halign: Gtk.Align.FILL,
    onActivate: evaluate,
    onKeyPressed: (self, keyval) => {
      if (keyval == Gdk.KEY_Up) {
        if (historyIndex > 0) {
          historyIndex--;
        }
        self.set_text(history[historyIndex]);
        self.grab_focus_without_selecting();
      } else if (keyval == Gdk.KEY_Down) {
        if (historyIndex < history.length - 1) {
          historyIndex++;
        }
        self.set_text(history[historyIndex]);
        self.grab_focus_without_selecting();
      }
    },
  });

  const entryContainer = Widget.Box({
    cssClasses: ["entry-container"],
    children: [entry],
  });

  grid = new Gtk.Grid({
    column_spacing: 10,
    row_spacing: 10,
  });

  grid.attach(entryContainer, 0, 0, 4, 1);

  buttons.forEach((text, index) => {
    const button = Widget.Button({
      cssClasses: ["button"],
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      child: Widget.Label({
        label: text,
      }),
      onButtonPressed: () => {
        if (text === "=") {
          evaluate();
        } else {
          entry.set_text(entry.get_text() + text);
        }
      },
    });

    grid.attach(button, index % 4, Math.floor(index / 4) + 1, 1, 1);
  });

  return Widget.Box({
    cssClasses: ["calculator"],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    children: [grid],
  });
};
