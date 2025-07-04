
/* █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░ */
/* █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄ */

/* Right-side popout panel including a fetch, system settings,
 * and a few quick actions */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../userconfig.js'
import Variable from 'resource:///com/github/Aylur/ags/variable.js'

import SysInfo from './_sysinfo.js'
import QuickActions from './quickActions/main.js'
import QuickSettings from './quickSettings/main.js'

log('program', 'Entering control.js')

/*********************************
 * WINDOW SETUP
 *********************************/

const Separator = () => Widget.Separator({
  className: 'separator',
  vertical: false,
  hexpand: false,
  halign: 'center',
})

const Control = () => Widget.Box({
  className: 'control',
  vertical: true,
  vexpand: true,
  spacing: 12,
  children: [
    SysInfo(),
    Separator(),
    QuickActions(),
    QuickSettings(),
  ]
})

const revealerState = Variable(false)

export default () => Widget.Window({
  name: 'control',
  attribute: revealerState,
  exclusivity: 'normal',
  layer: 'top',
  visible: 'false',
  anchor: ['top', 'bottom', 'right'],
  keymode: 'on-demand',
  child: Widget.Box({
    classNames: ['control-wrapper', 'dropshadow-left'],
    css: 'padding: 1px',
    child: Widget.Revealer({
      revealChild: revealerState.bind(),
      transitionDuration: 250,
      transition: 'slide_left',
      child: Control(),
    })
  })
})
