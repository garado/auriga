/**
 * █▀ ▀█▀ ▄▀█ ▀█▀ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀▄▀█ █▀▀ █▄░█ ▀█▀
 * ▄█ ░█░ █▀█ ░█░ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █░▀░█ ██▄ █░▀█ ░█░
 *
 * This file provides module-level variables for state management.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Variable } from "astal";
import { PlacePrediction } from "@/services/LocationAutocomplete";
import { Gtk, Widget } from "astal/gtk4";
import { TripItinerary, TripPlanResponse } from "@/services/Transit";

/*****************************************************************************
 * Variables
 *****************************************************************************/

/** Is sidebar expanded or not */
export const sidebarRevealState = Variable(false);

/** Selected origin for trip */
export const origin: Variable<PlacePrediction | undefined> =
  Variable(undefined);

/** Selected destination for trip */
export const destination: Variable<PlacePrediction | undefined> =
  Variable(undefined);

/** Whether both endpoints of trip (origin and destination) have been selected */
export const endpointsSelected: Variable<boolean> = Variable(false);

Variable.derive([origin, destination], (x, y) => {
  endpointsSelected.set(x !== undefined && y !== undefined);
});

/**
 * PlacePrediction to preview
 * When hovering over a place prediction in search results, the map will zoom to that
 * location
 */
export const previewedLocation: Variable<PlacePrediction | undefined> =
  Variable(undefined);

/** Trip plan has been updated */
export const tripPlan: Variable<TripPlanResponse | undefined> =
  Variable(undefined);

/**
 * The trip itinerary that is currently being previewed
 * Updated on hover/focus
 */
export const previewedItinerary: Variable<TripItinerary | undefined> =
  Variable(undefined);

/**
 * The trip itinerary that is currently selected
 * Updated on click/<Enter>
 */
export const selectedItinerary: Variable<TripItinerary | undefined> =
  Variable(undefined);

/*****************************************************************************
 * Global widgets
 *****************************************************************************/

/**
 * Contents of this are dynamically updated based on the mode that the user is currently in
 */
export const sidebarContent = Widget.Box({
  cssClasses: ["section-content"],
  vertical: true,
  vexpand: false,
  hexpand: false,
  spacing: 8,
  halign: Gtk.Align.FILL,
  widthRequest: 500,
});
