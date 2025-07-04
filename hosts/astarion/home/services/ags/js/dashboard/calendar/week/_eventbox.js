
// █▀▀ █░█ █▀▀ █▄░█ ▀█▀ █▄▄ █▀█ ▀▄▀
// ██▄ ▀▄▀ ██▄ █░▀█ ░█░ █▄█ █▄█ █░█

import Gtk from 'gi://Gtk'
import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import CalService from '../../../services/gcalcli.js'

import UserConfig from '../../../../userconfig.js'

/**
 * Create a single event box.
 */
export default (event) => {
  const title = Widget.Label({
    className: 'title',
    hpack: 'start',
    wrap: true,
    xalign: 0,
    label: event.description,
  })

  const times = Widget.Label({
    className: 'times',
    hpack: 'start',
    wrap: true,
    xalign: 0,
    label: `${event.startTime} - ${event.endTime}`
  })

  const location = Widget.Label({
    className: 'location',
    hpack: 'start',
    label: event.location,
    wrap: true,
    xalign: 0,
  })

  // Adjust color based on which calendar
  let bgcolor = ''
  if (UserConfig.calendar.colors[event.calendar]) {
    bgcolor = UserConfig.calendar.colors[event.calendar]
  }

  // Making a responsive widget...
  const isVertical = (event.endFH - event.startFH) > 0.75

  const ebox = Widget.Box({
    vertical: isVertical,
    vexpand: false,
    className: 'eventbox',
    canFocus: true,
    widthRequest: CalService.DAY_WIDTH_PX,
    heightRequest: ((event.endFH - event.startFH) * CalService.HOUR_HEIGHT_PX),
    css: `${bgcolor != '' ? `background-color: ${bgcolor}`: ''}`,
    children: [
      title,
      (event.endFH - event.startFH) > 0.75 ? times : null,
      (event.endFH - event.startFH) > 0.75 ? location : null,
    ]
  })

  return ebox

  // TODO make clicking it trigger a popup
  // widget.eventbox not working for some reason
  // return Widget.EventBox({
  //   // cursor: 'pointer', // TODO: install cursor theme :|
  //   className: 'eventbox-container',
  //   child: ebox,
  //   visible: true,
  //   onPrimaryClick: () => { print('asf') }
  // })
}
