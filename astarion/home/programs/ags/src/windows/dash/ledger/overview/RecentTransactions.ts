
/* ▀█▀ █▀█ ▄▀█ █▄░█ █▀ ▄▀█ █▀▀ ▀█▀ █ █▀█ █▄░█ █▀ */
/* ░█░ █▀▄ █▀█ █░▀█ ▄█ █▀█ █▄▄ ░█░ █ █▄█ █░▀█ ▄█ */

/* Displays a bunch of recent transactions. */

import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import Ledger, { TransactionData } from '../../../../services/Ledger.ts'
const ledger = Ledger.get_default()

const Scrollable = astalify(Gtk.ScrolledWindow)

/**
 * Create a widget representing a single transaction.
 */
const Transaction = (tdata: TransactionData) => {
  /* Some pre-processing */
  const isIncome = tdata.amount.includes('-')
  tdata.amount = tdata.amount.replace(/[^0-9.]/g, '')

  const icon = Widget.CenterBox({
    cssClasses: ['iconbox'],
    // centerWidget: Widget.Icon({
    //   // icon: LedgerService.tdataToIcon(tdata.desc, iconAccount)
    // })
  })

  const date = Widget.Label({
    cssClasses: ['date'],
    halign: Gtk.Align.START,
    label: tdata.date,
  })
  
  const desc = Widget.Label({
    cssClasses: ['description'],
    halign: Gtk.Align.START,
    label: tdata.desc,
  })

  const amnt = Widget.Label({
    cssClasses: isIncome ? ['amount-green'] : ['amount'],
    halign: Gtk.Align.END,
    label: `${isIncome ? '+' : '-'}${tdata.amount}`
  })

  const start = Widget.Box({
    vertical: false,
    spacing: 18,
    children: [
      icon,
      Widget.Box({
        orientation: 1,
        children: [ desc, date ],
      }),
    ],
  })
  
  const end = Widget.Box({
    vertical: true,
    children: [
      amnt,
    ],
  })

  return Widget.CenterBox({
    cssClasses: ['transaction'],
    hexpand: true,
    startWidget: start,
    endWidget: end,
  })
}

const TransactionContainer = () => Widget.Box({
  cssClasses: ['transactions'],
  vexpand: true,
  hexpand: false,
  vertical: true,
  homogeneous: true,
  spacing: 14,
  children: bind(ledger, 'transactions').as(x => {
    if (x === null) return /* @TODO find out why this is ever null in the first place */
    return x.map(Transaction)
  })
})

export const Transactions = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: ['widget-container'],
    children: [
      Widget.Label({
        label: 'Recent Transactions',
        cssClasses: ['widget-header'],
      }),
      Scrollable({
        hscroll: Gtk.ScrollablePolicy.NEVER, /* @TODO: Why does it still hscroll? */
        vscroll: Gtk.ScrollablePolicy.NATURAL,
        child: TransactionContainer(),
      })
    ]
  })
}
