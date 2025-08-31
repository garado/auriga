import { Variable } from "astal";
import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gtk, Widget } from "astal/gtk4";
import { TripItinerary, TripPlanResponse } from "@/services/Transit";

// States for map widget
export enum NavigationState {
  Idle,
  SelectOrigin,
  SelectDestination,
  SelectTrip,
  TripSelected,
}

// Events that can adjust the navigation state
export enum NavigationEvents {}

// Current navigation state
export const navigationState: Variable<NavigationState> = Variable(
  NavigationState.Idle,
);

// Is sidebar expanded or not
export const sidebarRevealState = Variable(false);

// Selected origin for trip
export const origin: Variable<PlacePrediction | undefined> =
  Variable(undefined);

// Selected destination for trip
export const destination: Variable<PlacePrediction | undefined> =
  Variable(undefined);

// Whether the "Plan Trip" button is visible.
export const planTripVisible: Variable<boolean> = Variable(false);

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
  vexpand: false,
  hexpand: false,
  spacing: 8,
  halign: Gtk.Align.FILL,
  widthRequest: 500,
});
