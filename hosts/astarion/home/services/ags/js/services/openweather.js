
// █▀█ █▀█ █▀▀ █▄░█ █░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█
// █▄█ █▀▀ ██▄ █░▀█ ▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄

import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../userconfig.js'

const key = UserConfig.openweather.apiKey
const lat = UserConfig.openweather.latitude
const lon = UserConfig.openweather.longitude
const units = UserConfig.openweather.units

class OpenweatherService extends Service {
  static {
    Service.register (
      this,
      { // Signals
        'current-weather-changed': ['jsobject'],
        'hourly-forecast-changed': ['jsobject'],
      },
      { // Properties
      },
    )
  }

  // Private variables
  #currentWeather = []
  #hourlyForecast = []

  constructor() {
    super()
    this.#initCurrentWeather()
    this.#initHourlyForecast()
  }

  #initCurrentWeather() {
    const cmd = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=${units}`
    Utils.execAsync(['curl', cmd])
      .then(out => {
        this.#currentWeather = JSON.parse(out)
        this.emit('current-weather-changed', this.#currentWeather)
      })
      .catch(err => print('OpenWeatherService: Failed to fetch current weather'))
  }
  
  #initHourlyForecast() {
    const cmd = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}`
    Utils.execAsync(['curl', cmd])
      .then(out => {
        // print(out)
        // this.emit('yearly-balances-changed', this.#yearlyBalances)
      })
      .catch(err => print('OpenWeatherService: Failed to fetch hourly forecast'))
  }
}

const service = new OpenweatherService

export default service
