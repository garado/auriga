
/* █▀▄ █▀▀ █▄▄ ▀█▀ █▀   ▄▀█ █▄░█ █▀▄   █░░ █ ▄▀█ █▄▄ █ █░░ █ ▀█▀ █ █▀▀ █▀ */
/* █▄▀ ██▄ █▄█ ░█░ ▄█   █▀█ █░▀█ █▄▀   █▄▄ █ █▀█ █▄█ █ █▄▄ █ ░█░ █ ██▄ ▄█ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import LedgerService from '../../../services/ledger/ledger.js/'

/**
 * Create widget for a single account.
 */
const DebtWidget = (account) => {
  /* Array of objects representing uncleared transactions for this account. */
  const debtData = LedgerService.debtsLiabilities[account]

  const whoOwesYou = Widget.Label({
    className: 'debts-account',
    hpack: 'start',
    label: account,
  })
  
  /* Parse total amount owed */
  const amounts = debtData.map(txn => txn.total)
  let totalAmountOwed = 0
  amounts.forEach(n => totalAmountOwed += n);

  /* Text saying either "you owe" or "you're owed" */
  const oweText = Widget.Label({
    label: totalAmountOwed > 0 ? "you're owed" : 'you owe',
    className: totalAmountOwed > 0 ? 'owe-type greentext' : 'owe-type redtext',
  })
  
  const oweAmount = Widget.Label({
    hpack: 'end',
    className: totalAmountOwed > 0 ? 'debts-amount greentext' : 'debts-amount redtext',
    label: String(totalAmountOwed.toFixed(2))
  })

  /**
   * Create a widget for every transaction
   * (If someone owes you $52 for X and $56 for Y,
   * this will create 2 widgets: one for X, one for Y)
   */
  const txnWidgets = debtData.map(txn => {
    const desc = Widget.Label({
      className: 'desc',
      hpack: 'start',
      truncate: 'end',
      label: txn.desc,
    })
    
    const amount = Widget.Label({
      className: 'entry-amount',
      hpack: 'end',
      label: String(txn.total.toFixed(2)),
    })

    return Widget.CenterBox({
      className: 'transaction',
      hexpand: true,
      start_widget: desc,
      end_widget: amount,
    })
  })

  return Widget.Box({
    vertical: true,
    hexpand: true,
    spacing: 6,
    children: [
      Widget.CenterBox({
        className: 'entry-top',
        hexpand: true,
        hpack: 'end',
        end_widget: oweText,
      }),
      Widget.CenterBox({
        className: 'entry-top',
        hexpand: true,
        start_widget: whoOwesYou,
        end_widget: oweAmount,
      }),
      Widget.Box({
        hexpand: true,
        vertical: true,
        spacing: 6,
        children: txnWidgets
      }),
    ]
  })
}

const PlaceholderWidget = Widget.Label({
  className: 'placeholder-text',
  label: 'Nothing to see here.'
})

const DebtBox = () => Widget.Box({
  hexpand: true,
  className: 'debts',
  vertical: true,
  spacing: 14,
  children: LedgerService.bind('debts-liabilities').as(x => Object.keys(x).map(DebtWidget))
})

export default () => {
  return Widget.Box({
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [
      Widget.Label({
        label: 'Debts and Liabilities',
        className: 'dash-widget-header',
      }),
      Widget.Scrollable({
        hexpand: true,
        vexpand: true,
        css: 'min-width: 20rem;',
        hscroll: 'never',
        child: DebtBox(),
      })
    ]
  })
}
