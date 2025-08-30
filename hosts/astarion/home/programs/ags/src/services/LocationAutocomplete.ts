/**
 * █░░ █▀█ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█   ▄▀█ █░█ ▀█▀ █▀█ █▀▀ █▀█ █▀▄▀█ █▀█ █░░ █▀▀ ▀█▀ █▀▀
 * █▄▄ █▄█ █▄▄ █▀█ ░█░ █ █▄█ █░▀█   █▀█ █▄█ ░█░ █▄█ █▄▄ █▄█ █░▀░█ █▀▀ █▄▄ ██▄ ░█░ ██▄
 *
 * For interfacing with the LocationIQ Autocomplete API.
 * https://docs.locationiq.com/docs/autocomplete#brief-overview-of-request--response-parameters
 */

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

export interface BoundingBox {
  minLat: string;
  maxLat: string;
  minLon: string;
  maxLon: string;
}

export interface Address {
  name?: string;
  houseNumber?: string;
  road?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface PlacePrediction {
  placeId: string;
  osmId: string;
  osmType: string;
  licence: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  class: string;
  type: string;
  displayName: string;
  displayPlace?: string;
  displayAddress?: string;
  address?: Address;
}

export interface AutocompleteResponse {
  predictions: PlacePrediction[];
}

export interface SearchOptions {
  query: string;
  limit?: number;
  viewbox?: BoundingBox;
  bounded?: boolean;
  countryCodes?: string[];
  acceptLanguage?: string;
  tag?: string;
  normalizeCity?: boolean;
}

export interface PlaceDetails {
  placeId: string;
  displayName: string;
  location: Location;
  address: Address;
  boundingBox: BoundingBox;
  class: string;
  type: string;
}

/**********************************************
 * MODULE LEVEL VARIABLES
 **********************************************/

const locationConfig = SettingsManager.get_default().config.transit;

/**********************************************
 * UTILITY
 **********************************************/

/**
 * @function makeApiCall
 * @brief Make a call to the LocationIQ API with proper authentication.
 */
async function makeApiCall(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<any> {
  const baseUrl = "https://api.locationiq.com/v1";
  const apiKey = locationConfig.autocompleteApiKey;

  if (!apiKey) {
    throw new Error("LocationIQ API key not configured");
  }

  const queryParts: string[] = [];
  queryParts.push(`key=${encodeURIComponent(apiKey)}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        queryParts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(value.join(","))}`,
        );
      } else {
        queryParts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`,
        );
      }
    }
  });

  const queryString = queryParts.length > 0 ? "?" + queryParts.join("&") : "";
  const url = `${baseUrl}${endpoint}${queryString}`;

  // Escape the URL properly for bash
  const escapedUrl = url.replace(/"/g, '\\"');
  const cmd = `curl -s "${escapedUrl}"`;

  log("locationService", `Making API call: ${url}`);

  print(cmd);

  try {
    const response = await execAsync(cmd);
    return JSON.parse(response);
  } catch (error) {
    log("locationService", `API call failed: ${error}`);
    throw error;
  }
}

/**
 * @function transformPlacePrediction
 * @brief Transform API response from snake_case to camelCase.
 */
function transformPlacePrediction(rawPlace: any): PlacePrediction {
  return {
    placeId: rawPlace.place_id || "",
    osmId: rawPlace.osm_id || "",
    osmType: rawPlace.osm_type || "",
    licence: rawPlace.licence || "",
    lat: rawPlace.lat || "0",
    lon: rawPlace.lon || "0",
    boundingbox: rawPlace.boundingbox || [],
    class: rawPlace.class || "",
    type: rawPlace.type || "",
    displayName: rawPlace.display_name || "",
    displayPlace: rawPlace.display_place,
    displayAddress: rawPlace.display_address,
    address: rawPlace.address ? transformAddress(rawPlace.address) : undefined,
  };
}

/**
 * @function transformAddress
 * @brief Transform address object from snake_case to camelCase.
 */
function transformAddress(rawAddress: any): Address {
  return {
    name: rawAddress.name,
    houseNumber: rawAddress.house_number,
    road: rawAddress.road,
    suburb: rawAddress.suburb,
    city: rawAddress.city,
    county: rawAddress.county,
    state: rawAddress.state,
    postcode: rawAddress.postcode,
    country: rawAddress.country,
    countryCode: rawAddress.country_code,
  };
}

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "LocationAutocomplete" })
export default class LocationAutocomplete extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: LocationAutocomplete;

  static get_default() {
    if (!this.instance) {
      this.instance = new LocationAutocomplete();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @property(Object)
  declare recentPredictions: PlacePrediction[];

  @property(Object)
  declare searchHistory: SearchOptions[];

  @property(Object)
  declare selectedPlace: PlacePrediction | null;

  @property(Object)
  declare currentLocation: Location;

  @property(String)
  declare currentQuery: string;

  @property(Boolean)
  declare isSearching: boolean;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();

    this.recentPredictions = [];
    this.searchHistory = [];
    this.selectedPlace = null;
    this.currentQuery = "";
    this.isSearching = false;
    this.currentLocation = locationConfig.defaultLocation;
  }

  /**
   * @function addToHistory
   * @brief Add a search to the search history.
   */
  #addToHistory = (options: SearchOptions) => {
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(
      (item) => item.query !== options.query,
    );

    // Add to beginning
    this.searchHistory = [options, ...this.searchHistory];

    // Keep only last 20 searches
    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20);
    }
  };

  /**
   * @function performAutocomplete
   * @brief Perform autocomplete search with given options.
   */
  #performAutocomplete = async (
    options: SearchOptions,
  ): Promise<PlacePrediction[]> => {
    try {
      log("locationService", `Autocomplete search: ${options.query}`);

      const params: Record<string, any> = {
        q: options.query,
        format: "json",
        limit: options.limit || 10,
        normalizecity: options.normalizeCity ? 1 : 0,
      };

      if (options.viewbox) {
        params.viewbox = `${options.viewbox.minLon},${options.viewbox.minLat},${options.viewbox.maxLon},${options.viewbox.maxLat}`;
      }

      if (options.bounded !== undefined) {
        params.bounded = options.bounded ? 1 : 0;
      }

      if (options.countryCodes && options.countryCodes.length > 0) {
        params.countrycodes = options.countryCodes.join(",");
      }

      if (options.acceptLanguage) {
        params["accept-language"] = options.acceptLanguage;
      }

      if (options.tag) {
        params.tag = options.tag;
      }

      const response = await makeApiCall("/autocomplete", params);

      // Transform response from snake_case to camelCase
      const predictions = Array.isArray(response)
        ? response.map(transformPlacePrediction)
        : [];

      log("locationService", `Found ${predictions.length} predictions`);

      return predictions;
    } catch (error) {
      log("locationService", `Autocomplete search failed: ${error}`);
      return [];
    }
  };

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/

  /**
   * @function search
   * @brief Perform an autocomplete search and update properties.
   */
  search = async (
    query: string,
    options: Partial<SearchOptions> = {},
  ): Promise<PlacePrediction[]> => {
    if (!query.trim()) {
      this.recentPredictions = [];
      this.currentQuery = "";
      return [];
    }

    this.isSearching = true;
    this.currentQuery = query;

    const searchOptions: SearchOptions = {
      query: query.trim(),
      limit: options.limit || 10,
      normalizeCity:
        options.normalizeCity !== undefined ? options.normalizeCity : true,
      ...options,
    };

    try {
      const predictions = await this.#performAutocomplete(searchOptions);

      this.recentPredictions = predictions;
      this.#addToHistory(searchOptions);

      return predictions;
    } finally {
      this.isSearching = false;
    }
  };

  /**
   * @function searchNear
   * @brief Search for places near a specific location.
   */
  searchNear = async (
    query: string,
    location: Location = this.currentLocation,
    radiusKm: number = 10,
    options: Partial<SearchOptions> = {},
  ): Promise<PlacePrediction[]> => {
    // Create viewbox around the location (approximate)
    const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const lonDelta =
      radiusKm / (111 * Math.cos((location.lat * Math.PI) / 180));

    const viewbox: BoundingBox = {
      minLat: (location.lat - latDelta).toString(),
      maxLat: (location.lat + latDelta).toString(),
      minLon: (location.lon - lonDelta).toString(),
      maxLon: (location.lon + lonDelta).toString(),
    };

    return this.search(query, {
      ...options,
      viewbox,
      bounded: true,
    });
  };

  /**
   * @function searchByType
   * @brief Search for places of a specific type.
   */
  searchByType = async (
    query: string,
    placeType: string,
    options: Partial<SearchOptions> = {},
  ): Promise<PlacePrediction[]> => {
    return this.search(query, {
      ...options,
      tag: placeType,
    });
  };

  /**
   * @function selectPlace
   * @brief Select a place from the predictions.
   */
  selectPlace = (place: PlacePrediction) => {
    this.selectedPlace = place;
    log("locationService", `Selected place: ${place.displayName}`);
  };

  /**
   * @function getPlaceDetails
   * @brief Get simplified place details from a prediction.
   */
  getPlaceDetails = (place: PlacePrediction): PlaceDetails => {
    const bbox = place.boundingbox;

    return {
      placeId: place.placeId,
      displayName: place.displayName,
      location: {
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
      },
      address: place.address || {},
      boundingBox: {
        minLat: bbox[0] || "0",
        maxLat: bbox[1] || "0",
        minLon: bbox[2] || "0",
        maxLon: bbox[3] || "0",
      },
      class: place.class,
      type: place.type,
    };
  };

  /**
   * @function clearHistory
   * @brief Clear search history.
   */
  clearHistory = () => {
    this.searchHistory = [];
    log("locationService", "Search history cleared");
  };

  /**
   * @function clearResults
   * @brief Clear current search results.
   */
  clearResults = () => {
    this.recentPredictions = [];
    this.currentQuery = "";
    this.selectedPlace = null;
  };

  /**
   * @function setCurrentLocation
   * @brief Update the current location for location-based searches.
   */
  setCurrentLocation = (location: Location) => {
    this.currentLocation = location;
    log(
      "locationService",
      `Current location updated: ${location.lat}, ${location.lon}`,
    );
  };

  /**
   * @function formatDisplayName
   * @brief Format a display name for better readability.
   */
  formatDisplayName = (
    place: PlacePrediction,
  ): { primary: string; secondary: string } => {
    const parts = place.displayName.split(", ");

    return {
      primary: place.displayPlace || parts[0] || place.displayName,
      secondary: place.displayAddress || parts.slice(1).join(", ") || "",
    };
  };

  /**
   * @function isValidLocation
   * @brief Check if coordinates are valid.
   */
  isValidLocation = (location: Location): boolean => {
    return (
      location.lat >= -90 &&
      location.lat <= 90 &&
      location.lon >= -180 &&
      location.lon <= 180
    );
  };

  /**
   * @function calculateDistance
   * @brief Calculate distance between two locations in kilometers.
   */
  calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLon = ((loc2.lon - loc1.lon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
}
