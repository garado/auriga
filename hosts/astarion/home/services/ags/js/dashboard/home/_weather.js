
// █░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█
// ▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄

import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import OpenweatherService from '../../../services/openweather.js'

// Current weather ----------------------------------------

const currentWeatherText = Widget.Label({
  label: 'Feels like - in - with -'
})

// Daily high/low temp ------------------------------------

const tempLabel = (type = 'H') => Widget.Label({
  class_name: 'hi-lo-label',
  label: type,
})

const tempValue = (temp = '70') => Widget.Label({
  class_name: 'hi-lo-value',
  label: temp,
})

const tempHigh = Widget.Box(
  {
    vertical: false,
  },
  tempLabel('H'),
  tempValue('70'),
)

const tempLow = Widget.Box(
  {
    vertical: false,
  },
  tempLabel('L'),
  tempValue('30'),
)

const dailyMinMaxTemps = Widget.Box(
  {
    vertical: false,
    spacing: 5,
  },
  tempHigh,
  tempLow,
)

// Current weather top box --------------------------------

const currentWeatherBox = Widget.CenterBox({
  vertical: false,
  hexpand: true,
  vexpand: true,
  hpack: 'center',
  vpack: 'center',
  spacing: 20,
  start_widget: currentWeatherText,
  end_widget: dailyMinMaxTemps,
  setup: self => self.hook(OpenweatherService, (self, currentData) => {
    if (currentData == undefined) return;

    // print(JSON.stringify(currentData))

    const city = currentData.name
    const temp_now = Math.round(currentData.main.feels_like)
    const temp_min = currentData.main.temp_min
    const temp_max = currentData.main.temp_max

    currentWeatherText.label = `Feels like ${temp_now} in ${city}`

  }, 'current-weather-changed'),
})

export default () => Widget.Box({
  class_name: 'weather',
  children: [
    currentWeatherBox,
  ],
})
