
// █▀▀ █ ▀█▀ █░█ █░█ █▄▄   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █ █▄▄ █▀
// █▄█ █ ░█░ █▀█ █▄█ █▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █ █▄█ ▄█

import Variable from 'resource:///com/github/Aylur/ags/variable.js'
import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import Gtk from 'gi://Gtk?version=3.0'

import UserConfig from '../../../userconfig.js'

const contribData = Variable()
const contribCount = Variable(0)
const username = UserConfig.github.username

const MAX_CONTRIB_BOXES = 180
const NUM_ROWS = 7
const SQUARE_WIDTH = 10
const SQUARE_SPACING = 6


const url = '/tmp/ags/github/2025-02-08'
Utils.execAsync(['cat', url])
  .then(x => {
    const out = JSON.parse(x)

    // API returns data for the entire year including days 
    // in the future, so remove the last (365 - day of year)
    // entries.
    const daysLeftInYear = 365 - Number(Utils.exec("date +%j"))
    contribData.value = out.contributions.slice(daysLeftInYear)

    // Count total contribs
    let _contribCount = 0
    out.years.forEach(y => _contribCount += y.total );
    contribCount.value = _contribCount
  })
  .catch(err => print(err))

// Create one contrib square
const ContribBox = (intensity = 0) => Widget.DrawingArea({
  class_name: `intensity-${intensity}`,
  hpack: 'center',
  vpack: 'center',
  setup: (self) => {
    const styles = self.get_style_context();
    const fg = styles.get_background_color(Gtk.StateFlags.NORMAL);

    // Size
    const w = SQUARE_WIDTH
    self.set_size_request(SQUARE_WIDTH, SQUARE_WIDTH)

    self.connect('draw', (_, cr) => {
      cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha)
      cr.rectangle(0, 0, SQUARE_WIDTH, SQUARE_WIDTH)
      cr.fill()
    })
  }
})

let stopFuckingDrawingTwice = false

// Squares representing contrib amount
// TODO: Hide when not
const Grid = Widget.subclass(Gtk.Grid)
const contribGrid = Grid({
  hexpand: true,
  vexpand: false,
  hpack: 'center',
  vpack: 'center',
  visible: false,
  rowSpacing: SQUARE_SPACING,
  columnSpacing: SQUARE_SPACING,
  className: 'contrib-container',
  setup: self => self.hook(contribData, (self) => {
    if (!stopFuckingDrawingTwice) {
      stopFuckingDrawingTwice = true
      return
    }

    for (let i = 0; i < NUM_ROWS; i++) {
      self.insert_row(i)
    }

    const numCols = Math.ceil(MAX_CONTRIB_BOXES / NUM_ROWS)
    for (let i = 0; i < numCols; i++) {
      self.insert_column(i)
    }

    const span = 1

    for (let i = 0; i < MAX_CONTRIB_BOXES; i++) {
      const intensity = contribData.value[i].intensity;
      self.attach(ContribBox(intensity), Math.floor(i / NUM_ROWS), (i % NUM_ROWS), span, span)
    }

    self.show_all()
  }),
})

const totalContribs = Widget.Label({
  class_name: 'header',
  label: contribCount.bind().as(value => value.toString())
})

export default () => Widget.Box({
  class_name: 'github',
  hexpand: true,
  vertical: true,
  spacing: 2,
  children: [
    totalContribs,
    Widget.Label({
      class_name: 'subheader',
      label: 'total lifetime contributions',
    }),
    contribGrid,
  ]
})
