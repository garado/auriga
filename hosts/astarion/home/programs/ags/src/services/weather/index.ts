/**
 * █▀█ █▀█ █▀▀ █▄░█ █░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█
 * █▄█ █▀▀ ██▄ █░▀█ ▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄*
 *
 * A service to interface with OpenWeatherMap API.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property, signal, GLib } from "astal/gobject";
import { execAsync } from "astal/process";
import SettingsManager from "../settings";
import { fileWrite, mkdir } from "@/utils/File";
import { readFile } from "astal";
import { CMD } from "@/utils/Commands";
import { getSecret } from "@/utils/Secrets";

/*****************************************************************************
 * Types/interfaces
 *****************************************************************************/

/**
 * https://openweathermap.org/current
 */
export interface CurrentWeather {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    "1h"?: number;
    "3h"?: number;
  };
  snow?: {
    "1h"?: number;
    "3h"?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

/**
 * https://openweathermap.org/forecast5
 */
export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  visibility: number;
  pop: number;
  rain?: {
    "3h": number;
  };
  snow?: {
    "3h": number;
  };
  sys: {
    pod: string;
  };
  dt_txt: string;
}

/*****************************************************************************
 * Constants
 *****************************************************************************/

const WEATHER_CFG = SettingsManager.get_default().config.weather;
const WEATHER_SECRET_STORE =
  SettingsManager.get_default().config.secrets.openweather;

const BASE_URL = "https://api.openweathermap.org/data/2.5";

const WEATHER_CACHE_DIR = `${GLib.get_user_cache_dir()}/astal/weather`;

const CURRENT_WEATHER_CACHE_FILE = `${WEATHER_CACHE_DIR}/current_weather.json`;
const FORECAST_CACHE_FILE = `${WEATHER_CACHE_DIR}/forecast.json`;

const CURRENT_WEATHER_CACHE_TS = `${WEATHER_CACHE_DIR}/current_weather_ts`;
const FORECAST_CACHE_TS = `${WEATHER_CACHE_DIR}/forecast_ts`;

const CURRENT_WEATHER_UPDATE_INTERVAL = 60 * 10 * 1000; // (ms) 10 minutes
const FORECAST_UPDATE_INTERVAL = 60 * 60 * 1000; // (ms) 1 hour

const CACHE_VALIDITY = {
  currentWeather: {
    file: CURRENT_WEATHER_CACHE_FILE,
    interval: CURRENT_WEATHER_UPDATE_INTERVAL,
    timestamp: CURRENT_WEATHER_CACHE_TS,
  },
  forecast: {
    file: FORECAST_CACHE_FILE,
    interval: FORECAST_UPDATE_INTERVAL,
    timestamp: FORECAST_CACHE_TS,
  },
} as const;

interface CacheValidityData {
  file: string;
  interval: number;
  timestamp: string;
}

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "OpenWeather" })
export default class OpenWeather extends GObject.Object {
  // Set up singleton --------------------------------------------------------
  static instance: OpenWeather;

  static get_default() {
    if (!this.instance) {
      this.instance = new OpenWeather();
    }
    return this.instance;
  }

  // Properties --------------------------------------------------------------
  @property(Object)
  declare current: CurrentWeather | null;

  @property(Object)
  declare forecast: ForecastItem[];

  @property(Boolean)
  declare loading: boolean;

  @signal(Object)
  declare currentUpdated: (weather: CurrentWeather) => void;

  @signal(Object)
  declare forecastUpdated: (forecast: ForecastItem[]) => void;

  // Private functions -------------------------------------------------------
  constructor() {
    super();
    this.current = null;
    this.forecast = [];
    this.loading = false;

    this.#initCache();
    this.#fetchCurrent();
    this.#fetchForecast();
  }

  // Public functions --------------------------------------------------------

  #testCacheValidity(cacheData: CacheValidityData) {
    try {
      // Check existence
      if (!readFile(cacheData.file)) return false;

      // Check timestamp file
      const timestamp = Number(readFile(cacheData.timestamp));
      if (Date.now() - timestamp > cacheData.interval) return false;
    } catch (err) {
      return false;
    }

    return true;
  }

  /**
   * Initialize cache directories, creating them if they don't yet exist
   */
  #initCache() {
    mkdir(WEATHER_CACHE_DIR);
  }

  /**
   * Fetch current weather data
   * https://openweathermap.org/current
   */
  async #fetchCurrent() {
    this.loading = true;

    // Check if cached data is recent enough or even exists at all
    const isCacheValid = this.#testCacheValidity(CACHE_VALIDITY.currentWeather);

    let cmd = "";
    if (isCacheValid) {
      cmd = `${CMD.bash} -c "cat ${CACHE_VALIDITY.currentWeather.file}"`;
    } else {
      // Query data from API
      const url = `${BASE_URL}/weather?lat=${WEATHER_CFG.lat}&lon=${WEATHER_CFG.lon}&units=${WEATHER_CFG.units}&appid=${getSecret(WEATHER_SECRET_STORE)}`;
      cmd = `${CMD.bash} -c "curl -s '${url}' | tee ${CACHE_VALIDITY.currentWeather.file}"`;
    }

    try {
      const response = await execAsync(cmd);

      // Save data query timestamp if the curl was successful
      if (!isCacheValid) {
        fileWrite(CACHE_VALIDITY.currentWeather.timestamp, `${Date.now()}`);
      }

      this.current = JSON.parse(response);
    } catch (err) {
      console.error("OpenWeather: fetchCurrent failed:", err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Fetch forecast data for the next 12 hours (3-hour intervals)
   */
  async #fetchForecast() {
    this.loading = true;

    // Check if cached data is recent enough or even exists at all
    const isCacheValid = this.#testCacheValidity(CACHE_VALIDITY.forecast);

    let cmd = "";
    if (isCacheValid) {
      cmd = `${CMD.bash} -c "cat ${CACHE_VALIDITY.forecast.file}"`;
    } else {
      // Query data from API
      const url = `${BASE_URL}/forecast?cnt=5&lat=${WEATHER_CFG.lat}&lon=${WEATHER_CFG.lon}&units=${WEATHER_CFG.units}&appid=${WEATHER_CFG.apiKey}`;
      cmd = `${CMD.bash} -c "curl -s '${url}' | tee ${CACHE_VALIDITY.forecast.file}"`;
    }

    try {
      const response = await execAsync(cmd);

      // Save data query timestamp if the curl was successful
      if (!isCacheValid) {
        fileWrite(CACHE_VALIDITY.forecast.timestamp, `${Date.now()}`);
      }

      this.forecast = JSON.parse(response).list;
    } catch (err) {
      console.error("OpenWeather: fetchForecast failed:", err);
    } finally {
      this.loading = false;
    }
  }
}
