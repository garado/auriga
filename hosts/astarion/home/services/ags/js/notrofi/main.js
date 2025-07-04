
/* █▄░█ █▀█ ▀█▀ █▀█ █▀█ █▀▀ █ */
/* █░▀█ █▄█ ░█░ █▀▄ █▄█ █▀░ █ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import App from 'resource:///com/github/Aylur/ags/app.js'
import Gdk from "gi://Gdk"
import Variable from 'resource:///com/github/Aylur/ags/variable.js'
import UserConfig from '../../userconfig.js'

const Hyprland = await Service.import('hyprland')
const { query } = await Service.import('applications')

log('program', 'Entering notrofi.js')

/****************************
 * MODULE-LEVEL VARIABLES
 ****************************/

const WINDOW_NAME = 'notrofi'

const currentTabIndex = Variable(0)
const revealerState = Variable(false)

let applications = query('')
let sessionButtons = []

let tabCount

/****************************
 * HELPER FUNCTIONS
 ****************************/

/**
 * Iterate through tabs
 * left: dir -1
 * right: dir 1
 */
const iterTab = (dir) => {
  let newIndex = (currentTabIndex.value + (1 * dir)) % (tabCount)
  if (newIndex < 0) newIndex = tabCount - 1
  currentTabIndex.value = newIndex
}


/****************************
 * TEXT ENTRY AND UI
 ****************************/

/**
 * The textbox where you type stuff
 */
const Entry = Widget.Entry({
  className: 'entry',
  hexpand: 'center',
  vpack: 'center',
  hpack: 'center',

  // Launch the first item on Entry
  onAccept: (self) => {
    if (currentTabIndex.value == 0 && applications[0]) {
      App.closeWindow(WINDOW_NAME)
      applications[0].launch()
      self.set_text('')
    }
  },
})

const TopPart = () => Widget.Box({
  className: 'top-part',
  vertical: false,
  children: [
    Widget.Box({
      spacing: 12,
      className: 'entry-container',
      vpack: 'center',
      hpack: 'center',
      children: [
        Widget.Icon('magnifying-glass-symbolic'),
        Entry,
      ]
    })
  ]
})

/****************************
 * APP LAUNCHER
 ****************************/

const AppEntry = (app) => Widget.Button({
  className: 'item',
  child: Widget.Box({
    children: [
      Widget.Label({
        className: 'title',
        label: app.name,
        hpack: 'start',
        vpack: 'center',
        truncate: 'end',
      }),
    ],
  }),
  onClicked: () => {
    App.closeWindow(WINDOW_NAME)
    Entry.set_text('')
    app.launch()
  },
  attribute: app,
})

const AppContent = Widget.Box({
  vertical: true,
  setup: self => self.hook(Entry, (self) => {
    applications = query(Entry.text)
    self.children = applications.map(AppEntry)
  }, 'changed')
})

const Applications = Widget.Scrollable({
  child: AppContent,
  heightRequest: 300,
})

/****************************
 * CLIENTS
 ****************************/

const ClientEntry = (client) => {
  const content = Widget.Box({
    className: 'client',
    spacing: 8,
    children: [
      Widget.Label({
        className: 'workspace-id',
        label: `${client.workspace.id}`,
      }),
      Widget.Label({
        className: 'title',
        truncate: 'end',
        label: `${client.initialTitle} (${client.title})`,
      }),
    ]
  })

  return Widget.Button({
    attribute: client,
    className: 'item',
    child: content,
    onClicked: (self) => {
      Hyprland.messageAsync(`dispatch focuswindow pid:${self.attribute.pid}`)
      App.closeWindow(WINDOW_NAME)
      Entry.set_text('')
    }
  })
}

const ClientContent = Widget.Box({
  vertical: true,
  children: Hyprland.bind('clients').as(c => c
    .toSorted((a, b) => a.workspace.id > b.workspace.id)
    .map(ClientEntry))
})

const Clients = Widget.Scrollable({
  heightRequest: 300,
  child: ClientContent,
})


/*********************************
 * TERMINAL SESSION LAUNCHER
 *********************************/

const SessionButton = (sessionName) => {
  const label = Widget.Label({
    label: sessionName,
    xalign: 0,
  })

  return Widget.Button({
    name: sessionName,
    hexpand: true,
    className: 'item',
    canFocus: true,
    child: label,
    onClicked: () => {
      App.closeWindow(WINDOW_NAME)
      Entry.set_text('')
      Utils.execAsync(`bash -c 'kitty --session ${UserConfig.kitty.sessions_path}/${sessionName} & disown'`)
    }
  })
}

