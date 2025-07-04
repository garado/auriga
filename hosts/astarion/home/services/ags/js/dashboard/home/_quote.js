
// █▀█ █░█ █▀█ ▀█▀ █▀▀
// ▀▀█ █▄█ █▄█ ░█░ ██▄

import Variable from 'resource:///com/github/Aylur/ags/variable.js'
import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import DashService from '../service.js'
import UserConfig from '../../../userconfig.js'

const QUOTE_INDEX = 0
const AUTHOR_INDEX = 1
const quotes = UserConfig.quotes

const currentQuote = Variable(quotes[Math.floor(Math.random() * quotes.length)])

// Change quote every time the dashboard is closed
DashService.connect('dash-state-changed', (_, visible) => {
  if (visible == undefined) return
  if (!visible) {
    currentQuote.value = quotes[Math.floor(Math.random() * quotes.length)]
  }
})


const quote = Widget.Label({
  className: 'quote-text',
  wrap: true,
  justification: 'center',
  maxWidthChars: 24,
  label: currentQuote.bind().as(value => value[QUOTE_INDEX]),
})

const author = Widget.Label({
  className: 'author',
  justification: 'center',
  label: currentQuote.bind().as(value => value[AUTHOR_INDEX]),
})

export default () => Widget.Box({
  className: 'quote',
  spacing: 6,
  vertical: true,
  hexpand: true,
  children: [
    quote,
    author,
  ]
})
