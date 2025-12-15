/**
 * █░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█
 * ▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄
 *
 * Yeah a weather widget.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import OpenWeather, { ForecastItem } from "@/services/weather";
import { epochToHHMM } from "@/utils/Time";
import { bind } from "astal";
import { Gtk, Widget } from "astal/gtk4";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let weather: InstanceType<typeof OpenWeather> | undefined = undefined;

const CSS_CLASSES = {
  CONTAINER: "weather",
  OVERVIEW: "location",
  OVERVIEW_TEXT: "text",
  OVERVIEW_ICON: "icon",

  HI_LO: "hi-lo",
  HI_LO_TEXT: "text",
  HI_LO_TEMP: "temperature",

  FORECAST: "forecast",
  FORECAST_ITEM: "item",
  FORECAST_ITEM_ICON: "icon",
  FORECAST_ITEM_TEMP: "temperature",
  FORECAST_ITEM_TIME: "time",

  CURRENT_WEATHER: "current-weather",
  CURRENT_WEATHER_TEMP: "temperature",
  CURRENT_WEATHER_DESC: "description",
};

const WEATHER_ICON = {
  Clouds: "cloud-symbolic",
  Clear: "sun-symbolic",
  Atmosphere: "cloud-fog-symbolic",
  Snow: "snowflake-symbolic",
  Rain: "cloud-rain-symbolic",
  Drizzle: "drop-symbolic",
  Thunderstorm: "lightning-symbolic",
};

/*****************************************************************************
 *
 *****************************************************************************/

const Overview = () =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.OVERVIEW],
    spacing: 8,
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.OVERVIEW_TEXT],
        wrap: true,
        label: bind(weather!, "current").as(
          (cw) =>
            `${Math.round(cw?.main.temp || 0)}° and ${cw?.main.humidity}% humidity in ${cw?.name} with ${cw?.weather[0].description}`,
        ),
      }),
    ],
  });

const HiLo = () => {
  const Hi = Widget.Box({
    spacing: 1,
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.HI_LO_TEXT],
        label: "H",
      }),
      Widget.Label({
        cssClasses: [CSS_CLASSES.HI_LO_TEMP],
        label: bind(weather!, "current").as(
          (cw) => `${Math.round(cw?.main.temp_max || 0)}°`,
        ),
      }),
    ],
  });

  const Lo = Widget.Box({
    spacing: 1,
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.HI_LO_TEXT],
        label: "L",
      }),
      Widget.Label({
        cssClasses: [CSS_CLASSES.HI_LO_TEMP],
        label: bind(weather!, "current").as(
          (cw) => `${Math.round(cw?.main.temp_min || 0)}°`,
        ),
      }),
    ],
  });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.HI_LO],
    spacing: 8,
    children: [Hi, Lo],
  });
};

const Forecast = () => {
  const HourlyForecast = (item: ForecastItem) =>
    Widget.Box({
      cssClasses: [CSS_CLASSES.FORECAST_ITEM],
      vertical: true,
      children: [
        Widget.Image({
          cssClasses: [CSS_CLASSES.FORECAST_ITEM_ICON],
          iconName: WEATHER_ICON[item.weather[0].main] ?? "cloud-symbolic",
        }),
        Widget.Label({
          cssClasses: [CSS_CLASSES.FORECAST_ITEM_TEMP],
          label: `${Math.round(item.main.temp)}°`,
        }),
        Widget.Label({
          cssClasses: [CSS_CLASSES.FORECAST_ITEM_TIME],
          label: epochToHHMM(item.dt * 1000),
        }),
      ],
    });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.FORECAST],
    spacing: 8,
    vertical: false,
    homogeneous: true,
    children: bind(weather!, "forecast").as((forecasts) =>
      forecasts?.map(HourlyForecast),
    ),
  });
};

/*****************************************************************************
 *
 *****************************************************************************/

export const Weather = () => {
  weather = OpenWeather.get_default();

  return Widget.Box({
    cssClasses: [CSS_CLASSES.CONTAINER],
    vertical: true,
    spacing: 12,
    children: [
      Widget.CenterBox({
        orientation: Gtk.Orientation.HORIZONTAL,
        startWidget: Overview(),
        endWidget: HiLo(),
      }),
      Forecast(),
    ],
  });
};
