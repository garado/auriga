
/* █▀█ █▀█ █░█░█ █▀▀ █▀█   █▀█ █▀█ █▀█ █▀▀ █ █░░ █▀▀ █▀ */
/* █▀▀ █▄█ ▀▄▀▄▀ ██▄ █▀▄   █▀▀ █▀▄ █▄█ █▀░ █ █▄▄ ██▄ ▄█ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../../userconfig.js'

import QuickSettingsTemplate from './_template.js'

const pwr = await Service.import('powerprofiles')

const Profile = (profile) => {
  return Widget.Label({
    label: profile.Profile,
    xalign: 0,
  })
}

export default (globalRevealerState) => QuickSettingsTemplate({
  icon: 'battery-charging-symbolic',
  subWidget: Widget.Label('hi'),
  label: pwr.bind('active-profile'),
  children: pwr.bind('profiles').as(x => x.map(Profile)),
  globalRevealerState: globalRevealerState,
})
