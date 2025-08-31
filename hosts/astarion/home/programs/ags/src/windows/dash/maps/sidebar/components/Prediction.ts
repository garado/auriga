import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";

export const Prediction = (
  prediction: PlacePrediction,
  selectionTarget: Variable<PlacePrediction | undefined>,
) => {
  const icon = Widget.Image({
    iconName: "map-pin-symbolic",
  });

  const info = Widget.Box({
    vertical: true,
    hexpand: false,
    children: [
      Widget.Label({
        label: prediction.displayPlace || "No name",
        wrap: true,
        cssClasses: ["name"],
        halign: Gtk.Align.START,
        hexpand: false,
        maxWidthChars: -1,
      }),
      Widget.Label({
        label: prediction.displayAddress || "No address",
        cssClasses: ["address"],
        halign: Gtk.Align.START,
        hexpand: false,
        maxWidthChars: -1,
        wrap: true,
      }),
    ],
  });

  const predictionWidget = Widget.Box({
    vertical: false,
    hexpand: false,
    halign: Gtk.Align.START,
    spacing: 8,
    children: [icon, info],
  });

  return Widget.Button({
    cssClasses: ["place-prediction"],
    child: predictionWidget,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: false,
    halign: Gtk.Align.START,
    onButtonPressed: () => {
      selectionTarget.set(prediction);
    },
  });
};
