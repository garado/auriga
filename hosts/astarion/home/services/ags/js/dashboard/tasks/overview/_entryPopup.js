
// ▀█▀ ▄▀█ █▀ █▄▀   █▀▄▀█ █▀█ █▀▄   █▀█ █▀█ █▀█ █░█ █▀█
// ░█░ █▀█ ▄█ █░█   █░▀░█ █▄█ █▄▀   █▀▀ █▄█ █▀▀ █▄█ █▀▀

// Popup for modifying existing tasks and adding new tasks.
// this code is god awful right now

import TaskService from '../../../services/task.js'
import DashService from '../../service.js'

import Gdk from "gi://Gdk";
import App from 'resource:///com/github/Aylur/ags/app.js'

/**
 * Fancy little text entry box widget.
 */
const EntryBox = ({ header = 'Header', ...rest}) => {
  const Header = Widget.Label({
    className: 'header',
    label: header,
    useMarkup: true,
  })

  const Entry = Widget.Entry({
    className: 'entry',
    ...rest,
  })

  return Widget.Fixed({
    className: 'entry-box',
    vexpand: true,
    attribute: Entry,
    setup(self) {
      self.put(Entry, 0, 0)
      self.put(Header, 10, -8)
    }
  })
}

/**
 * Header for the popup box
 */
const PopupHeader = Widget.Box({
  className: 'header',
  vertical: false,
  valign: 'start',
  spacing: 4,
  children: [
    Widget.Icon({
      icon: 'check-square-symbolic'
    }),
    Widget.Label({
      label: TaskService.bind('popup-mode').as(value => {
        if (value == 'add') {
          return 'Add task'
        } else if (value == 'modify') {
          return 'Modify task'
        }
      })
    })
  ]
})

/**
 * Set up binds for the popup text
 * (I feel like there is a much better way to do this :|)
 */
const DescBind = Utils.merge(
  [TaskService.bind('active-task'), TaskService.bind('popup-mode')],
  (t, mode) => {
    return mode == 'add' ? '' : t.description || ''
  })

const DueBind = Utils.merge(
  [TaskService.bind('active-task'), TaskService.bind('popup-mode')],
  (t, mode) => {
    return mode == 'add' ? '' : t.due || ''
  })

const TagBind = Utils.merge(
  [
    TaskService.bind('active-task'),
    TaskService.bind('active-tag'),
    TaskService.bind('popup-mode')
  ],
  (t, activeTag, mode) => {
    if (mode == 'add') {
      return activeTag || ''
    } else if (mode == 'modify') {
      if (t.tags) {
        return t.tags[0] || ''
      } else {
        return ''
      }
    }
  })

const ProjBind = Utils.merge(
  [
    TaskService.bind('active-task'), 
    TaskService.bind('active-project'),
    TaskService.bind('popup-mode')
  ],
  (t, activeProject, mode) => {
    return (mode == 'add' ? activeProject : t.project) || ''
  })

const Description = EntryBox({
  header: 'Description',
  text: DescBind,
})

const Due = EntryBox({
  header: 'Due',
  text: DueBind,
})

const Tag = EntryBox({
  header: 'Tag',
  text: TagBind,
})

const Project = EntryBox({
  header: 'Project',
  text: ProjBind,
})

const ConfirmButton = Widget.Button({
  className: 'confirm',
  child: Widget.Label('Confirm'),
  onClicked: () => {
    const newTaskData = TaskService.active_task
    newTaskData.description = Description.attribute.get_text()
    newTaskData.due = Due.attribute.get_text()
    newTaskData.tags = [Tag.attribute.get_text()]
    newTaskData.project = Project.attribute.get_text()

    if (newTaskData.description == '' || 
        newTaskData.tags[0] == '' || 
        newTaskData.project == '') {

      // TODO Better way of indicating errors
      log('TaskPopup: A tag and a project are required')
      return
    } else {
      TaskService.execute(newTaskData)
      App.closeWindow('dash-taskmod')

      // Clear entry
      Description.attribute.set_text('')
      Due.attribute.set_text('')
      Tag.attribute.set_text('')
      Project.attribute.set_text('')
    }
  }
})

const EntryPopup = Widget.Window({
  name: 'dash-taskmod',
  keymode: 'exclusive',
  visible: false,
  child: Widget.Box({
    className: 'dash-task-mod',
    hexpand: true,
    vexpand: true,
    hpack: 'center',
    vpack: 'center',
    spacing: 20,
    vertical: true,
    visible: false,
    children: [
      PopupHeader,
      Description,
      Due,
      Tag,
      Project,
      ConfirmButton,
    ]
  })
})

// Close on pressing ESC
EntryPopup.on("key-press-event", (self, event) => {
  const key = (event.get_keyval()[1])
  if (key == Gdk.KEY_Escape) {
    App.closeWindow('dash-taskmod')
  }
})

// Close on closing dashboard
EntryPopup.hook(App, (self, windowName, visible) => {
  if (windowName == 'dashboard' && !visible) {
    App.closeWindow('dash-taskmod')
  }
}, 'window-toggled')

export default () => { return EntryPopup }
