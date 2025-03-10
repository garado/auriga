import { App, Astal, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";
import { GObject } from "astal/gobject";

import { SysFetch } from "@/windows/control/SysFetch.ts";
import { Theme } from "@/windows/control/settings/Theme.ts";
import { PowerProfiles } from "@/windows/control/settings/PowerProfiles.ts";
import { Network } from "@/windows/control/settings/Network.ts";
import { Bluetooth } from "@/windows/control/settings/Bluetooth.ts";
import { Notifications } from "@/windows/control/Notifications";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

/******************************************
 * MODULE-LEVEL VARIABLES
 ******************************************/

const globalRevealerState = Variable(false);

/******************************************
 * WIDGETS
 ******************************************/

const QuickSettings = () =>
  Widget.Box({
    vertical: true,
    spacing: 15,
    cssClasses: ["settings"],
    children: [
      Widget.Label({
        cssClasses: ["section-header"],
        xalign: 0,
        label: "Settings",
      }),
      Theme(globalRevealerState),
      PowerProfiles(globalRevealerState),
      Network(globalRevealerState),
      Bluetooth(globalRevealerState),
    ],
  });

const ControlPanel = () => {
  return Widget.Box({
    vertical: true,
    spacing: 40,
    cssClasses: ["control"],
    children: [SysFetch(), QuickSettings(), Notifications()],
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
    onNotifyVisible: (self) => {
      if (!self.visible) {
        globalRevealerState.set(!globalRevealerState.get());
      }
    },
  });
};
