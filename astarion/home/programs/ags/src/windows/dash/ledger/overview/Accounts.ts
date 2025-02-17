/* ▄▀█ █▀▀ █▀▀ █▀█ █░█ █▄░█ ▀█▀ █▀ */
/* █▀█ █▄▄ █▄▄ █▄█ █▄█ █░▀█ ░█░ ▄█ */

/* Shows balances for the accounts defined in user config. */
/* Also shows net worth and monthly income/expenses. */

import { Gtk, Widget } from "astal/gtk4";
import { bind } from "astal";

import Ledger, { DisplayAccountProps } from "@/services/Ledger.ts";
const ledger = Ledger.get_default();

/**
 * Constructor for a single account widget.
 */
const Account = (data: DisplayAccountProps) => {
  const name = Widget.Label({
    cssClasses: ["account-name"],
    halign: Gtk.Align.START,
    label: data.displayName,
  });

  let label: Binding<string> | string = 0;
  if (data.total instanceof Object) {
    label = data.total.as((x: number) => `${x}`);
  } else {
    label = `${data.total.toFixed(2)}`;
  }

  const amount = Widget.Label({
    cssClasses: ["balance"],
    halign: Gtk.Align.START,
    label: label,
  });

  return Widget.Box({
    cssClasses: ["account"],
    vertical: true,
    hexpand: false,
    halign: Gtk.Align.START,
    valign: Gtk.Align.CENTER,
    children: [amount, name],
  });
};

export const Accounts = () => {
  return Widget.Box({
    cssClasses: ["accounts"],
    orientation: 1,
    halign: Gtk.Align.START,
    homogeneous: true,
    children: [
      Account({
        displayName: "Net Worth",
        total: bind(ledger, "netWorth"),
      }),
      Account({
        displayName: "Income",
        total: bind(ledger, "incomeThisMonth"),
      }),
      Account({
        displayName: "Expenses",
        total: bind(ledger, "expensesThisMonth"),
      }),
      bind(ledger, "displayAccounts").as((x) => x.map(Account)),
    ],
  });
};
