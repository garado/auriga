
// █░█ ▄▀█ █▄▄ █ ▀█▀ █ █▀▀ █▄█
// █▀█ █▀█ █▄█ █ ░█░ █ █▀░ ░█░

/**
 * Read Habitify API for more information
 * https://docs.habitify.me/
 */

import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../userconfig.js'

const API_KEY = UserConfig.habitify.api

class HabitifyService extends Service {
  static {
    Service.register(
      this,
      { // Signals
        'ready': [],
      },
      { // Properties
        'data': ['r'],
      },
    )
  }
  
  /***********************
   * PRIVATE VARIABLES
   ***********************/

  #data = []
  #habitNames = []
  #habitsFetched = 0

  get data() {
    return this.#data
  }

  /***********************
   * PRIVATE FUNCTIONS
   ***********************/

  constructor() {
    super()
    this.#initData()
  }

  #initData() {
    // const cmd = `curl "https://api.habitify.me/habits" -H "Authorization: ${API_KEY}"`
    // Utils.execAsync(`bash -c '${cmd}'`)
    //   .then(out => {
    //     out = JSON.parse(out)
    //     this.#data = out.data
    //     this.#habitNames = this.#data.map(x => x.name)
    //     this.#data.map(x => this.#fetchHabitDetails(x.id))
    //   })
    //   .catch(err => log)
  }

  #fetchHabitDetails(id) {
    const cmd = `curl "https://api.habitify.me/habits/${id}" -H "Authorization: ${API_KEY}"`
    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        // print(out)
      })
      .catch(err => log(err))
  }
}

const service = new HabitifyService

export default service
