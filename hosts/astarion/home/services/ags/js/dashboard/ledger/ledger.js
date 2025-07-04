
/* █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█ */
/* █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import DashTabLayout from '../../common/dashTabLayout.js'

import Overview from './overview/main.js'
import Statistics from './statistics/statistics.js'
import Fire from './fire/fire.js'

export default () => {
  const layout = DashTabLayout({
    name: 'Ledger',
    pages: [
      Overview(),
      Statistics(),
      Fire(),
    ],
  })

  /* Keybinds setup */
  const keys = {
    'H': () =>  { layout.iterTab(-1) },
    'L': () =>  { layout.iterTab(1) },
  }

  return Widget.Box({
    className: 'ledger',
    spacing: 12,
    children: [
      layout
    ],
    attribute: {
      keys: keys,
    }
  })
}
