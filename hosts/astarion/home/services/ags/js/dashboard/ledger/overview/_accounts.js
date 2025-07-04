
/* ▄▀█ █▀▀ █▀▀ █▀█ █░█ █▄░█ ▀█▀ █▀ */
/* █▀█ █▄▄ █▄▄ █▄█ █▄█ █░▀█ ░█░ ▄█ */

/* Shows balances for the accounts defined in user config. */
/* Also shows net worth and monthly income/expenses. */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import LedgerService from '../../../services/ledger/ledger.js/'

/**
 * Constructor for a single account widget.
 */
const Account = (data) => {
  const name = Widget.Label({
    className: 'account-name',
    hpack: 'start',
    label: data.displayName,
  })

  /* data.total can be either a number or a bind */
  let label = '0'
  if (typeof(data.total) == 'object') {
    label = data.total
  } else {
    label = String(data.total.toFixed(2))
  }
  
  const amount = Widget.Label({
    className: 'balance',
    hpack: 'start',
    label: label,
  })
  
  return Widget.Box({
    className: 'account',
    vertical: true,
    hexpand: false,
    hpack: 'start',
    vpack: 'center',
    children: [
      amount,
      name,
    ]
  })
}

/**
 * Total net worth.
 */
const NetWorth = () => Widget.Box({
  children: [
    Account({
      displayName: 'Net Worth',
      total: LedgerService.bind('net-worth').as(x => `${x}`) || 0
    })
  ]
})

/**
 * Total income for the current month. 
 */
const Income = () => Widget.Box({
  className: 'income',
  children: [
    Account({
      displayName: 'Income this month',
      total: LedgerService.bind('income-this-month').as(x => `${x}`) || 0.00,
    })
  ],
})

/**
 * Total expenses for the current month.
 */
const Expenses = () => Widget.Box({
  className: 'expenses',
  children: [
    Account({
      displayName: 'Expenses this month',
      total: LedgerService.bind('expenses-this-month').as(x => `${x}`) || 0.00,
    })
  ],
})

/**
 * Container for all accounts defined in UserConfig.
 */
const UserDefinedAccounts = () => Widget.Box({
  vertical: true,
  spacing: 20,
  children: LedgerService.bind('display-accounts').as(x => x.map(Account)),
})

export default () => {
  return Widget.Box({
    className: 'accounts',
    spacing: 20,
    vertical: true,
    children: [
      NetWorth(),
      Income(),
      Expenses(),
      UserDefinedAccounts(),
    ]
  })
}
