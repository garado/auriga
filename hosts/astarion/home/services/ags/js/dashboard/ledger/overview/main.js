
// █▀█ █░█ █▀▀ █▀█ █░█ █ █▀▀ █░█░█
// █▄█ ▀▄▀ ██▄ █▀▄ ▀▄▀ █ ██▄ ▀▄▀▄▀

// Ledger Overview page.
// See important financial information at a glance.

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import DashWidgetContainer from '../../../widgets/dashWidgetContainer.js'

import Accounts from './_accounts.js'
import Debts from './_debts.js'
import Breakdown from './_breakdown.js'
import CardBalance from './_cardBalance.js'
import Transactions from './_transactions.js'
import Budget from './_budget.js'

const LeftBox = Widget.Box({
  vertical: true,
  homogeneous: false,
  spacing: 12,
  children: [
    Accounts(),
    // CardBalance(),
  ]
})

const CenterBox = Widget.Box({
  homogeneous: false,
  vertical: true,
  spacing: 12,
  children: [
    DashWidgetContainer(Transactions()),
    DashWidgetContainer(Breakdown()),
  ]
})
  
const RightBox = Widget.Box({
  vexpand: false,
  vertical: true,
  homogeneous: false,
  spacing: 12,
  children: [
    DashWidgetContainer(Budget()),
    DashWidgetContainer(Debts()),
  ]
})

export default () => Widget.Box({
  name: 'Overview',
  attribute: { name: 'overview' },
  className: 'overview',
  vertical: false,
  homogeneous: false,
  vexpand: true,
  hexpand: true,
  spacing: 12,
  children: [
    LeftBox,
    CenterBox,
    RightBox,
  ]
})
