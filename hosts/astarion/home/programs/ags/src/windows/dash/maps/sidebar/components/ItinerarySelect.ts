import { Gdk, Gtk, Widget } from "astal/gtk4";
import { PlanLeg, TripItinerary } from "@/services/Transit";

const _PlanLeg = (planLeg: PlanLeg) => {
  return Widget.Label({
    label: `${planLeg.from.name} to ${planLeg.to.name}`,
  });
};

export const ItineraryWidget = (itinerary: TripItinerary) => {
  const tripItineraryWidget = Widget.Box({
    vertical: false,
    hexpand: false,
    halign: Gtk.Align.START,
    spacing: 8,
    children: itinerary.legs.map(_PlanLeg),
  });

  return Widget.Button({
    child: tripItineraryWidget,
    cssClasses: ["trip-itinerary"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: false,
    halign: Gtk.Align.START,
    onButtonPressed: () => {},
  });
};
