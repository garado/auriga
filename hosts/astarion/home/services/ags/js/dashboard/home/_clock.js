
// █▀▀ █░░ █▀█ █▀▀ █▄▀
// █▄▄ █▄▄ █▄█ █▄▄ █░█

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

const time = Variable('', {
  poll: [1000, "date '+%H:%M'"],
})

const date = Variable('', {
  poll: [1000, "date '+%A %d %B %Y'"],
})

export default () => Widget.Box({
  class_name: 'clock',
  spacing: 6,
  vertical: true,
  children: [
    Widget.Label({
      class_name: 'time',
      label: time.bind()
    }),
    Widget.Label({
      class_name: 'date',
      label: date.bind()
    }),
  ]
})
