import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, bind, execAsync, timeout } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import AstalWp from "gi://AstalWp";
import Pango from "gi://Pango?version=1.0";

const wp = AstalWp.get_default();
const ToggleButton = astalify(Gtk.ToggleButton);

/**
 * Button to toggle if a sink is the default sink.
 */
const SpeakerWidget_Default = (sink: AstalWp.Endpoint) =>
  ToggleButton({
    cssClasses: ["toggle"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Image({
      iconName: "lock-simple-symbolic",
    }),
    active: bind(sink, "is_default"),
    onClicked: () => {
      sink.set_is_default(!sink.is_default);

      if (sink.is_default) {
        wp?.audio.streams.forEach((stream) => {
          /* '0' seems to correspond to the default sink */
          execAsync(`bash -c "wpctl set-route ${stream.id} 0"`);
        });
      }
    },
  });

/**
 * Button to toggle if a sink is muted.
 */
const SpeakerWidget_Mute = (sink: AstalWp.Endpoint) =>
  ToggleButton({
    cssClasses: ["toggle"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Image({
      iconName: "speaker-x-symbolic",
    }),
    active: bind(sink, "mute"),
    onClicked: () => {
      sink.set_mute(!sink.mute);
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
          onChangeValue: (self, _: any, newValue: number) => {
            sink.set_volume(newValue / 100.0);
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
