
// ▀█▀ ▄▀█ █▀ █▄▀   █░░ █ █▀ ▀█▀
// ░█░ █▀█ ▄█ █░█   █▄▄ █ ▄█ ░█░

// A list of pending tasks within the currently selected tag/project.

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import TaskService from '../../../../services/task.js'

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = MS_PER_SECOND * 60
const MS_PER_HOUR = MS_PER_MINUTE * 60
const MS_PER_DAY = MS_PER_HOUR * 24
const MS_PER_MONTH = MS_PER_DAY * 30
const MS_PER_YEAR = MS_PER_DAY * 365
  

/**
 * @function toRelativeTime 
 * @brief Convert weird TaskWarrior string to relative time
 */
const toRelativeTime = (dueString, currentTime) => {
  currentTime = currentTime || Date.now().valueOf()

  const re = /(\d\d\d\d)(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z/.exec(dueString)
  const convert = `${re[1]}-${re[2]}-${re[3]}T${re[4]}:${re[5]}:${re[6]}Z`
  const converted = new Date(convert).valueOf()

  const elapsed = currentTime - converted
  const absElapsed = Math.abs(elapsed)

  let value = ''

  if (absElapsed < MS_PER_SECOND) {
    value = Math.round(absElapsed)
    value += (value == 1) ? ' ms' : ' ms'

  } else if (absElapsed < MS_PER_MINUTE) {
    value = Math.round(absElapsed/1000)
    value += (value == 1) ? ' second' : ' seconds'
  }

  else if (absElapsed < MS_PER_HOUR) {
    value = Math.round(absElapsed/MS_PER_MINUTE)
    value += (value == 1) ? ' minute' : ' minutes'
  }

  else if (absElapsed < MS_PER_DAY ) {
    value = Math.round(absElapsed/MS_PER_HOUR )
    value += (value == 1) ? ' hour' : ' hours'
  }

  else if (absElapsed < MS_PER_MONTH) {
    value = Math.round(absElapsed/MS_PER_DAY)
    value += (value == 1) ? ' day' : ' days'
  }

  else if (absElapsed < MS_PER_YEAR) {
    value = Math.round(absElapsed/MS_PER_MONTH)
    value += (value == 1) ? ' month' : ' months'
  }

  else {
    value = Math.round(absElapsed/MS_PER_YEAR)
    value += (value == 1) ? ' year' : ' years'
  }

  if (elapsed > 0) {
    return `${value} ago`
  } else {
    return `in ${value}`
  }
}

/**
 * Create a single task entry button.
 */
const CreateTaskEntry = (data) => {

  const task = Widget.Box({
    spacing: 4,
    hexpand: true,
    classNames: [
      data.urgency > 6 ? 'urgent' : '',
      data.start ? 'started' : '',
    ],
    children: [
      Widget.Label({
        className: 'active-indicator',
        label: TaskService.bind('activeTask').as(task => `${task.uuid === data.uuid ? 'ꞏ' : ''}`),
      }),
      Widget.Label({
        className: 'description',
        hexpand: true,
        hpack: 'start',
        label: data.description,
      }),
      Widget.Label({
        className: 'due',
        hexpand: true,
        hpack: 'end',
        label: data.due ? toRelativeTime(data.due) : 'no due date',
      })
    ]
  })

  return Widget.Button({
    className: 'item',
    hexpand: true,
    child: task,
    attribute: data,

    setup: (self) => {
      self.connect("focus", () => {
        TaskService.active_task = self.attribute
      })
    }
  })
}

const placeholder = Widget.Label({
  class_name: 'placeholder-text',
  label: 'No tasks found.'
})

const TaskBox = Widget.Box({
  className: 'tasklist',
  hexpand: true,
  vexpand: true,
  vertical: true,
  spacing: 8,
  attribute: { hasPlaceholder: true },
  children: TaskService.bind('tasks-in-active-tag-project').as(x => x.map(CreateTaskEntry))
})

export default () => {
  return TaskBox
}
