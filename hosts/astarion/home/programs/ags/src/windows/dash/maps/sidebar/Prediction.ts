import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gdk, Gtk, Widget } from "astal/gtk4";
import { origin } from "./StateManagement";

export const Prediction = (prediction: PlacePrediction) => {
  const icon = Widget.Image({
    iconName: "map-pin-symbolic",
  });

  const info = Widget.Box({
    vertical: true,
    hexpand: false,
    children: [
      Widget.Label({
        label: prediction.displayPlace || "No name",
        cssClasses: ["name"],
        halign: Gtk.Align.START,
        hexpand: false,
        justify: Gtk.Justification.LEFT,
      }),
      Widget.Label({
        label: prediction.displayAddress || "No address",
        cssClasses: ["address"],
        halign: Gtk.Align.START,
        hexpand: false,
        justify: Gtk.Justification.LEFT,
        wrap: true,
      }),
    ],
  });

  const predictionWidget = Widget.Box({
    vertical: false,
    hexpand: false,
    spacing: 8,
    children: [icon, info],
  });

  return Widget.Button({
    cssClasses: ["place-prediction"],
    child: predictionWidget,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: false,
    onButtonPressed: () => {
      origin.set(prediction);
    },
  });
};
