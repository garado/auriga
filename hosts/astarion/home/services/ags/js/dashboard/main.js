
// █▀▄ ▄▀█ █▀ █░█ █▄▄ █▀█ ▄▀█ █▀█ █▀▄
// █▄▀ █▀█ ▄█ █▀█ █▄█ █▄█ █▀█ █▀▄ █▄▀

/**********************************************
 * Imports
 **********************************************/

import App from 'resource:///com/github/Aylur/ags/app.js'
import Widget from 'resource:///com/github/Aylur/ags/widget.js'

import DashService from './service.js'
import UserConfig from '../../userconfig.js'

import HomeTab from './home/home.js'
import LedgerTab from './ledger/ledger.js'
import CalendarTab from './calendar/calendar.js'
import TasksTab from './tasks/tasks.js'
import GoalsTab from './goals/goals.js'
import LifeTab from './life/life.js'

log('program', 'Entering dashboard.js')

/**********************************************
 * Module-level data
 **********************************************/

let lastTabIndex = 0

const revealerState = Variable(false)

const rawTabData = [
  {
    content: HomeTab,
    icon: 'house-symbolic',
    name: 'Home',
  },
  {
    content: CalendarTab,
    icon: 'calendar-symbolic',
    name: 'Calendar',
  },
  {
    content: LedgerTab,
    icon: 'currency-dollar-symbolic',
    name: 'Ledger',
  },
  {
    content: TasksTab,
    icon: 'check-square-symbolic',
    name: 'Tasks',
  },
  {
    content: GoalsTab,
    icon: 'target-symbolic',
    name: 'Goals',
  },
  {
    content: LifeTab,
    icon: 'watch-symbolic',
    name: 'Life',
  },
]

/* Only display the tabs shown in UserConfig */
let tabData = []
UserConfig.tabs.forEach(tab => tabData.push(rawTabData[rawTabData.findIndex(e => e.name.toLowerCase() == tab)]))

/* So we don't run unnecessary stuff at init */
tabData.forEach(tab => tab.content = tab.content())

DashService.numTabs = tabData.length

/* Set up binds for each tab */
/* @TODO Eventually phase out `obj.attribute.keys` in favor of `obj.keys` */
for (let i = 0; i < tabData.length; i++) {
  if (tabData[i].keys) {
    DashService.addTabBinds(i, tabData[i].content.keys)
  } else if (tabData[i].content.attribute && tabData[i].content.attribute.keys) {
    DashService.addTabBinds(i, tabData[i].content.attribute.keys)
  }
}

/**********************************************
 * Widgets
 **********************************************/

const TabStack = Widget.Stack({
  className: 'tab-container',
  transition_type: 'crossfade',
  transition: 'crossfade',
  setup: self => {
    log('dash', 'Creating TabStack') 

    const contentKeyValue = {}
    tabData.forEach(t => {
      contentKeyValue[t.name] = t.content
    })

    self.children = contentKeyValue
  }
})

const CreateTabBarEntry = tabIndex => {
  return Widget.EventBox({
    attribute: tabIndex,
        
    child: Widget.Icon({
      hpack: 'center',
      vpack: 'center',
      icon: tabData[tabIndex].icon,
      className: 'tab-bar-entry'
    }),

    on_primary_click: function() {
      DashService.active_tab_index = tabIndex
    },

    // BUG: Why does passing an argument not work?
    setup: self => {
      log('dash', `Creating TabBarEntry (tab ${tabIndex})`)

      self.hook(DashService, () => {
        if (DashService.active_tab_index === undefined) return
        self.toggleClassName('active', self.attribute == DashService.active_tab_index)
      }, 'active-tab-index-changed')
    }
  })
}

const tabDataLength = Array.from({ length: tabData.length }, (_, i) => i)

const TabBar = Widget.CenterBox({
  className: 'tab-bar',
  vexpand: true,
  vpack: 'center',
  vertical: true,
  centerWidget: Widget.Box({
    vertical: true,
    children: tabDataLength.map(thisTabIndex => CreateTabBarEntry(thisTabIndex))
  }),
  setup: self => { log('dash', 'Creating TabBar') }
})

DashService.connect('active_tab_index_changed', (self, value) => {
  log('dash', `Change tab to ${value}`)

  /* Adjust animation based on new tab position relative to curr tab position */
  if (lastTabIndex < value) {
    // TabStack.transition = 'slide_right'
  } else {
    // TabStack.transition = 'slide_left'
  }

  TabStack.shown = tabData[value].name
  lastTabIndex = value
})

export default () => Widget.Window({
  name: 'dashboard',
  className: 'dashboard',
  exclusivity: 'normal',
  attribute: revealerState,
  layer: 'top',
  visible: 'false',
  keymode: 'exclusive',
  child: Widget.Box({
    css: 'padding: 1px',
    child: Widget.Revealer({
      revealChild: revealerState.bind(),
      transitionDuration: 200,
      transition: 'slide_down',
      child: Widget.Box({
        className: 'dropshadow',
        children: [
          TabBar,
          TabStack,
        ]
      }),
    })
  }),
  setup: self => { log('dash', 'Creating dashboard window') }
})
  .on("key-press-event", DashService.handleKey)
  .hook(App, (self, windowName, visible) => {
    if (windowName == self.name) {
      DashService.dash_state = visible
    }
  }, 'window-toggled')
