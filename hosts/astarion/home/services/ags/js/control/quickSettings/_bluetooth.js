
/* █▄▄ █░░ █░█ █▀▀ ▀█▀ █▀█ █▀█ ▀█▀ █░█ */
/* █▄█ █▄▄ █▄█ ██▄ ░█░ █▄█ █▄█ ░█░ █▀█ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'

import QuickSettingsTemplate from './_template.js'

const bt = await Service.import('bluetooth')

const DeviceButton = (device) => {
  return Widget.Label({
    label: device.description
  })
}

export default (globalRevealerState) => QuickSettingsTemplate({
  icon: 'bluetooth-symbolic',
  subWidget: DeviceButton,
  label: bt.bind('connected_devices').as(dev => dev > 0 ? dev[0].description : 'Not connected'),
  children: bt.bind('devices').as(x => x.map(DeviceButton)),
  globalRevealerState: globalRevealerState,
})
