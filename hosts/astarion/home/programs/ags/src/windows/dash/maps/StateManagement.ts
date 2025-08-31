import { Variable } from "astal";
import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Widget } from "astal/gtk4";
import { TripPlanResponse } from "@/services/Transit";

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

// Contents of this change depending on the mode that the user is currently in
export const sidebarContent = Widget.Box({
  cssClasses: ["section-content"],
  hexpand: false,
  spacing: 8,
  vertical: true,
});
