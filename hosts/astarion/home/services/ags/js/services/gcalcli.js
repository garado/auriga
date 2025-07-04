
/* █▀▀ █▀▀ ▄▀█ █░░ █▀▀ █░░ █ */
/* █▄█ █▄▄ █▀█ █▄▄ █▄▄ █▄▄ █ */

/**
 * A service to interface with gcalcli. Also provides
 * helper functions and stores variables for the UI.
 *
 * This service is supporting:
 *  - Calendar tab week view
 *  - Calendar tab schedule view
 *  - Home tab agenda view
 *
 * Terminology:
 *  - viewrange
 *      - For calendar weekview, this is the range of viewable dates for 
 *        the current week (starting Sunday)
 *
 * Calendar week view program flow:
 *  - constructor
 *    - initWeekData: Init viewrange for the current week
 *      - setNewViewrange(str: date): Find all dates for the week which includes `date`
 *        - readCache(array: dates): Read all event data starting or ending on the given dates
 */

/*************************************************
 * IMPORTS
 *************************************************/

import UserConfig from '../../userconfig.js'

/*************************************************
 * MODULE-LEVEL CONSTANTS
 *************************************************/

const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]

const MS_PER_DAY = 1000 * 60 * 60 * 24

const TMPFILE = '/tmp/ags/gcalcli'

/**
 * The user's UTC offset.
 *
 * date +%z returns "-0700" for UTC-7, so there's extra math to
 * convert that string to a usable integer.
 */
const USER_UTC_OFFSET = Number(Utils.exec("date +%z")) / 100

/*************************************************
 * CUSTOM DATATYPES
 *************************************************/

/**
 * Specifies how data is ordered when parsing
 * lines from gcalcli.
 */
const DataFields = [
  'startDate',
  'startTime',
  'endDate',
  'endTime',
  'description',
  'location',
  'calendar',
]

/*************************************************
 * SERVICE DEFINITION
 *************************************************/

class GcalcliService extends Service {
  static {
    Service.register (
      this,
      { /* Signals --------------------- */
        'viewrange-changed': ['jsobject', 'jsobject'],

        'weekview-scroll':  ['int'],
        'weekview-jump':    ['int'],
      },

      { /* Properties --------------------- */
      },
    )
  }

  /******************************
   * PRIVATE VARIABLES
   ******************************/

  /* Array containing currently viewable dates (YYYY-MM-DD) in the calendar
   * week view */
  #viewrange = []

  /* Object (keys = date, values = events for that date) containing event data 
   * for currently viewable days in the calendar week view */
  #viewdata = {}

  /* Today's date as YYYY-MM-DD */
  #today = undefined

  /******************************
   * PUBLIC VARIABLES
   ******************************/

  RequestorType = {
    calTab: 'caltab',
    agenda: 'agenda',
  }

  /**
   * These are constants that the UI uses.
   * They are stored here to provide easy access for the UI, which is
   * distributed across multiple files.
   * TODO: Make these tied to rem instead of hardcoded pixel values
   */

  EVENTBOX_RIGHT_MARGIN = 10

  VIEWPORT_WIDTH_PX  = 1400
  VIEWPORT_HEIGHT_PX = 790
  
  HOURLABEL_OVERHANG_PX = 15
  HOURLABEL_WIDTH_PX = 66
  
  WIDGET_SPACING_PX = 7

  DATELABEL_HEIGHT_PX = 100
  
  DAY_WIDTH_PX = (this.VIEWPORT_WIDTH_PX / 7.0) - this.WIDGET_SPACING_PX
  
  HOUR_HEIGHT_PX = 66

  MULTIDAY_HEIGHT_PX = 40
  
  HOURS_VIEWABLE = this.VIEWPORT_HEIGHT_PX / this.HOUR_HEIGHT_PX
  
  MS_PER_HOUR = 60 * 60 * 1000
  MS_PER_DAY = this.MS_PER_HOUR * 24
  
  DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  /******************************
   * GETTERS AND SETTERS
   ******************************/
  
  get today() {
    return this.#today
  }

  get viewdata() {
    return this.#viewdata
  }
  
  get viewrange() {
    return this.#viewrange
  }

  /******************************
   * PUBLIC FUNCTIONS
   ******************************/

  /**
   * Move viewrange to the previous (dir == -1) or next (dir == 1) week.
   */
  viewrangeRequestIter(dir) {
    const newWeekStart = new Date(this.#viewrange[1])
    newWeekStart.setDate(newWeekStart.getDate() + (7 * dir))
    log('calService', `viewrangeRequestIter: Iter to ${newWeekStart}`)
    this.#setNewViewrange(newWeekStart)
  }

  /**
   * Reset viewrange to the current week.
   */
  viewrangeRequestSet() {
    this.#initWeekData()
  }

  /**
   * Request from the UI to update the cache.
   */
  requestRefresh() {
    this.#updateCache()
  }

  /**
   * Given a date object, return the DateString.
   * For this application, a DateString is the date in YYYY-MM-DD.
   */
  getDateStr(date) {
    /* Make sure toISOstring returns the local time instead of UTC time */
    date.setUTCHours(date.getUTCHours() + USER_UTC_OFFSET)
    return date.toISOString().split('T')[0]
  }

  /**
   * Given a certain date (YYYY-MM-DD), query all of the events.
   */
  queryEventsFromDate(dateStr) {
    if (this.#viewrange.include(dateStr)) {
      return this.#viewdata[dateStr]
    }

    const cmd = `grep -E '(${dateStr})' ${TMPFILE}`
    Utils.exec(`bash -c "${cmd}"`)
      .then(out => {
        this.#parseEventFromTSV(out)
      })
      .catch(err => {
        console.log('calService', `queryEventsFromDate: ${err}`)
      })
  }

  /******************************
   * PRIVATE FUNCTIONS
   ******************************/

  /**
   * Function to run on service initialization.
   */
  constructor() {
    log('calService', 'Constructing gcalcli service')
    super()
    this.#initWeekData()
  }

  /**
   * Initialize data for the service.
   */
  #initWeekData(d = new Date()) {
    log('calService', `#initWeekData: Called with d = ${d}`)
    this.#today = this.getDateStr(d)
    this.#setNewViewrange(this.#today)
  }

