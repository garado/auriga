
/* █▀█ █░█ █ █▀▀ █▄▀   █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ █▀ */
/* ▀▀█ █▄█ █ █▄▄ █░█   ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ ▄█ */

import Bluetooth from './_bluetooth.js'
import Network from './_network.js'
import Audio from './_audio.js'
import Theme from './_theme.js'
import PowerProfiles from './_powerProfiles.js'

/* Implement exclusivity (like PyQt group boxes) - only one 
 * quick setting should be open at a time */
const globalRevealerState = Variable(false)

const widgetList = [
  Theme(globalRevealerState),
  Network(globalRevealerState),
  Bluetooth(globalRevealerState),
  // Audio(globalRevealerState),
  PowerProfiles(globalRevealerState),
]

/* a little buggy */
globalRevealerState.connect('changed', (wasOpened) => {
  if (wasOpened.value) {
    widgetList.forEach(w => {
      w.revealerState.value = false
    })
  }
})

export default () => {
  return Widget.Box({
    className: 'quick-settings',
    vertical: true,
    spacing: 10,
    children: widgetList,
  })
}
