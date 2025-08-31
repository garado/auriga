import { Variable } from "astal";
import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gtk, Widget } from "astal/gtk4";
import { TripItinerary, TripPlanResponse } from "@/services/Transit";

export enum MapState {
  Idle,
  RoutesLoaded,
  RouteSelected,
  Navigating,
}

// Is sidebar expanded or not
export const sidebarRevealState = Variable(false);

// Selected origin for trip
export const origin: Variable<PlacePrediction | undefined> =
  Variable(undefined);

// Selected destination for trip
export const destination: Variable<PlacePrediction | undefined> =
  Variable(undefined);

// Trip plan
export const tripPlanUpdated: Variable<TripPlanResponse | undefined> =
  Variable(undefined);

// The trip itinerary that is currently being previewed
// Updated on hover/focus
export const previewedItinerary: Variable<TripItinerary | undefined> =
  Variable(undefined);

// The trip itinerary that is currently selected
// Updated on click/<Enter>
export const selectedItinerary: Variable<TripItinerary | undefined> =
  Variable(undefined);

// Contents of this change depending on the mode that the user is currently in
export const sidebarContent = Widget.Box({
  cssClasses: ["section-content"],
  vertical: true,
  vexpand: true,
  hexpand: false,
  spacing: 8,
  halign: Gtk.Align.START,
  widthRequest: 500,
  heightRequest: 1000,
});
