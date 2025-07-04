
// █▀█ █▀█ █▀█ █▀▀ █ █░░ █▀▀
// █▀▀ █▀▄ █▄█ █▀░ █ █▄▄ ██▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import UserConfig from '../../../userconfig.js'

import DashService from '../service.js'

const USERNAME = UserConfig.profile.name
const PFP = UserConfig.profile.pfp
const SPLASH_OPTS = UserConfig.profile.splashText

const Username = Widget.Label({
  className: 'username',
  label: USERNAME,
})

const Picture = Widget.Box({
  className: 'pfp',
  hexpand: false,
  vexpand: false,
  css: `background-image: url("${PFP}")`
})

const FakeBar = Widget.CircularProgress({
  className: 'pfp-circle-border',
  rounded: false,
  value: 1,
  child: Widget.Box({
    hpack: 'center',
    vpack: 'center',
    children: [ Picture ]
  }),
})

const Splash = Widget.Label({
  className: 'splash',
  label: SPLASH_OPTS[Math.floor(Math.random() * SPLASH_OPTS.length)],

  // Change the splash text every time the dashboard is opened
  setup: self => self.hook(DashService, (self, visible) => {
    if (visible == undefined) return
    if (!visible) {
      self.label = SPLASH_OPTS[Math.floor(Math.random() * SPLASH_OPTS.length)]
    }
  }, 'dash-state-changed'),
})

export default () => Widget.Box({
  spacing: 2,
  className: 'profile',
  hexpand: true,
  vexpand: true,
  vpack: 'center',
  vertical: true,
  children: [
    FakeBar,
    Username,
    Splash,
  ]
})
