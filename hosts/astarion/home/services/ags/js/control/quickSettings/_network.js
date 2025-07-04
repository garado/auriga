
/* █▄░█ █▀▀ ▀█▀ █░█░█ █▀█ █▀█ █▄▀ */
/* █░▀█ ██▄ ░█░ ▀▄▀▄▀ █▄█ █▀▄ █░█ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import QuickSettingsTemplate from './_template.js'

const nw = await Service.import('network')

const NetworkButton = (network) => {
  if (network.strength < 40 || network.ssid == 'Unknown') return

  return Widget.CenterBox({
    className: 'network',
    hexpand: true,
    vertical: false,
    startWidget: Widget.Box({
      vertical: false,
      spacing: 8,
      children: [
        Widget.Icon({
          icon: network.active ? 'check-symbolic' : '',
        }),
        Widget.Label({
          label: network.ssidi,
          xalign: 0,
        }),
      ],
    }),
    endWidget: Widget.Icon({
      hpack: 'end',
      icon: [
        [101, 'wifi-high-symbolic'],
        [60,  'wifi-medium-symbolic'],
        [50,  'wifi-low-symbolic'],
      ].find(([threshold]) => threshold <= network.strength)?.[1] || 'wifi-low-symbolic'
    }),
  })
}

export default (globalRevealerState) => QuickSettingsTemplate({
  icon: 'wifi-high-symbolic',
  subWidget: NetworkButton,
  label: nw.wifi.bind('ssid').as(ssid => ssid || 'Not connected'),
  children: nw.wifi.bind('access_points').as(x => x.map(NetworkButton)),
  globalRevealerState: globalRevealerState,
})
