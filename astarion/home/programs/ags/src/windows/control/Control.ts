import { App, Astal, Gtk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";

import { SysFetch } from "@/windows/control/SysFetch.ts";
import { Theme } from "@/windows/control/settings/Theme.ts";

/******************************************
 * MODULE-LEVEL VARIABLES
 ******************************************/

const globalRevealerState = Variable(false);

/******************************************
 * WIDGETS
 ******************************************/

const QuickSettings = () =>
  Widget.Box({
    cssClasses: ["settings"],
    children: [Theme(globalRevealerState)],
  });

const ControlPanel = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: ["control"],
    children: [SysFetch(), QuickSettings()],
  });
};

export default () => {
  const { TOP, RIGHT, BOTTOM } = Astal.WindowAnchor;

  return Widget.Window({
    application: App,
    name: "control",
    cssName: "control",
    keymode: Astal.Keymode.ON_DEMAND,
    anchor: RIGHT | TOP | BOTTOM,

    child: Widget.Revealer({
      revealChild: false,
      transitionDuration: 250,
      transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
      child: ControlPanel(),
    }),
    setup: (self) => {
      /* Workaround for revealer bug.
       * https://github.com/wmww/gtk4-layer-shell/issues/60 */
      self.set_default_size(1, 1);
    },
  });
};
