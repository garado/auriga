
/* ▄▀█ █▀▀ █▀▀ █▀█ █░█ █▄░█ ▀█▀ █▀ */
/* █▀█ █▄▄ █▄▄ █▄█ █▄█ █░▀█ ░█░ ▄█ */

/* Shows balances for the accounts defined in user config. */
/* Also shows net worth and monthly income/expenses. */

import { App, Astal, Gtk, Gdk, Widget } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import Ledger, { DisplayAccountProps } from '../../../../services/Ledger.ts'

const ledger = Ledger.get_default()

/**
 * Constructor for a single account widget.
 */
const Account = (data: DisplayAccountProps) => {
  const name = Widget.Label({
    cssClasses: ['account-name'],
    halign: Gtk.Align.START,
    label: data.displayName,
  })

  let label = 0
  if (data.total instanceof Object) {
    label = data.total.as(x => `${x}`)
  } else {
    label = String(data.total.toFixed(2))
  }

  const amount = Widget.Label({
    cssClasses: ['balance'],
    halign: Gtk.Align.START,
    label: label
  })

  return Widget.Box({
    cssClasses: ['account'],
    vertical: true,
    hexpand: false,
    halign: Gtk.Align.START,
    vpack: 'center',
    children: [
      amount,
      name,
    ]
  })
}

const UserDefinedAccounts = () => Widget.Box({
  orientation: 1,
  halign: Gtk.Align.START,
  children: bind(ledger, 'displayAccounts').as(x => x.map(Account)),
})

export const Accounts = () => {
  return Widget.Box({
    cssClasses: ['accounts'],
    orientation: 1,
    halign: Gtk.Align.START,
    children: [
      Account({
        displayName: 'Net Worth',
        total: bind(ledger, 'netWorth')
      }),
      Account({
        displayName: 'Income',
        total: bind(ledger, 'incomeThisMonth'),
      }),
      Account({
        displayName: 'Expenses',
        total: bind(ledger, 'expensesThisMonth'),
      }),
      UserDefinedAccounts(),
    ]
  })
}
