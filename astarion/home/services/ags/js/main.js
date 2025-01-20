
// █▀▄▀█ ▄▀█ █ █▄░█
// █░▀░█ █▀█ █ █░▀█

import Bar from './bar.js'
import Dashboard from './dashboard/dashboard.js'
import Control from './control/main.js'
import Kitty from './kitty.js'
import NotRofi from './notrofi/notrofi.js'
import DashTaskMod from './dashboard/tasks/overview/_entryPopup.js'
import { Notifications } from './notifications.js'

log('program', 'Entering main.js')

const windows = [
  'dashboard',
  'control',
  'notrofi',
  'kitty',
  'dash-taskmod',
]

App.config({
  style: '/tmp/ags/style.css',
  windows: [
    Bar(0),
    Control(),
    Dashboard(),
    NotRofi(),
    Notifications(),
    Kitty(),
    DashTaskMod(),
  ],

  // When opening a window, close all the other ones 
  onWindowToggled: function(windowName, visible) {
    log('program', `${windowName} toggled: now ${visible ? 'opened' : 'closed'}`)

    /* Trigger revealers */
    const window = App.getWindow(windowName)
    if (window.attribute) {
      window.attribute.value = visible
    }

    /* When opening non-popovers windows, all other windows should close */

    if (windowName == 'dash-taskmod') return

    if (visible) {
      const windowsToClose = windows.filter(x => x != windowName );
      windowsToClose.map((w) => { App.closeWindow(w) }) 
    }
  },

  /* Add delay to allow closing animation to run */
  closeWindowDelay: {
    'dashboard':  500,
    'control':    500,
    'notrofi':    500,
  }
})
