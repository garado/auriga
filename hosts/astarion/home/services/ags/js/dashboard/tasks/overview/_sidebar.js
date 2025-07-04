
// █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
// ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import TaskService from '../../../services/task.js'

/***************************************
 * COMMON
/***************************************/

const Header = (text) => Widget.Label({
  className: 'sidebar-header',
  hpack: 'start',
  label: text
})

const Placeholder = (text) => Widget.Label({
  className: 'placeholder-text',
  hpack: 'start',
  label: text,
})

/***************************************
 * TAGS
 ***************************************/

/**
 * @brief Create a tag entry.
 */
const CreateTagEntry = (tag) => {
  return Widget.Button({
    hpack: 'start',
    attribute: { tag: tag },
    hexpand: true,
    child: Widget.Box({
      vertical: false,
      spacing: 10,
      children: [
        Widget.Label({
          className: 'active-indicator',
          label: TaskService.bind('activeTag').as(a => `${a === tag ? 'ꞏ' : ''}`),
        }),
        Widget.Label(tag),
      ]
    }),
    onClicked: self => { TaskService.active_tag = self.attribute.tag }
  })
}

const TagList = Widget.Box({
  vertical: true,
  children: TaskService.bind('tags').as(x => x.map(CreateTagEntry))
})

/***************************************
 * PROJECTS
/***************************************/

const CreateProjectEntry = (project) => {
  return Widget.Button({
    hpack: 'start',
    hexpand: true,
    attribute: { tag: '', project: project },
    child: Widget.Box({
      vertical: false,
      spacing: 10,
      children: [
        Widget.Label({
          className: 'active-indicator',
          label: TaskService.bind('activeProject').as(p => `${p === project ? 'ꞏ' : ''}`),
        }),
        Widget.Label(project),
      ]
    }),
    onClicked: self => { TaskService.active_project = self.attribute.project }
  })
}

const ProjectList = Widget.Box({
  vertical: true,
  vexpand: true,
  children: TaskService.bind('projectsInActiveTag').as(x => x.map(CreateProjectEntry))
})

/*************************************************/

export default () => Widget.Box({
  className: 'task-sidebar',
  vertical: true,
  hexpand: false,
  vexpand: true,
  homogeneous: false,
  spacing: 30,
  attribute: {
    taglist: TagList,
    projectlist: ProjectList,
  },
  children: [
    Widget.Box({
      spacing: 10,
      vertical: true,
      children: [
        Header('Tags'),
        TagList,
      ]
    }),
    Widget.Box({
      spacing: 10,
      vertical: true,
      children: [
        Header('Projects'),
        ProjectList,
      ],
    }),
  ]
})
