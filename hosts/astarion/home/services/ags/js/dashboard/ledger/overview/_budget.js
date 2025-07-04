
// █▄▄ █░█ █▀▄ █▀▀ █▀▀ ▀█▀
// █▄█ █▄█ █▄▀ █▄█ ██▄ ░█░

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import LedgerService from '../../../services/ledger/ledger.js/'

/**
 * Create UI element for a budget bar given a data object.
 * */
const CreateBudgetEntry = (budgetData) => {
  // Bounds checking
  // if (budgetData.spent > budgetData.allotted) {
  //   budgetData.currentValue = budgetData.maxValue
  // }
  
  budgetData.account = budgetData.account.replace(/Expenses:|Assets:/g, '')

  if (budgetData.spent < 0) budgetData.spent = 0

  const Bar = Widget.LevelBar({
    className: 'levelbar',
    heightRequest: 40,
    widthRequest: 380,
    value: budgetData.spent,
    maxValue: budgetData.allotted,
  })

  const spent = Math.round((budgetData.spent / budgetData.allotted) * 100)

  const Labels = Widget.CenterBox({
    className: 'labels',
    hexpand: true,
    startWidget: Widget.Label({
      className: 'spent',
      hpack: 'start',
      label: `${String(spent)}%`
    }),
    endWidget: Widget.Label({
      className: 'remaining',
      hpack: 'end',
      // label: `${String(100 - spent)}%`
    }) 
  })

  const BarOverlay = Widget.Overlay({
    className: 'bar',
    child: Bar,
    overlays: [
      Widget.Box({
        vertical: false,
        children: [ Labels ],
      })
    ],
  })

  const BottomBox = Widget.CenterBox({
    className: 'bottom',
    hexpand: true,
    startWidget: Widget.Label({
      className: 'spent',
      hpack: 'start',
      label: budgetData.account,
    }),
    endWidget: Widget.Label({
      className: 'remaining',
      hpack: 'end',
      label: String(`${budgetData.spent}/${budgetData.allotted}`),
    }) 
  })
  
  const BudgetEntry = Widget.Box({
    className: 'entry',
    vertical: true,
    children: [
      BarOverlay,
      BottomBox,
    ],
  })

  return BudgetEntry
}

/**
 * Container for all budget entries
 * */
const BudgetBox = () => Widget.Box({
  hexpand: true,
  class_name: 'budget',
  vertical: true,
  spacing: 20,
  children: [ 
    Widget.Label({
      class_name: 'placeholder-text',
      label: 'Nothing to see here.'
    })
  ],
  setup: self => self.hook(LedgerService, (self, budgetData) => {
    if (budgetData === undefined) return;
    self.children.forEach(x => self.remove(x))
    budgetData.map(x => self.add(CreateBudgetEntry(x)))
  }, 'budget'),
})

export default () => {
  return Widget.Box({
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [
      Widget.Label({
        label: 'Budget',
        class_name: 'dash-widget-header',
      }),
      Widget.Scrollable({
        hscroll: 'never',
        vexpand: true,
        child: BudgetBox(),
      })
    ]
  })
}
