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
    hexpand: true,
    halign: Gtk.Align.FILL,
    children: [
      Widget.Label({
        label: prediction.displayPlace || "No name",
        wrap: true,
        cssClasses: ["name"],
        halign: Gtk.Align.START,
        hexpand: true,
        maxWidthChars: -1,
      }),
      Widget.Label({
        label: prediction.displayAddress || "No address",
        cssClasses: ["address"],
        halign: Gtk.Align.FILL,
        xalign: 0,
        hexpand: true,
        wrap: true,
        maxWidthChars: 1000,
      }),
    ],
  });

  const predictionWidget = Widget.Box({
    vertical: false,
    hexpand: true,
    halign: Gtk.Align.FILL,
    spacing: 8,
    children: [icon, info],
  });

  return Widget.Button({
    cssClasses: ["place-prediction"],
    hexpand: true,
    halign: Gtk.Align.FILL,
    child: predictionWidget,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      selectionTarget.set(prediction);
    },
  });
};
