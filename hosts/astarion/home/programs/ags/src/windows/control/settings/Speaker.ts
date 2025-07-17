/**
 * █▀ █▀█ █▀▀ ▄▀█ █▄▀ █▀▀ █▀█
 * ▄█ █▀▀ ██▄ █▀█ █░█ ██▄ █▀▄
 *
 * Audio sink controls.
 *
 * Supports setting default sink, muting sinks, and adjusting sink output volume.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, bind, execAsync, timeout } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import AstalWp from "gi://AstalWp";
import Pango from "gi://Pango?version=1.0";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const wp = AstalWp.get_default();
const ToggleButton = astalify(Gtk.ToggleButton);

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/**
 * Button to toggle if a sink is the default sink.
 */
const SpeakerWidget_Default = (sink: AstalWp.Endpoint) =>
  ToggleButton({
    cssClasses: ["toggle"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onClicked: () => {
      sink.set_is_default(!sink.is_default);

      if (sink.is_default) {
        wp?.audio.streams.forEach((stream) => {
          /* '0' seems to correspond to the default sink */
          execAsync(`bash -c "wpctl set-route ${stream.id} 0"`);
        });
      }
    },
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "lock-simple-symbolic",
        }),
      );

      // Manually bind the property, because the property throws an LSP error
      bind(sink, "isDefault").subscribe((value) => {
        self.active = Boolean(value);
      });
    },
  });

/**
 * Button to toggle if a sink is muted.
 */
const SpeakerWidget_Mute = (sink: AstalWp.Endpoint) =>
  ToggleButton({
    cssClasses: ["toggle"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onClicked: () => {
      sink.set_mute(!sink.mute);
    },
    setup: (self) => {
      self.set_child(
        Widget.Image({
          iconName: "speaker-x-symbolic",
        }),
      );

      // Manually bind the property, because the property throws an LSP error
      bind(sink, "mute").subscribe((value) => {
        self.active = Boolean(value);
      });
    },
  });

/**
 * Widget providing controls for a sink.
 */
const SpeakerWidget = (sink: AstalWp.Endpoint) => {
  const revealerState = Variable(false);
  let revealerTimer: any = null;

  return Widget.Box({
    vertical: true,
    children: [
      Widget.CenterBox({
        startWidget: Widget.Label({
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          label: `${sink.description}`,
          ellipsize: Pango.EllipsizeMode.END,
          onHoverEnter: () => {
            revealerTimer = timeout(750, () => {
              revealerState.set(true);
            });
          },
          onHoverLeave: () => {
            revealerTimer?.cancel();
          },
        }),
        endWidget: Widget.Box({
          children: [SpeakerWidget_Mute(sink), SpeakerWidget_Default(sink)],
        }),
      }),
      Widget.Revealer({
        child: Widget.Slider({
          cssClasses: ["volume"],
          min: 0,
          max: 100,
          value: bind(sink, "volume").as((volume) => volume * 100),
          onChangeValue: ({ value }) => {
            sink.set_volume(value / 100.0);
          },
        }),
        transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
        revealChild: bind(revealerState),
      }),
    ],
    onHoverLeave: () => {
      revealerState.set(false);
    },
  });
};

export const Speaker = (globalRevealerState: Variable<boolean>) => {
  return ExpansionPanel({
    icon: "speaker-low-symbolic",
    label: bind(wp!.audio.default_speaker, "description").as(
      (desc) => desc ?? "None",
    ),
    children: bind(wp!.audio, "speakers").as((speakers) =>
      speakers.map(SpeakerWidget),
    ),
    cssClasses: ["speaker"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
