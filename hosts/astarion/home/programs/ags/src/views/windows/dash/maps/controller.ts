/**
 * █▀▄▀█ ▄▀█ █▀█ █▀   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░ █░░ █▀▀ █▀█
 * █░▀░█ █▀█ █▀▀ ▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄ █▄▄ ██▄ █▀▄
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
    print("setting current origin");

    this._currentOrigin = origin;
    this.bothEndpointsSelected =
      this._currentOrigin !== undefined &&
      this._currentDestination !== undefined;

    this.calculateState();
    this.notify("current-origin");
  }

  /** Selected destination for trip */
  @property(Object)
  get currentDestination(): PlacePrediction | undefined {
    return this._currentDestination;
  }

  set currentDestination(destination: PlacePrediction | undefined) {
    if (this._currentDestination === destination) return;

    print("setting current dest");

    this._currentDestination = destination;
    this.bothEndpointsSelected =
      this._currentOrigin !== undefined &&
      this._currentDestination !== undefined;

    this.calculateState();
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
    if (plan === this._currentTripPlan) return;
    this._currentTripPlan = plan;
    this.calculateState();
    this.notify("current-trip-plan");
  }

  /** The itinerary that the user is currently previewing.
   * Itineraries are previewed on hover. */
  @property(Object)
  get previewedItinerary(): TripItinerary | undefined {
    return this._previewedItinerary;
  }

  set previewedItinerary(itinerary: TripItinerary | undefined) {
    if (itinerary === this._previewedItinerary) return;
    this._previewedItinerary = itinerary;
    this.notify("previewed-itinerary");
  }

  /** The itinerary that is currently selected. */
  @property(Object)
  get selectedItinerary(): TripItinerary | undefined {
    return this._selectedItinerary;
  }

  set selectedItinerary(itinerary: TripItinerary | undefined) {
    if (itinerary === this._selectedItinerary) return;
    this._selectedItinerary = itinerary;
    this.calculateState();
    this.notify("selected-itinerary");
  }

  /** The current state for the state machine controlling the UI for the maps tab */
  @property(Object)
  declare currentState: MapsState;

  // Private variables -------------------------------------------------------

  private _currentTripPlan: TripPlanResponse | undefined;
  private _currentOrigin: PlacePrediction | undefined;
  private _currentDestination: PlacePrediction | undefined;
  private _previewedItinerary: TripItinerary | undefined;
  private _selectedItinerary: TripItinerary | undefined;

  // Private functions -------------------------------------------------------
  constructor() {
    super();
    this.endpointBeingModified = "currentOrigin";
    this.currentState = MapsState.ENDPOINTS_SELECT;
    this.sidebarRevealState = false;
    this.endpointSearchResults = [];
  }

  private calculateState = () => {
    const oldState = this.currentState;

    switch (this.currentState) {
      case MapsState.ENDPOINTS_SELECT:
        {
          if (this.currentTripPlan !== undefined) {
            this.currentState = MapsState.ITINERARY_SELECT;
          }
        }
        break;

      case MapsState.ITINERARY_SELECT:
        {
          if (this.bothEndpointsSelected === false) {
            this.currentState = MapsState.ENDPOINTS_SELECT;
          } else if (this.selectedItinerary !== undefined) {
            this.currentState = MapsState.ITINERARY_DISPLAY;
          }
        }
        break;

      case MapsState.ITINERARY_DISPLAY:
        {
          if (this.bothEndpointsSelected === false) {
            this.currentState = MapsState.ENDPOINTS_SELECT;
          } else if (this.selectedItinerary === undefined) {
            this.currentState = MapsState.ITINERARY_SELECT;
          }
        }
        break;

      default:
        break;
    }
  };

  // Public functions --------------------------------------------------------
}
