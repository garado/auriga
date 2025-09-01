/**
 * ▀█▀ █▀█ ▄▀█ █▄░█ █▀ █ ▀█▀   ▄▀█ █▀█ █
 * ░█░ █▀▄ █▀█ █░▀█ ▄█ █ ░█░   █▀█ █▀▀ █
 *
 * For interfacing with the Transit API:
 * https://api-doc.transitapp.com/
 *
 * The API is free. The API key must be requested through their Google form.
 * 5 calls/minute; 1500 calls/month at free tier.
 */

/**********************************************
 * IMPORTS
 **********************************************/

import { GObject, register, property, GLib } from "astal/gobject";
import { execAsync } from "astal/process";
import { log } from "@/globals.js";
import SettingsManager from "./settings";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export interface Location {
  lat: number;
  lon: number;
}

export interface Stop {
  globalStopId: string;
  lat: number;
  lon: number;
  name: string;
  stopCode: string;
  stopId: string;
  stopIndex: number;
  vertexType: string;
}

export interface Price {
  currencyCode: string;
  symbol: string;
  text: string;
  value: number;
}

export interface Fare {
  fareMediaType: number;
  priceMin: Price;
  priceMax: Price;
}

export interface ScheduleItem {
  departureTime: number;
  isCancelled: boolean;
  isRealTime: boolean;
  rtTripId: string;
  scheduledDepartureTime: number;
  tripSearchKey: string;
  wheelchairAccessible: number;
}

export interface Itinerary {
  directionId: number;
  directionHeadsign: string;
  headsign: string;
  mergedHeadsign: string;
  scheduleItems: ScheduleItem[];
  branchCode: string;
  closestStop?: Stop;
}

export interface Route {
  compactDisplayShortName: {
    boxedText: string;
    elements: Array<string | null>;
    routeNameRedundancy: boolean;
  };
  fares: Fare[];
  globalRouteId: string;
  itineraries: Itinerary[];
  modeName: string;
  realTimeRouteId: string;
  routeColor: string;
  routeDisplayShortName: {
    boxedText: string;
    elements: Array<string | null>;
    routeNameRedundancy: boolean;
  };
  routeLongName: string;
  routeShortName: string;
  routeTextColor: string;
  routeType: number;
  sortingKey: string;
  ttsLongName: string;
  ttsShortName: string;
}

export interface RouteDepartures {
  routeDepartures: Route[];
}

export interface NearbyRoutesResponse {
  routes: Route[];
}

export interface NearbyStopsResponse {
  stops: Stop[];
}

export interface PlanLeg {
  distance: number;
  duration: number;
  endTime: number;
  startTime: number;
  mode: string;
  from: {
    lat: number;
    lon: number;
    name: string;
    vertexType: string;
  };
  to: {
    lat: number;
    lon: number;
    name: string;
    vertexType: string;
  };
  legGeometry?: {
    length: number;
    points: string;
  };
  route?: string;
  routeColor?: string;
  routeTextColor?: string;
  routeid?: string;
  routeLongName?: string;
  routeShortName?: string;
  transitLeg?: boolean;
}

export interface PlanLeg_Transit extends PlanLeg {
  globalRouteId: string;
  headsign: string;
  interlineWithPreviousLeg: boolean;
  intermediateStops: Stop[];
}

export interface TripItinerary {
  accessibility: string;
  duration: number;
  endTime: number /** milliseconds */;
  legs: PlanLeg[];
  startTime: number /** milliseconds */;
  transfers: number;
  transitTime: number;
  walkTime: number;
  wheelchairNeed: string;
}

export interface TripPlanResponse {
  plan: {
    date: number;
    from: {
      lat: number;
      lon: number;
      name: string;
      vertexType: string;
    };
    itineraries: TripItinerary[];
    to: {
      lat: number;
      lon: number;
      name: string;
      vertexType: string;
    };
  };
}

export interface Network {
  networkId: string;
  networkName: string;
  networkLocation: string;
  networkInBeta: boolean;
}