const SessionContent = Widget.Box({
  vertical: true,
  setup: self => {
    /* Populate */
    const sessions = Utils.exec(`ls ${UserConfig.kitty.sessions_path}`).split('\n')
    self.children = sessions.map(SessionButton)

    /* Hook text entry */
    self.hook(Entry, (self) => {
      self.children.forEach(item => {
        item.visible = item.name.match(Entry.text ?? '')
      })
      sessionButtons = self.children
    }, 'changed')
  }
})

const Session = Widget.Scrollable({
  child: SessionContent,
  heightRequest: 300,
})


/****************************
 * TABS
 ****************************/

Applications.hook(currentTabIndex, (self) => {
  if (currentTabIndex.value == undefined) return
  self.visible = currentTabIndex.value == 0
}, 'changed')

Clients.hook(currentTabIndex, (self) => {
  if (currentTabIndex.value == undefined) return
  self.visible = currentTabIndex.value == 1
}, 'changed')

Session.hook(currentTabIndex, (self) => {
  if (currentTabIndex.value == undefined) return
  self.visible = currentTabIndex.value == 2
}, 'changed')

const Tabs = () => Widget.Box({
  className: 'tab-container',
  hexpand: true,
  vertical: false,
  spacing: 8,
  children: [
    Widget.Button({
      child: Widget.Icon({
        hexpand: true,
        icon: 'squares-four-symbolic',
      }),
      onClicked: () => { currentTabIndex.value = 0 },
      setup: self => self.hook(currentTabIndex, (self) => {
        self.className = currentTabIndex.value == 0 ? 'active' : ''
      }, 'changed')
    }),
    Widget.Button({
      child: Widget.Icon({
        hexpand: true,
        icon: 'cards-symbolic',
      }),
      onClicked: () => { currentTabIndex.value = 1 },
      setup: self => self.hook(currentTabIndex, (self) => {
        self.className = currentTabIndex.value == 1 ? 'active' : ''
      }, 'changed')
    }),
    Widget.Button({
      child: Widget.Icon({
        hexpand: true,
        icon: 'terminal-symbolic',
      }),
      onClicked: () => { currentTabIndex.value = 2 },
      setup: self => self.hook(currentTabIndex, (self) => {
        self.className = currentTabIndex.value == 2 ? 'active' : ''
      }, 'changed')
    }),
  ],
  setup: self => {
    tabCount = self.children.length
  }
})

/****************************
 * ASSEMBLE
 ****************************/

const BottomPart = Widget.Box({
  className: 'content',
  vertical: true,
  hexpand: true,
  children: [
    Applications,
    Clients,
    Session,
  ]
})

const NotRofi = Widget.Box({
  classNames: ['notrofi', 'dropshadow'],
  vertical: true,
  hexpand: true,
  children: [
    TopPart(),
    BottomPart,
    Tabs(),
  ]
})


// Extra keybinds
const handleKey = (self, event) => {
  const keyval = event.get_keyval()[1]

  switch (keyval) {
    case Gdk.KEY_Escape:
      App.closeWindow(WINDOW_NAME)
      Entry.emit('grab-focus')
      break
    case Gdk.KEY_J:
      NotRofi.emit('move-focus', 0)
      return true
    case Gdk.KEY_K:
      NotRofi.emit('move-focus', 1)
      return true
    case Gdk.KEY_H:
      iterTab(-1)
      return true
    case Gdk.KEY_L:
      iterTab(1)
      return true
    case Gdk.KEY_Tab:
      NotRofi.emit('move-focus', 0)
      return true
    case Gdk.KEY_ISO_Left_Tab:
      NotRofi.emit('move-focus', 1)
      return true
    case Gdk.KEY_1:
      currentTabIndex.value = 0
      return true
    case Gdk.KEY_2:
      currentTabIndex.value = 1
      return true
    case Gdk.KEY_3:
      currentTabIndex.value = 2
      return true
    case Gdk.KEY_4:
      currentTabIndex.value = 3
      return true
    default:
      if (    keyval != Gdk.KEY_Return 
          && keyval != Gdk.KEY_Shift_R 
          && keyval != Gdk.KEY_Shift_L 
          && !Entry.has_focus) {
        Entry.emit('grab-focus')
      }
      break
  }
}

export default () => Widget.Window({
  name: WINDOW_NAME,
  exclusivity: 'normal',
  layer: 'top',
  visible: 'false',
  attribute: revealerState,
  keymode: 'exclusive',
  child: Widget.Box({
    css: 'padding: 1px',
      child: Widget.Revealer({
        revealChild: revealerState.bind(),
        transitionDuration: 150,
        transition: 'slide_up',
        child: NotRofi,
      })
  })
}).on("key-press-event", handleKey)
