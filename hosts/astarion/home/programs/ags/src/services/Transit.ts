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

import { GObject, register, property } from "astal/gobject";
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
  locationType: number;
  parentStationGlobalStopId?: string;
  routeType: number;
  rtStopId: string;
  stopCode: string;
  stopLat: number;
  stopLon: number;
  stopName: string;
  wheelchairBoarding: number;
  distance?: number;
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
  endtime: number;
  starttime: number;
  mode: string;
  from: {
    lat: number;
    lon: number;
    name: string;
    vertextype: string;
  };
  to: {
    lat: number;
    lon: number;
    name: string;
    vertextype: string;
  };
  leggeometry?: {
    length: number;
    points: string;
  };
  route?: string;
  routecolor?: string;
  routeid?: string;
  routelongname?: string;
  routeshortname?: string;
  transitleg?: boolean;
}

export interface TripItinerary {
  accessibility: string;
  duration: number;
  endtime: number;
  legs: PlanLeg[];
  starttime: number;
  transfers: number;
  transittime: number;
  walktime: number;
  wheelchairneed: string;
}

export interface TripPlanResponse {
  plan: {
    date: number;
    from: {
      lat: number;
      lon: number;
      name: string;
      vertextype: string;
    };
    itineraries: TripItinerary[];
    to: {
      lat: number;
      lon: number;
      name: string;
      vertextype: string;
    };
  };
}

export interface Network {
  networkId: string;
  networkName: string;
  networkLocation: string;
  networkInBeta: boolean;
}

/**********************************************
 * MODULE LEVEL VARIABLES
 **********************************************/

const transitConfig = SettingsManager.get_default().config.transit;

const USE_REAL_API_CALL = false;

/**********************************************
 * UTILITY
 **********************************************/

/**
 * @function makeApiCall
 * @brief Make a call to the Transit API with proper authentication.
 */
async function makeApiCall(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<any> {
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
      const response = await execAsync(cmd);
      return JSON.parse(response);
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
}

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

  @property(Object)
  declare currentTripPlanResponse: TripPlanResponse;

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

      this.currentTripPlanResponse = response;

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
