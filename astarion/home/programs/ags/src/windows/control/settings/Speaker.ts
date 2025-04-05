import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, bind, execAsync } from "astal";
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
    active: bind(sink, "is-default"),
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
    onClicked: (self) => {
      sink.set_mute(!sink.mute);
      print(self.active);
    },
  });

/**
 * Widget providing controls for a sink. Speaker?
 */
const SpeakerWidget = (sink: AstalWp.Endpoint) =>
  Widget.CenterBox({
    startWidget: Widget.Label({
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      label: `${sink.description}`,
      ellipsize: Pango.EllipsizeMode.END,
    }),
    endWidget: Widget.Box({
      children: [SpeakerWidget_Mute(sink), SpeakerWidget_Default(sink)],
    }),
  });

export const Speaker = (globalRevealerState: Variable<boolean>) => {
  return ExpansionPanel({
    icon: "speaker-low-symbolic",
    label: bind(wp!.audio, "speakers").as(
      (speakers) => speakers[0]?.description ?? "None",
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
