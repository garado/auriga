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

export interface MapsControllerInterface {
  currentOrigin: PlacePrediction | undefined;
  currentDestination: PlacePrediction | undefined;
}

export type ControllerKey = keyof Pick<
  MapsController,
  "currentOrigin" | "currentDestination"
>;

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
  get currentOrigin(): PlacePrediction | undefined {
    return this._currentOrigin;
  }

  set currentOrigin(origin: PlacePrediction | undefined) {
    this._currentOrigin = origin;
    this.bothEndpointsSelected =
      this._currentOrigin !== undefined &&
      this._currentDestination !== undefined;
    this.notify("current-origin");
  }

  /** Selected destination for trip */
  @property(Object)
  get currentDestination(): PlacePrediction | undefined {
    return this._currentDestination;
  }

  set currentDestination(origin: PlacePrediction | undefined) {
    this._currentDestination = origin;
    this.bothEndpointsSelected =
      this._currentOrigin !== undefined &&
      this._currentDestination !== undefined;
    this.notify("current-destination");
  }

  /** ugh */
  @property(String)
  declare endpointBeingModified: ControllerKey;

  /** ugh */
  @property(Object)
  declare endpointSearchResults: PlacePrediction[];

  /** Are both the origin and destination selected? */
  @property(Boolean)
  declare bothEndpointsSelected: boolean;

  /**
   * The PlacePrediction to preview.
   * When hovering over a place prediction in search results, the map will zoom to that location.
   */
  @property(Object)
  declare previewedLocation: PlacePrediction | undefined;

  /** The trip plan that the user has selected. */
  @property(Object)
  get currentTripPlan(): TripPlanResponse | undefined {
    return this._currentTripPlan;
  }

  set currentTripPlan(plan: TripPlanResponse | undefined) {
    this._currentTripPlan = plan;
    this.calculate_state();
    this.notify("current-trip-plan");
  }

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

  private _currentTripPlan: TripPlanResponse | undefined;
  private _currentOrigin: PlacePrediction | undefined;
  private _currentDestination: PlacePrediction | undefined;

  // Private functions -------------------------------------------------------
  constructor() {
    super();
    this.endpointBeingModified = "currentOrigin";
    this.currentState = MapsState.ENDPOINTS_SELECT;
    this.sidebarRevealState = false;
    this.endpointSearchResults = [];
  }

  /** YEEEEEHAW */
  private calculate_state = () => {
    switch (this.currentState) {
      case MapsState.ENDPOINTS_SELECT: {
        if (this.currentTripPlan !== undefined) {
          this.currentState = MapsState.ITINERARY_SELECT;
        }
      }

      case MapsState.ITINERARY_SELECT: {
      }

      case MapsState.ITINERARY_DISPLAY: {
      }

      default:
        break;
    }
  };

  // Public functions --------------------------------------------------------
}
