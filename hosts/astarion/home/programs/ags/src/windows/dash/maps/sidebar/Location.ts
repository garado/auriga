import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gtk, Widget } from "astal/gtk4";
import Pango from "gi://Pango?version=1.0";

export const Prediction = (prediction: PlacePrediction) => {
  const icon = Widget.Image({
    iconName: "map-pin-symbolic",
  });

  const info = Widget.Box({
    vertical: true,
    children: [
      Widget.Label({
        label: prediction.displayName || "No name",
        hexpand: false,
        cssClasses: ["name"],
        ellipsize: Pango.EllipsizeMode.END,
        justify: Gtk.Justification.LEFT,
      }),
      Widget.Label({
        label: prediction.displayAddress || "No address",
        cssClasses: ["address"],
        hexpand: false,
        ellipsize: Pango.EllipsizeMode.END,
        justify: Gtk.Justification.LEFT,
      }),
    ],
  });

  return Widget.Box({
    cssClasses: ["place-prediction"],
    vertical: false,
    hexpand: false,
    spacing: 8,
    children: [icon, info],
  });
};
