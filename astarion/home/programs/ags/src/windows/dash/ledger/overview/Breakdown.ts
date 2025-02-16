
/* █▄▄ █▀█ █▀▀ ▄▀█ █▄▀ █▀▄ █▀█ █░█░█ █▄░█ */
/* █▄█ █▀▄ ██▄ █▀█ █░█ █▄▀ █▄█ ▀▄▀▄▀ █░▀█ */

/* Shows breakdown of monthly spending in a pie chart. */

import { App, Astal, Gtk, Gdk, Widget, astalify } from 'astal/gtk4'
import { Variable, GLib, bind } from 'astal'

import PieChart from '../../../../components/PieChart.ts'
import Ledger, { DebtsLiabilitiesProps } from '../../../../services/Ledger.ts'

const DrawingArea = astalify(Gtk.DrawingArea)

const ledger = Ledger.get_default()

const PieChartContainer = () => Widget.Box({
  hpack: 'center',
  vpack: 'center',
  spacing: 24,
  children: bind(ledger, 'monthly-breakdown').as(breakdown => {
    if (breakdown === undefined) return

    return [
      PieChart({
        values: breakdown,
        drawLegend: true,
      }),
    ]
  })
})

export const Breakdown = () => {
  return Widget.Box({
    vertical: true,
    hexpand: true,
    cssClasses: ['widget-container'],
    children: [
      Widget.Box({
        cssClasses: ['breakdown'],
        orientation: 1,
        halign: Gtk.Align.CENTER,
        children: [
          Widget.Label({
            label: 'Monthly Breakdown',
            cssClasses: ['widget-header'],
          }),
          PieChartContainer(),
        ]
      })
    ]
  })
}
