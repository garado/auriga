
// █░░ █ █▀▀ █▀▀   █▀▀ ▄▀█ █░░ █▀▀ █▄░█ █▀▄ ▄▀█ █▀█
// █▄▄ █ █▀░ ██▄   █▄▄ █▀█ █▄▄ ██▄ █░▀█ █▄▀ █▀█ █▀▄

import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../userconfig.js'

const SECONDS_PER_WEEK = 60 * 60 * 24 * 7

const DOB_MS = new Date('2000-04-12').valueOf()
const TODAY_MS = new Date().valueOf()

const SECONDS_SINCE_BIRTH = (TODAY_MS - DOB_MS) / 1000
const WEEKS_SINCE_BIRTH = Math.floor(SECONDS_SINCE_BIRTH / SECONDS_PER_WEEK)

class LifeService extends Service {
  static {
    Service.register(
      this,
      { // Signals
        'ready': [],
      },
      { // Properties
        'property': ['rw'],
      },
    )
  }

  // Private variables
  notableDates = {}
  #file = '/home/alexis/Enchiridion/self/notable-dates.md'

  constructor() {
    super()

    // Utils.monitorFile(this.#file, (file, event) => {
    //   this.#initData()
    // })

    this.#initData()
  }

  #initData() {
    const dateRe = /(\d\d\d\d-\d\d-\d\d): (.*)/
    this.notableDates = {}
    
    Utils.readFileAsync(this.#file)
      .then(out => {
        const lines = out.split('\n')

        lines.forEach(line => {
          const expr = dateRe.exec(line)
          if (expr == null) return
        
          const date = expr[1]
          const event = expr[2]
          if (date == null || event == null) return
        
          const week = Math.floor(((new Date(date).valueOf() - DOB_MS) / 1000) / SECONDS_PER_WEEK)
          this.notableDates[week] = event
        })

        this.emit('ready')
      })
      .catch(logError)
  }
}

const service = new LifeService

export default service
