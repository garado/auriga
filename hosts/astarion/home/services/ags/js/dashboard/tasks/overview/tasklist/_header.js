
// ▀█▀ ▄▀█ █▀ █▄▀   █░█ █▀▀ ▄▀█ █▀▄ █▀▀ █▀█
// ░█░ █▀█ ▄█ █░█   █▀█ ██▄ █▀█ █▄▀ ██▄ █▀▄

// Displays the currently selected tag/project as well as the project
// completion percentage.

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import TaskService from '../../../../services/task.js'

const TagHeader = Widget.Label({
  className: 'tag',
  hpack: 'start',
  label: TaskService.bind('active_tag')
})

const ProjectSubheader = Widget.Label({
  className: 'project',
  hpack: 'start',
  label: TaskService.bind('active_project')
})

const Left = Widget.Box({
  hpack: 'start',
  vertical: true,
  children: [
    TagHeader,
    ProjectSubheader,
  ],
})

const Right = Widget.Label({
  className: 'percentage',
  label: '0%',
  hexpand: true,
  hpack: 'end',
})

export default () => Widget.Box({
  className: 'tasklist-header',
  hexpand: true,
  vertical: false,
  spacing: 12,
  children: [
    Left,
    Right,
  ]
})
