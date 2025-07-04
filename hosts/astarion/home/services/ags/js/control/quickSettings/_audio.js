
/* ▄▀█ █░█ █▀▄ █ █▀█ */
/* █▀█ █▄█ █▄▀ █ █▄█ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../../userconfig.js'

import QuickSettingsTemplate from './_template.js'

const audio = await Service.import('audio')

const AudioButton = (audio) => {
  return Widget.Label({
    label: audio.description,
    maxWidthChars: 28,
    truncate: 'end',
    wrap: false,
    xalign: 0,
  })
}

export default (globalRevealerState) => QuickSettingsTemplate({
  icon: 'speaker-simple-high-symbolic',
  label: audio.bind('speaker').as(speaker => speaker.description),
  children: audio.bind('speakers').as(x => x.map(AudioButton)),
  globalRevealerState: globalRevealerState,
})