  /**
   * Given a start date YYYY-MM-DD, figure out the new viewrange and grab
   * data for the new viewrange.
   */
  #setNewViewrange(date) {
    log('calService', `#setNewViewrange: Starting ${date}`)

    this.#viewrange = []
    this.#viewdata = {}

    /* Initialize the timestamp to the Sunday of the given week */
    date = new Date(date)
    let ts = date.setDate(date.getUTCDate() - date.getUTCDay())
    log('calService', `#setNewViewrange: Timestamp is ${new Date(ts)}`)

    for (let i = 0; i < 7; i++) {
      const localDate = new Date(ts)
      const dateStr = this.getDateStr(localDate)
      this.#viewrange.push(dateStr)
      this.#viewdata[dateStr] = []
      ts += MS_PER_DAY
    }

    this.#readCache(this.#viewrange)
  }

  /**
   * Read cached data from cache and save to this.#viewdata for displaying
   * @param dates Array of strings (YYYY-MM-DD) which represent the dates to
   *              whose data to fetch from the cache.
   */
  #readCache(dates) {
    log('calService', `#readCache: ${dates}`)

    const cmd = `grep -E '(${dates.join('|')})' ${TMPFILE}`
    Utils.execAsync(`bash -c "${cmd}"`)
      .then(out => {this.#parseData(out)})
      .catch(err => {
        console.log('calService', `#readCache error: ${err}`)
      })
  }

  /**
   * Make Google Calendar API call and save data to cachefile.
   */
  #updateCache() {
    log('calService', 'Updating cache')
    const cmd = "gcalcli agenda '8 months ago' 'in 8 months' --details calendar --details location --military --tsv"
    Utils.execAsync(`bash -c "${cmd} | tee ${TMPFILE}"`)
      .then(this.#initWeekData)
      .catch(err => {
        if (err.includes('expired or revoked')) {
          console.log('Gcalcli: updateCache: Authentication expired!')
        } else {
          log('calService', `updateCache: ${err}`)
        }
      })
  }

  /**
   * Parse TSV data from cachefile.
   * @param out Raw TSV from cachefile.
   */
  #parseData(out) {
    log('calService', '#parseData: Parsing data')

    out.split('\n').forEach(eventLine => {
      const event = this.#parseEventFromTSV(eventLine)
      if (event.startedBeforeThisWeek) {
        this.#viewdata[event.endDate].push(event)
      } else {
        this.#viewdata[event.startDate].push(event)
      }
    })

    /* Sort events */
    for (let i = 0; i < this.#viewrange.length; i++) {
      const thisDateStr = this.#viewrange[i]
      this.#sortEvents(this.#viewdata[thisDateStr])
    }

    this.emit('viewrange-changed', this.#viewrange, this.#viewdata)
  }

  #sortEvents(events) {
    return events.sort(function(a, b) {
      if (a.startFH < b.startFH) return -1
      if (a.startFH > b.startFH) return 1
      if (a.endFH < b.endFH) return -1
      if (a.endFH > b.endFH) return 1
      return 0
    })
  }

  /**
   * Given a line of TSV from the cache file, return event data.
   */
  #parseEventFromTSV(line) {
    const rawData = line.trim().split('\t')
    const event = {}

    /* Populate event data with information parsed from TSV */
    for (let i = 0; i < rawData.length; i++) {
      event[DataFields[i]] = rawData[i]
    }

    event.multiDay = event.startDate != event.endDate
    event.allDay = event.startTime == '' && event.endTime == ''
    event.startedBeforeThisWeek = !this.#viewrange.includes(event.startDate)
    event.endsAfterThisWeek = !this.#viewrange.includes(event.endDate)

    if (event.multiDay || event.allDay) {
      return event
    }

    /* Get unix epoch timetamps */
    event.startTS = new Date(`${event.startDate} ${event.startTime}`).getTime()
    event.endTS = new Date(`${event.endDate} ${event.endTime}`).getTime()

    /* Get fractional hours. 5:30PM -> 17.5; 9:15AM -> 9.25 */
    const startRe = /(\d\d):(\d\d)/.exec(event.startTime)
    event.startFH = Number(startRe[1]) + (Number(startRe[2]) / 60)

    const endRe = /(\d\d):(\d\d)/.exec(event.endTime)
    event.endFH = Number(endRe[1]) + (Number(endRe[2]) / 60)

    return event
  }
}

const service = new GcalcliService

export default service
