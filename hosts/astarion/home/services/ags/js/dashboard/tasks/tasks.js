
// ▀█▀ ▄▀█ █▀ █▄▀ █░█░█ ▄▀█ █▀█ █▀█ █ █▀█ █▀█
// ░█░ █▀█ ▄█ █░█ ▀▄▀▄▀ █▀█ █▀▄ █▀▄ █ █▄█ █▀▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import DashTabLayout from '../../common/dashTabLayout.js'

import TaskService from '../../services/task.js'

import Overview from './overview/overview.js'

export default() => Widget.Box({
  className: 'tasks',
  spacing: 12,
  attribute: {
    keys: Overview.attribute.keys,
  },
  children: [
    DashTabLayout({
      name: 'Tasks and things',
      pages: [ Overview ],
    })
  ]
})
