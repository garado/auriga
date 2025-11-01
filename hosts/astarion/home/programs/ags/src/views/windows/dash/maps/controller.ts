/**
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property } from "astal/gobject";
import { PlacePrediction } from "@/services/LocationAutocomplete";
import { TripPlanResponse, TripItinerary } from "@/services/Transit";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

/*****************************************************************************
 * Types/interfaces
 *****************************************************************************/

/** All states in the state machine controlling the UI for the maps tab */
export enum MapsState {
  ENDPOINTS_SELECT, // Select origin/destination of trip
  ITINERARY_SELECT, // Choose between possible itineraries
  ITINERARY_DISPLAY, // Show details for a specific itinerary
}

/** All events that can affect the state machine controlling the UI for the maps tab */
enum MapsEventType {}

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "MapsController" })
export default class MapsController extends GObject.Object {
  // Set up singleton --------------------------------------------------------
  static instance: MapsController;

  static get_default() {
    if (!this.instance) {
      this.instance = new MapsController();
    }
    return this.instance;
  }

  // Properties --------------------------------------------------------------

  /** Is sidebar revealed or not */
  @property(Boolean)
  declare sidebarRevealState: boolean;

  /** Selected origin for trip */
  @property(Object)
  declare currentOrigin: PlacePrediction | undefined;

  /** Selected destination for trip */
  @property(Object)
  declare currentDestination: PlacePrediction | undefined;

  /** Are both the origin and destination selected */
  @property(Boolean)
  declare endpointsSelected: boolean;

  /**
   * The PlacePrediction to preview.
   * When hovering over a place prediction in search results, the map will zoom to that location.
   */
  @property(Object)
  declare previewedLocation: PlacePrediction | undefined;

  /** The trip plan that the user has selected. */
  @property(Object)
  declare currentTripPlan: TripPlanResponse | undefined;

  /** The itinerary that the user is currently previewing.
   * Itineraries are previewed on hover. */
  @property(Object)
  declare previewedItinerary: TripItinerary | undefined;

  /** The itinerary that is currently selected. */
  @property(Object)
  declare selectedItinerary: TripItinerary | undefined;

  /** The current state for the state machine controlling the UI for the maps tab */
  @property(Object)
  declare currentState: MapsState;

  // Private variables -------------------------------------------------------

  // Private functions -------------------------------------------------------
  constructor() {
    super();
    this.currentState = MapsState.ENDPOINTS_SELECT;
    this.sidebarRevealState = false;
  }

  private run_state_machine = () => {};

  /** */
  private state_idle = () => {};

  // Public functions --------------------------------------------------------
}
