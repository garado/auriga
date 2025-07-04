
// █░█ ▄▀█ █▄▄ █ ▀█▀ █ █▀▀ █▄█
// █▀█ █▀█ █▄█ █ ░█░ █ █▀░ ░█░

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import HabitifyService from '../../services/habitify.js'

/**
 * Create a habit widget.
 */
const Habit = (habit) => {
  // log(JSON.stringify(habit))

  const HabitName = Widget.Label({
    label: habit.name
  })

  return Widget.Box({
    children: [
      HabitName,
    ]
  })
}

const HabitContainer = Widget.Box({
  vertical: true,
  children: HabitifyService.bind('data').as(x => x.map(Habit)),
})

export default () => Widget.Box({
  spacing: 2,
  className: 'habit',
  hexpand: true,
  vexpand: true,
  vpack: 'center',
  vertical: true,
  children: [
    HabitContainer,
  ]
})
