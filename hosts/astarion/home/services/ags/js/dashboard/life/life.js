
// █░░ █ █▀▀ █▀▀   █▀▀ ▄▀█ █░░ █▀▀ █▄░█ █▀▄ ▄▀█ █▀█
// █▄▄ █ █▀░ ██▄   █▄▄ █▀█ █▄▄ ██▄ █░▀█ █▄▀ █▀█ █▀▄

/*******************************************
 * Imports
 *******************************************/

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

import LifeService from '../../services/life.js'
import DashWidgetContainer from '../../widgets/dashWidgetContainer.js'
import Quote from './_quote.js'

/*******************************************
 * Module-level variables
 *******************************************/

const YEARS_LIVED = 80
const SQUARE_SIZE = 10
const SECONDS_PER_WEEK = 60 * 60 * 24 * 7

const DOB_MS = new Date('2000-04-12').valueOf()
const TODAY_MS = new Date().valueOf()

const SECONDS_SINCE_BIRTH = (TODAY_MS - DOB_MS) / 1000
const WEEKS_SINCE_BIRTH = Math.floor(SECONDS_SINCE_BIRTH / SECONDS_PER_WEEK)

let weeksAdded = 0

/*******************************************
 * Widget definitions
 *******************************************/

const TopLabel = () => Widget.Box({
  vertical: false,
  children: [
    Widget.Label({
      hexpand: true,
      label: '52 weeks',
    }),
  ]
})

/* A single square. */
const OneWeek = () => Widget.Box({
  classNames: [
    'one-week',
    weeksAdded < WEEKS_SINCE_BIRTH ? 'passed' : '',
    LifeService.notableDates[weeksAdded] ? 'notable' : '',
  ],
  children: [Widget.Box({
    vexpand: false,
    widthRequest:  SQUARE_SIZE,
    heightRequest: SQUARE_SIZE,
  })],
  setup: (self) => {
    if (LifeService.notableDates[weeksAdded]) {
      self.tooltipText = `Week ${weeksAdded}: ${LifeService.notableDates[weeksAdded]}`
    }
  }
})

/* A column of 26 squares. */
const OneYear = () => Widget.Box({
  className: 'one-year',
  spacing: 6,
  vertical: true,
  setup: (self) => {
    for (let i = 0; i < 52; i++) {
      self.add(OneWeek())
      weeksAdded++
    }
  }
})

const LifeSquares = () => Widget.Box({
  className: 'squares',
  vpack: 'center',
  hpack: 'center',
  spacing: 4,
  vertical: false,
  setup: self => self.hook(LifeService, (self) => {
    self.children.forEach(x => self.remove(x))

    for (let i = 0; i < YEARS_LIVED; i++) {
      if ((i % 5) == 0) {
        self.add(Widget.Separator({
          widthRequest: 10
        }))
      }

      self.add(OneYear())
    }
  }, 'ready')
})

export default () => Widget.Box({
  className: 'life',
  hpack: 'center',
  vexpand: false,
  vertical: true,
  hpack: 'center',
  vpack: 'center',
  children: [
    Quote(),
    LifeSquares(),
  ],
})

