/**
 * █▀█ █░░ ▄▀█ █▀▀ █▀▀   █▀█ █▀█ █▀▀ █▀▄ █ █▀▀ ▀█▀ █ █▀█ █▄░█
 * █▀▀ █▄▄ █▀█ █▄▄ ██▄   █▀▀ █▀▄ ██▄ █▄▀ █ █▄▄ ░█░ █ █▄█ █░▀█
 *
 * Widget displaying a location autocomplete result
 */

import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gdk, Gtk, Widget } from "astal/gtk4";
import MapsController, { ControllerKey } from "../../../controller";

export const Prediction = (prediction: PlacePrediction) => {
  const controller = MapsController.get_default();

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
        cssClasses: ["name"],
        halign: Gtk.Align.START,
        hexpand: true,
        maxWidthChars: -1,
        wrap: true,
      }),
      Widget.Label({
        label: prediction.displayAddress || "No address",
        cssClasses: ["address"],
        halign: Gtk.Align.FILL,
        hexpand: true,
        maxWidthChars: 1000,
        wrap: true,
        xalign: 0,
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

  const setPreviewedLocation = () => {
    if (prediction !== controller.previewedLocation) {
      controller.previewedLocation = prediction;
    }
  };

  return Widget.Button({
    child: predictionWidget,
    cssClasses: ["place-prediction"],
    hexpand: true,
    halign: Gtk.Align.FILL,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      const endpoint: ControllerKey = controller.endpointBeingModified;
      controller[endpoint] = prediction;
    },
    onFocusEnter: setPreviewedLocation,
    onHoverEnter: setPreviewedLocation,
  });
};
