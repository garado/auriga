/**
 * █░█ ▀█▀ █ █░░ █ ▀█▀ █▄█   █▀█ ▄▀█ █▄░█ █▀▀ █░░
 * █▄█ ░█░ █ █▄▄ █ ░█░ ░█░   █▀▀ █▀█ █░▀█ ██▄ █▄▄
 *
 * Left-hand panel containing commonly used tools.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Astal, Gtk, Widget, astalify } from "astal/gtk4";

import { GeminiChat } from "@/windows/utility/GeminiChat";
import { Tools } from "@/windows/utility/tools";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const Notebook = astalify(Gtk.Notebook);

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

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
      self.append_page(GeminiChat(), NotebookTabLabel("Gemini"));
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
      // Workaround for revealer bug. https://github.com/wmww/gtk4-layer-shell/issues/60
      self.set_default_size(1, 1);
    },
  });
};
