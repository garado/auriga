/**
 * █▀█ █▀█ █▀▀ █▄░█ █░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█
 * █▄█ █▀▀ ██▄ █░▀█ ▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄*
 *
 * A service to interface with OpenWeatherMap API.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property, signal } from "astal/gobject";
import { execAsync } from "astal/process";
import SettingsManager from "../settings";

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
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const UPDATE_INTERVAL = 600000; // 10 minutes in ms

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

    this.fetchCurrent();
    this.fetchForecast();
  }

  // Public functions --------------------------------------------------------

  /**
   * Fetch current weather data
   * https://openweathermap.org/current
   */
  async fetchCurrent() {
    this.loading = true;

    const url = `${BASE_URL}/weather?lat=${WEATHER_CFG.lat}&lon=${WEATHER_CFG.lon}&units=${WEATHER_CFG.units}&appid=${WEATHER_CFG.apiKey}`;

    try {
      // const response = await execAsync(`curl -s "${url}"`);
      const response = await execAsync(
        `bash -c "cat /home/alexis/.cache/astal/current-weather.json"`,
      );
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
  async fetchForecast() {
    this.loading = true;
    const url = `${BASE_URL}/forecast?lat=${WEATHER_CFG.lat}&lon=${WEATHER_CFG.lon}&units=${WEATHER_CFG.units}&appid=${WEATHER_CFG.apiKey}&cnt=4`;

    try {
      // const response = await execAsync(`curl -s "${url}"`);
      const response = await execAsync(
        `bash -c "cat /home/alexis/.cache/astal/forecast-weather.json"`,
      );
      this.forecast = JSON.parse(response).list;
    } catch (err) {
      console.error("OpenWeather: fetchForecast failed:", err);
    } finally {
      this.loading = false;
    }
  }
}
