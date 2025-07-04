
// █▀▀ ▄▀█ █░░ █▀▀ █▄░█ █▀▄ ▄▀█ █▀█
// █▄▄ █▀█ █▄▄ ██▄ █░▀█ █▄▀ █▀█ █▀▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import DashTabLayout from '../../common/dashTabLayout.js'
import Week from './week/week.js'
import Schedule from './schedule/schedule.js'
import CalService from '../../services/gcalcli.js'

const layout = DashTabLayout({
  name: 'Apr - May 2024',
  actions: [
    {
      name: 'Refresh',
      onPrimaryClick: () => {
        CalService.requestRefresh()
      }
    },
    {
      name: '<',
      onPrimaryClick: () => {
        CalService.viewrangeRequestIter(-1)
      },
    },
    {
      name: '>',
      onPrimaryClick: () => { 
        CalService.viewrangeRequestIter(1)
      },
    },
    {
      name: 'Today',
      onPrimaryClick: () => {
        CalService.viewrangeRequestSet()
      }
    },
  ],
  pages: [
    Week(),
    Schedule(),
  ]
})

/**
 * When the viewrange is changed, update the header.
 */
layout.hook(CalService, (self, viewrange, viewdata) => {
  if (viewrange == undefined) return

  const first = new Date(viewrange[0])
  const last = new Date(viewrange[viewrange.length - 1])

  const firstMonth = CalService.MONTH_NAMES[first.getUTCMonth()]
  const lastMonth = CalService.MONTH_NAMES[last.getUTCMonth()]

  if (firstMonth == lastMonth) {
    layout.attribute.setHeader(`${firstMonth} ${last.getFullYear()}`)
  } else {
    layout.attribute.setHeader(`${firstMonth} - ${lastMonth} ${last.getFullYear()}`)
  }
}, 'viewrange-changed')

/**
 * Keybind setup
 */
const keys = {
  'h': () =>  { CalService.viewrangeRequestIter(-1) },
  'l': () =>  { CalService.viewrangeRequestIter(1) },
  'r': () =>  { CalService.requestRefresh() },
  'tt': () => { CalService.viewrangeRequestSet() },
  'j': () =>  { CalService.emit('weekview-scroll', 1) },
  'k': () =>  { CalService.emit('weekview-scroll', -1) },
  'gg': () => { CalService.emit('weekview-jump', 1) },
  'GG': () => { CalService.emit('weekview-jump', -1) },

  'H': () =>  { layout.iterTab(-1) },
  'L': () =>  { layout.iterTab(1) },
}

export default () => Widget.Box({
  className: 'calendar',
  attribute: {
    keys: keys,
  },
  spacing: 12,
  children: [layout],
})