/** Modes for legs of itinerary */
export enum Mode {
  AIRPLANE = "AIRPLANE",
  BICYCLE = "BICYCLE",
  BUS = "BUS",
  CABLE_CAR = "CABLE_CAR",
  CAR = "CAR",
  CARPOOL = "CARPOOL",
  COACH = "COACH",
  FERRY = "FERRY",
  FLEX = "FLEX",
  /**
   * @deprecated use FLEX instead — enabled flexible transit
   */
  FLEXIBLE = "FLEXIBLE",
  FUNICULAR = "FUNICULAR",
  GONDOLA = "GONDOLA",
  /**
   * @deprecated internal use only — no longer supported for API users
   */
  LEG_SWITCH = "LEG_SWITCH",
  MONORAIL = "MONORAIL",
  RAIL = "RAIL",
  SCOOTER = "SCOOTER",
  SUBWAY = "SUBWAY",
  TAXI = "TAXI",
  TRAM = "TRAM",
  TRANSIT = "TRANSIT", // A special transport mode; includes all public transport
  TROLLEYBUS = "TROLLEYBUS",
  WALK = "WALK",
}

/**********************************************
 * MODULE LEVEL VARIABLES
 **********************************************/

const transitConfig = SettingsManager.get_default().config.transit;

/** Use cached fake data for development or make real API requests */
const USE_REAL_API_CALL = true;

/** Maximum API calls per calendar month on Transit API free tier */
const TRANSIT_API_MONTHLY_LIMIT_MAX = 1500;

/** Limit at which to warn user of Transit API usage */
// const TRANSIT_API_MONTHLY_WARN = 1000;
const TRANSIT_API_MONTHLY_WARN = 13;

/** Limit at which to abort all API calls, so they don't flag my account for reaching the usage limit */
// const TRANSIT_API_MONTHLY_HARD_STOP = 1400;
const TRANSIT_API_MONTHLY_HARD_STOP = 15;

/**********************************************
 * UTILITY
 **********************************************/

/**
 * @function incrementApiCallCounter
 * @brief Transit API free tier has 1500 requests per month. There is no dashboard to
 * check analytics, so API usage is tracked clientside by storing the number of calls
 * to a file. The free tier has 1500 calls per calendar month and 5 calls per minute.
 * @returns TRUE if API call should be allowed; FALSE otherwise
 */
