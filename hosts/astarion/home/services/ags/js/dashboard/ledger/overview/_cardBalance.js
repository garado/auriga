
// █▀▀ ▄▀█ █▀█ █▀▄   █▄▄ ▄▀█ █░░ ▄▀█ █▄░█ █▀▀ █▀▀
// █▄▄ █▀█ █▀▄ █▄▀   █▄█ █▀█ █▄▄ █▀█ █░▀█ █▄▄ ██▄

// View credit card balances.

import LedgerService from '../../../services/ledger/ledger.js/'

const createBalanceWidget = (data) => {
  return Widget.Box({
    vertical: true,
    spacing: 10,
    children: [
      Widget.Label({
        hpack: 'start',
        label: data.account.replace('Liabilities:Credit:', '')
      }),
      Widget.Label({
        hpack: 'start',
        className: 'amount',
        label: data.amount,
      })
    ],
  })
}

export default () => Widget.Box({
  className: 'card-balance',
  vexpand: true,
  hexpand: true,

  setup: self => self.hook(LedgerService, (self, balanceData) => {
    if (balanceData === undefined) return;
    self.children.forEach(x => self.remove(x))
    balanceData.forEach(x => self.add(createBalanceWidget(x)))
  }, 'card-balances-changed'),
})
