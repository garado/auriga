
// █▀█ █░█ █▀▀ █▀█ █░█ █ █▀▀ █░█░█
// █▄█ ▀▄▀ ██▄ █▀▄ ▀▄▀ █ ██▄ ▀▄▀▄▀

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

import GoalService from '../../services/goals.js'
import DashService from '../service.js'

import Categories from './_categories.js'
import Sidebar from './_sidebar.js'
import Gdk from "gi://Gdk";

/****************************************************
 * FILTERS
 ****************************************************/

const FILTER_GROUP_SPACING = 8 // px

/**
 * Widget used to filter goals by certain fields.
 * Note: use 'button-press-event' instead of 'onToggled' to update UI settings, 
 * because the former runs only when clicked, while the latter runs when clicked AND
 * when the btn state is set externally (e.g. through filter keybinds). The latter would
 * cause the callback to run multiple times.
 */
const FilterButton = (text, propertyName) => Widget.ToggleButton({
  child: Widget.Label(text),
  active: GoalService.bind('ui-settings').as(x => x[propertyName]),
  className: GoalService.bind('ui-settings').as(x => x[propertyName] ? 'toggled' : ''),
  setup: self => {
    self.set_can_focus(false) /* disable keyboard navigation */

    self.connect('button-press-event', (self) => {
      GoalService.set_settings({ [propertyName]: !(self.className == 'toggled') })
    })
  }
})

/**
 * Filter goals based on status (completed/pending/failed)
 */
const StatusFilter = Widget.Box({
  spacing: FILTER_GROUP_SPACING,
  vertical: false,
  children: [
    FilterButton('Completed', 'completed'),
    FilterButton('In progress', 'pending'),
    FilterButton('Failed', 'failed'),
  ],
})

/**
 * Filter goals based on development status
 * developed -> all fields are filled (namely due date, the reason 'why')
 */
const DevelopmentFilter = Widget.Box({
  spacing: FILTER_GROUP_SPACING,
  vertical: false,
  children: [
    FilterButton('Developed', 'developed'),
    FilterButton('In development', 'undeveloped'),
  ],
})

/**
 * Container for the above StatusFilter and DevelopmentFilter widgets
 */
const Filters = Widget.Box({
  className: 'filters',
  vertical: false,
  spacing: 12,
  hpack: 'end',
  children: [
    StatusFilter,
    Widget.Label('and'),
    DevelopmentFilter,
  ]
})

/**
 * Bar above main content
 */
const TopBar = Widget.CenterBox({
  startWidget: Widget.Label({
    className: 'header',
    hpack: 'start',
    label: 'Goals',
  }),
  endWidget: Filters,
})

/**
 * Main content
 */
const categories = Categories()

const MainWidget = Widget.Box({
  className: 'main',
  child: Widget.Box({
    vertical: true,
    spacing: 12,
    children: [
      TopBar,
      Widget.Scrollable({
        hscroll: 'never',
        vscroll: 'always',
        vexpand: true,
        overlayScrolling: false,
        child: Widget.Box({
          vertical: true,
          children: [
            categories,
          ],
        })
      })
    ],
  }),
})



/**
 * Animates the sidebar
 */
const SidebarReveal = Widget.Revealer({
  transitionDuration: 250,
  transition: 'slide_left',
  revealChild: false,
  hexpand: false,
  child: Sidebar,
})

/* Hide the sidebar when switching dashboard tabs */
SidebarReveal.hook(DashService, (self, tabIndex) => {
  if (tabIndex == undefined) return
  self.revealChild = false
  MainWidget.css = 'opacity: 1; transition: 0.1s all'
  GoalService.resetSidebarData()
}, 'active-tab-index-changed')

/* Toggle the sidebar on the 'request-sidebar' signal */
SidebarReveal.hook(GoalService, (self, state) => {
  if (state == undefined) return
  self.revealChild = state
  MainWidget.css = `opacity: ${state ? '0.8' : '1'}; transition: 0.2s all`
}, 'request-sidebar')

/**
 * Assemble the final UI
 * Note to self: 
 * If you want to put a revealer in an overlay,
 * you have to put the revealer in a box, and put the box in the overlay
 * otherwise it won't animate
 */
const Overview = Widget.Box({
  className: 'overview',
  vertical: true,
  children: [
    Widget.Overlay({
      child: MainWidget,
      passThrough: true,
      overlays: [
        Widget.Box({
          hpack: 'end',
          hexpand: false,
          children: [SidebarReveal]
        }),
      ],
    })
  ]
})

/****************************************************
 * KEYBINDS
 ****************************************************/

const keys = {
  'Esc': () => {
    GoalService.requestSidebar(false) 
    GoalService.resetSidebarData()
  },

  'r': () => {
    GoalService.fetchGoals()
  },

  /* Copy uuid (shortened) of currently selected node to clipboard
   * This is handled within the GoalBox widget - easier that way
   * But listed here for visibility */
  /* 'y': () => { }, */

  'gg': () => { categories.attribute.focusFirst() },

  'G': () => { categories.attribute.focusLast() },

  /* Navigation */
  'Tab': () => { categories.attribute.focusCategory(1) },
  
  'ShiftTab': () => { categories.attribute.focusCategory(-1) },
  
  'j': () => { categories.attribute.focusCategory(1) },
  
  'k': () => { categories.attribute.focusCategory(-1) },

  'h': () => {
    if (GoalService.sidebar_breadcrumbs.length > 0) {
      GoalService.followBreadcrumbs(-1)
    } else {
      categories.attribute.focusNext(-1)
    }
  },

  'l': () => {
    if (GoalService.sidebar_breadcrumbs.length > 0) {
      GoalService.followBreadcrumbs(1)
    } else {
      categories.attribute.focusNext(1)
    }
  },
  
  /* Toggle filters */
  'c': () => { GoalService.set_settings({ completed: !GoalService.ui_settings.completed }) },
  
  'i': () => { GoalService.set_settings({ pending: !GoalService.ui_settings.pending }) },
  
  'p': () => { GoalService.set_settings({ pending: !GoalService.ui_settings.pending }) },
  
  'f': () => { GoalService.set_settings({ failed: !GoalService.ui_settings.failed }) },
  
  'd': () => {
    if (!GoalService.ui_settings.developed && !GoalService.ui_settings.undeveloped) {
      GoalService.set_settings({ developed: true, undeveloped: false })
    }
    else if (GoalService.ui_settings.developed && !GoalService.ui_settings.undeveloped) {
      GoalService.set_settings({ developed: false, undeveloped: true })
    }
    else if (!GoalService.ui_settings.developed && GoalService.ui_settings.undeveloped) {
      GoalService.set_settings({ developed: true, undeveloped: true })
    }
    else if (GoalService.ui_settings.developed && GoalService.ui_settings.undeveloped) {
      GoalService.set_settings({ developed: true, undeveloped: false })
    }
  }
}

/****************************************************
 * EXPORT
 ****************************************************/

export default () => Widget.Box({
  className: 'goals',
  spacing: 12,
  attribute: {
    keys: keys
  },
  children: [
    Overview
  ]
})
