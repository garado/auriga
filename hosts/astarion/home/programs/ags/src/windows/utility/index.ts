import { App, Astal, Gtk, Widget, astalify } from "astal/gtk4";
import { Variable, GLib, bind } from "astal";

import { Gemini } from "@/windows/utility/Gemini.ts";
import { Tools } from "@/windows/utility/tools";

/******************************************
 * MODULE-LEVEL VARIABLES
 ******************************************/

const Notebook = astalify(Gtk.Notebook);

/******************************************
 * WIDGETS
 ******************************************/

const NotebookTabLabel = (label: string) =>
  Widget.Label({
    cssClasses: ["tab-label"],
    label: label,
  });

const UtilityPanel = () =>
  Notebook({
    focusable: false,
    halign: Gtk.Align.CENTER,
    cssClasses: ["utility"],
    setup: (self) => {
      self.append_page(Tools(), NotebookTabLabel("Tools"));
      self.append_page(Gemini(), NotebookTabLabel("Gemini"));
    },
  });

export default () => {
  const { TOP, LEFT, BOTTOM } = Astal.WindowAnchor;

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
      child: UtilityPanel(),
    }),
    setup: (self) => {
      /* Workaround for revealer bug.
       * https://github.com/wmww/gtk4-layer-shell/issues/60 */
      self.set_default_size(1, 1);
    },
  });
};
