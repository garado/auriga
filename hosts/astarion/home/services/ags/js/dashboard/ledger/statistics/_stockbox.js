
/* █▀ ▀█▀ █▀█ █▀▀ █▄▀ █▄▄ █▀█ ▀▄▀ */
/* ▄█ ░█░ █▄█ █▄▄ █░█ █▄█ █▄█ █░█ */

/* Display stock information for all currently held stocks */

import LedgerService from '../../../services/ledger/ledger.js'

const StockBox = (commodityData) => {
  const name  = Object.keys(commodityData)[0]
  const value = commodityData[name]

  /* Ticker symbol + fund name */
  const Identifiers = Widget.Box({
    vertical: true,
    children: [
      Widget.Label({
        className: 'ticker-symbol',
        label: name,
        hpack: 'start',
        xalign: 0,
      }),
      Widget.Label({
        className: 'fund-name',
        label: 'Fund name',
        hpack: 'start',
        xalign: 0,
      }),
    ]
  })

  /* Total value held + percentage change over last 3 months */
  const Statistics = Widget.Box({
    className: 'stock-stats',
    vertical: true,
    halign: 'center',
    children: [
      Widget.Label({
        className: 'value-held',
        hpack: 'end',
        label: `${value}`,
      }),
      Widget.Box({
        vertical: false,
        hpack: 'end',
        className: 'percent-change',
        children: [
          Widget.Icon('caret-up-symbolic'),
          Widget.Label({
            hpack: 'end',
            label: '2.4%',
          }),
        ]
      })
    ]
  })

  return Widget.CenterBox({
    className: 'stockbox',
    hexpand: true,
    vertical: false,
    startWidget: Identifiers,
    endWidget: Statistics,
  })
}

export default () => Widget.Box({
  className: 'stockbox-container',
  hexpand: false,
  vexpand: true,
  vertical: true,
  children: LedgerService.bind('commodities').as(x => x.map(StockBox))
})
