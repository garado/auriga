import { App, Astal, astalify, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";
import { SysFetch } from "@/windows/control/SysFetch.ts";
import { Notifications } from "@/windows/control/Notifications";
import { Actions } from "@/windows/control/actions/Actions";
import { Theme } from "@/windows/control/settings/Theme.ts";
import { PowerProfiles } from "@/windows/control/settings/PowerProfiles.ts";
import { Network } from "@/windows/control/settings/Network.ts";
import { Bluetooth } from "@/windows/control/settings/Bluetooth.ts";
import { Speaker } from "@/windows/control/settings/Speaker.ts";
import { Monitors } from "@/windows/control//settings/Monitors.ts";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

/******************************************
 * QUICK SETTINGS
 ******************************************/

const globalRevealerState = Variable(false);

export const QuickSettings = () =>
  Widget.Box({
    vertical: true,
    spacing: 15,
    cssClasses: ["settings"],
    children: [
      Theme(globalRevealerState),
      PowerProfiles(globalRevealerState),
      Network(globalRevealerState),
      Bluetooth(globalRevealerState),
      Speaker(globalRevealerState),
      Monitors(globalRevealerState),
    ],
  });

/******************************************
 * WIDGETS
 ******************************************/

const ControlPanel = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: ["control"],
    spacing: 15,
    children: [SysFetch(), Actions(), QuickSettings(), Notifications()],
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
