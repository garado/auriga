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
import { setupEventController } from "@/utils/EventControllerKeySetup";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const Notebook = astalify(Gtk.Notebook);

const KEYBOARD_SHORTCUTS = {
  CLOSE_UTILITY: "Escape",
  SHOW_TOOLS: "h",
  SHOW_GEMINI: "l",
} as const;

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
  const utilityPanel = UtilityPanel();

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
      child: utilityPanel,
    }),
    setup: (self) => {
      // Workaround for revealer bug. https://github.com/wmww/gtk4-layer-shell/issues/60
      self.set_default_size(1, 1);

      setupEventController({
        name: "UtilityPanel",
        widget: self,
        forwardTarget: utilityPanel,
        binds: {
          [KEYBOARD_SHORTCUTS.CLOSE_UTILITY]: () => {
            App.closeWindow("utility");
          },
          [KEYBOARD_SHORTCUTS.SHOW_TOOLS]: () => {
            utilityPanel.set_current_page(0);
          },
          [KEYBOARD_SHORTCUTS.SHOW_GEMINI]: () => {
            utilityPanel.set_current_page(1);
          },
        },
      });
    },
  });
};
