/**
 * █▀█ █░█ █▀█ ▀█▀ █▀▀
 * ▀▀█ █▄█ █▄█ ░█░ ██▄
 *
 * Shows quote.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import SettingsManager from "@/services/settings";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const QUOTE_INDEX = 0;
const AUTHOR_INDEX = 1;

const quotes = SettingsManager.get_default().config.dashHome.quotes;

const currentQuote = Variable(
  quotes[Math.floor(Math.random() * quotes.length)],
);

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

// // Change quote every time the dashboard is closed
// DashService.connect('dash-state-changed', (_, visible) => {
//   if (visible == undefined) return
//   if (!visible) {
//     currentQuote.value = quotes[Math.floor(Math.random() * quotes.length)]
//   }
// })

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const QuoteText = () =>
  Widget.Label({
    cssClasses: ["quote-text"],
    wrap: true,
    hexpand: true,
    vexpand: true,
    justify: Gtk.Justification.CENTER,
    maxWidthChars: 24,
    label: bind(currentQuote).as((value) => value[QUOTE_INDEX]),
  });

const Author = () =>
  Widget.Label({
    cssClasses: ["author"],
    hexpand: true,
    vexpand: true,
    justify: Gtk.Justification.CENTER,
    label: bind(currentQuote).as((value) => value[AUTHOR_INDEX]),
  });

export const Quote = () =>
  Widget.Box({
    cssClasses: ["quote", "widget-container"],
    spacing: 6,
    vertical: true,
    children: [
      Widget.Box({
        vertical: true,
        halign: Gtk.Align.BASELINE_CENTER,
        valign: Gtk.Align.BASELINE_CENTER,
        children: [QuoteText(), Author()],
      }),
    ],
  });
