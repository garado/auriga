
// █▀ ▀█▀ ▄▀█ ▀█▀ █ █▀ ▀█▀ █ █▀▀ █▀
// ▄█ ░█░ █▀█ ░█░ █ ▄█ ░█░ █ █▄▄ ▄█

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import LedgerService from '../../../services/ledger/ledger.js/'

import StockBox from './_stockbox.js'

export default () => Widget.Box({
  name: 'Spending',
  vertical: false,
  spacing: 12,
  className: 'statistics',
  children: [
    StockBox(),
  ]
})
