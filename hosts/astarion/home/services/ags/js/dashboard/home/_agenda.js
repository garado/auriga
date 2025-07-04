
// ▄▀█ █▀▀ █▀▀ █▄░█ █▀▄ ▄▀█
// █▀█ █▄█ ██▄ █░▀█ █▄▀ █▀█

import CalService from '../../services/gcalcli.js'

/**
 * A widget showing an event happening on a particular day.
 */
const DayEvent = (event) => {
  return Widget.CenterBox({
    className: 'day-event',
    hexpand: true,
    startWidget: Widget.Label({
      hpack: 'start',
      truncate: 'end',
      xalign: 0,
      hexpand: false,
      className: 'event-title',
      label: event.description,
    }),
    endWidget: Widget.Label({
      hpack: 'end',
      className: 'event-time',
      label: `${event.startTime} - ${event.endTime}`
    }),
  })
}

/**
 * A widget showing a task due on a particular day.
 */
const DayTask = () => {
  return Widget.Box({
    className: 'day-task',
    hexpand: true,
    children: [
      Widget.Label({
        className: 'task-title',
        label: 'Rewrite Cozy in ags'
      }),
    ]
  })
}

/**
 * Widget showing an overview for a particular day, including all
 * events and tasks due on that day.
 */
const Day = (dateStr) => {
  if (dateStr < CalService.today) return
  if (CalService.viewdata[dateStr].length == 0) return

  const dayHeader = Widget.Box({
    className: 'day-header',
    hexpand: true,
    children: [
      Widget.Label({
        classNames: [
          'date',
          CalService.today == dateStr ? 'today' : '',
        ],
        label: `${dateStr}`,
      }),
    ]
  })

  const dayEvents = Widget.Box({
    vertical: true,
    spacing: 8,
    setup: self => {
      for (let i = 0; i < CalService.viewdata[dateStr].length; i++) {
        self.add(DayEvent(CalService.viewdata[dateStr][i]))
      }
    }
  })

  return Widget.Box({
    vertical: true,
    spacing: 8,
    children: [
      dayHeader,
      dayEvents,
    ],
  })
}

export default() => Widget.Box({
  className: 'agenda',
  vexpand: true,
  vertical: true,
  spacing: 22,
  children: CalService.bind('viewrange').as(x => x.map(Day))
})