const incrementApiCallCounter = async (): Promise<boolean> => {
  const yyyyMm = new Date().toISOString().slice(0, 7);
  const apiCountFile = `${GLib.get_user_cache_dir()}/astal/transit/${yyyyMm}`;

  try {
    await execAsync(`mkdir -p ${GLib.get_user_cache_dir()}/astal/transit/`);

    // Initialize file with 0 if it doesn't exist, then read and increment
    await execAsync(
      `bash -c "test -f ${apiCountFile} || echo 0 > ${apiCountFile}"`,
    );

    const currentCountStr = await execAsync(`cat ${apiCountFile}`);
    const currentCountNum = parseInt(currentCountStr.trim()) || 0;

    print(currentCountNum);

    if (currentCountNum > TRANSIT_API_MONTHLY_HARD_STOP) {
      console.warn(
        `Transit API monthly usage (${currentCountNum} calls) has exceeded the hard stop threshold of ${TRANSIT_API_MONTHLY_HARD_STOP}; aborting API call`,
      );
      return false;
    } else if (currentCountNum > TRANSIT_API_MONTHLY_WARN) {
      console.warn(
        `Transit API monthly usage (${currentCountNum} calls) has exceeded the usage warning limit of ${TRANSIT_API_MONTHLY_WARN}`,
      );
    }

    await execAsync(`bash -c "echo ${currentCountNum + 1} > ${apiCountFile}"`);
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
};

/**
 * @function makeApiCall
 * @brief Make a call to the Transit API with proper authentication.
 */
const makeApiCall = async (
  endpoint: string,
  params: Record<string, any> = {},
): Promise<any> => {
  const baseUrl = "https://external.transitapp.com/v3";
  const apiKey = transitConfig.apiKey;

  if (!apiKey) {
    throw new Error("Transit API key not configured");
  }

  const queryParts: string[] = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`,
      );
    }
  });

  const queryString = queryParts.length > 0 ? "?" + queryParts.join("&") : "";
  const url = `${baseUrl}${endpoint}${queryString}`;

  const cmd = `curl -s -H "apikey: ${apiKey}" "${url}"`;

  if (USE_REAL_API_CALL) {
    try {
      const shouldMakeRequest = await incrementApiCallCounter();

      if (shouldMakeRequest) {
        const response = await execAsync(cmd);
        return JSON.parse(response);
      }
    } catch (error) {
      log("transitService", `API call failed: ${error}`);
      throw error;
    }
  } else {
    const cachefile = endpoint.replace("/public/", "").replace("/otp/", "");
    const file = `/tmp/ags/transit/${cachefile}`;
    try {
      const response = await execAsync(`cat ${file}`);
      return JSON.parse(response);
    } catch (error) {
      log("transitService", `Reading from cache failed: ${cachefile}`);
      throw error;
    }
  }
};

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Transit" })
export default class Transit extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Transit;

  static get_default() {
    if (!this.instance) {
      this.instance = new Transit();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @property(Object)
  declare nearbyRoutes: Route[];

  @property(Object)
  declare nearbyStops: Stop[];

  @property(Object)
  declare selectedStop: Stop | null;

  @property(Object)
  declare stopDepartures: Route[];

  @property(Object)
  declare availableNetworks: Network[];

  @property(Object)
  declare currentLocation: Location;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();

    this.nearbyRoutes = [];
    this.nearbyStops = [];
    this.selectedStop = null;
    this.stopDepartures = [];
    this.availableNetworks = [];
    this.currentLocation = { lat: 0, lon: 0 };

    this.#initializeLocation();
  }

  /**
   * @function initializeLocation
   * @brief Initialize with default location or get current location.
   */
  #initializeLocation = () => {
    // Use configured default location or attempt to get current location
    if (transitConfig.defaultLocation) {
      this.currentLocation = transitConfig.defaultLocation;
      // this.#fetchNearbyData();
    } else {
      // this.#getCurrentLocation();
    }
  };

  /**
   * @function getCurrentLocation
   * @brief Attempt to get current location using system tools.
   */
  #getCurrentLocation = async () => {
    try {
      log("transitService", "Getting current location...");
      // For now, use a default location
      this.currentLocation = { lat: 45.5017, lon: -73.5673 };
      this.#fetchNearbyData();
    } catch (error) {
      log("transitService", `Failed to get location: ${error}`);
    }
  };

  /**
   * @function fetchNearbyData
   * @brief Fetch both nearby routes and stops for current location.
   */
  #fetchNearbyData = async () => {
    await Promise.all([this.#fetchNearbyRoutes(), this.#fetchNearbyStops()]);
  };

  /**
   * @function fetchNearbyRoutes
   * @brief Fetch nearby routes for the current location.
   */
  #fetchNearbyRoutes = async () => {
    try {
      log("transitService", "Fetching nearby routes...");

      const response: NearbyRoutesResponse = await makeApiCall(
        "/public/nearby_routes",
        {
          lat: this.currentLocation.lat,
          lon: this.currentLocation.lon,
          max_distance: transitConfig.searchRadius || 500,
          should_update_realtime: true,
        },
      );

      this.nearbyRoutes = response.routes || [];

      log("transitService", `Found ${this.nearbyRoutes.length} nearby routes`);
    } catch (error) {
      log("transitService", `Failed to fetch nearby routes: ${error}`);
      this.nearbyRoutes = [];
    }
  };

  /**
   * @function fetchNearbyStops
   * @brief Fetch nearby stops for the current location.
   */
  #fetchNearbyStops = async () => {
    try {
      log("transitService", "Fetching nearby stops...");

      const response: NearbyStopsResponse = await makeApiCall(
        "/public/nearby_stops",
        {
          lat: this.currentLocation.lat,
          lon: this.currentLocation.lon,
          max_distance: transitConfig.searchRadius || 500,
          stop_filter: "routable",
        },
      );

      this.nearbyStops = response.stops || [];

      log("transitService", `Found ${this.nearbyStops.length} nearby stops`);
    } catch (error) {
      log("transitService", `Failed to fetch nearby stops: ${error}`);
      this.nearbyStops = [];
    }
  };

  /**
   * @function fetchStopDepartures
   * @brief Fetch upcoming departures for a specific stop.
   */
  #fetchStopDepartures = async (globalStopId: string) => {
    try {
      log("transitService", `Fetching departures for stop: ${globalStopId}`);

      const response: RouteDepartures = await makeApiCall(
        "/public/stop_departures",
        {
          global_stop_id: globalStopId,
          should_update_realtime: true,
          remove_cancelled: false,
        },
      );

      // Transform response from snake_case to camelCase if needed
      this.stopDepartures = response.routeDepartures || [];

      log(
        "transitService",
        `Found ${this.stopDepartures.length} routes with departures`,
      );
    } catch (error) {
      log("transitService", `Failed to fetch stop departures: ${error}`);
      this.stopDepartures = [];
    }
  };

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/

  /**
   * @function setLocation
   * @brief Update current location and refresh nearby data.
   */
  setLocation = async (location: Location) => {
    this.currentLocation = location;
    await this.#fetchNearbyData();
  };

  /**
   * @function selectStop
   * @brief Select a stop and fetch its departures.
   */
  selectStop = async (stop: Stop) => {
    this.selectedStop = stop;
    await this.#fetchStopDepartures(stop.globalStopId);
  };

  /**
   * @function planTrip
   * @brief Plan a trip between two locations.
   */
  planTrip = async (
    fromLat: number | string,
    fromLon: number | string,
    toLat: number | string,
    toLon: number | string,
    options: {
      mode?: string;
      wheelchair?: boolean;
      walkReluctance?: number;
      arriveBy?: boolean;
      date?: string;
      time?: string;
    } = {},
  ): Promise<TripPlanResponse> => {
    try {
      log("transitService", "Planning trip...");

      const params = {
        fromPlace: `${fromLat},${fromLon}`,
        toPlace: `${toLat},${toLon}`,
        mode: options.mode || "TRANSIT,WALK",
        wheelchair: options.wheelchair || false,
        walkreluctance: options.walkReluctance || 2,
        arriveby: options.arriveBy || false,
        numitineraries: 3,
        ignorerealtimeupdates: false,
        ...(options.date && { date: options.date }),
        ...(options.time && { time: options.time }),
      };

      const response = await makeApiCall("/otp/plan", params);

      log(
        "transitService",
        `Trip planned with ${response.plan?.itineraries?.length || 0} options`,
      );

      return response;
    } catch (error) {
      log("transitService", `Failed to plan trip: ${error}`);
      throw error;
    }
  };

  /**
   * @function searchStops
   * @brief Search for stops by name or code.
   */
  searchStops = async (
    query: string,
    location: Location = this.currentLocation,
    maxResults: number = 10,
  ): Promise<Stop[]> => {
    try {
      log("transitService", `Searching for stops: ${query}`);

      const response = await makeApiCall("/public/search_stops", {
        lat: location.lat,
        lon: location.lon,
        query: query,
        max_num_results: maxResults,
      });

      const stops = response.results || [];

      log("transitService", `Found ${stops.length} matching stops`);

      return stops;
    } catch (error) {
      log("transitService", `Failed to search stops: ${error}`);
      return [];
    }
  };

  /**
   * @function getAvailableNetworks
   * @brief Get list of available transit networks.
   */
  getAvailableNetworks = async (location?: Location): Promise<Network[]> => {
    try {
      log("transitService", "Fetching available networks...");

      const params: Record<string, any> = {
        include_all_networks: false,
        include_network_geometry: false,
      };

      if (location) {
        params.lat = location.lat;
        params.lon = location.lon;
      }

      const response = await makeApiCall("/public/available_networks", params);

      this.availableNetworks = response.networks || [];

      log("transitService", `Found ${this.availableNetworks.length} networks`);

      return this.availableNetworks;
    } catch (error) {
      log("transitService", `Failed to fetch networks: ${error}`);
      return [];
    }
  };

  /**
   * @function refreshData
   * @brief Refresh all current data.
   */
  refreshData = async () => {
    log("transitService", "Refreshing transit data...");

    await this.#fetchNearbyData();

    if (this.selectedStop) {
      await this.#fetchStopDepartures(this.selectedStop.globalStopId);
    }
  };

  /**
   * @function formatDepartureTime
   * @brief Format departure time for display.
   */
  formatDepartureTime = (
    departureTime: number,
    isRealTime: boolean = false,
  ): string => {
    const now = Math.floor(Date.now() / 1000);
    const diffMinutes = Math.floor((departureTime - now) / 60);

    if (diffMinutes <= 0) {
      return isRealTime ? "Now" : "Due";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m${isRealTime ? " *" : ""}`;
    } else {
      const date = new Date(departureTime * 1000);
      return (
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        (isRealTime ? " *" : "")
      );
    }
  };
}
