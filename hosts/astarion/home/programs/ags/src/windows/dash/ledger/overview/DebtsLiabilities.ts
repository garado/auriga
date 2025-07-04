/* █▀▄ █▀▀ █▄▄ ▀█▀ █▀   ▄▀█ █▄░█ █▀▄   █░░ █ ▄▀█ █▄▄ █ █░░ █ ▀█▀ █ █▀▀ █▀ */
/* █▄▀ ██▄ █▄█ ░█░ ▄█   █▀█ █░▀█ █▄▀   █▄▄ █ █▀█ █▄█ █ █▄▄ █ ░█░ █ ██▄ ▄█ */

import { Gtk, Widget, astalify } from "astal/gtk4";
import { bind } from "astal";

import Ledger, { DebtsLiabilitiesProps } from "@/services/Ledger.ts";
import Pango from "gi://Pango?version=1.0";
const ledger = Ledger.get_default();

const Scrollable = astalify(Gtk.ScrolledWindow);

/**
 * Container for all DebtWidgets.
 */
const DebtBoxContainer = () =>
  Widget.Box({
    cssClasses: ["debts"],
    hexpand: true,
    vertical: true,
    spacing: 14,
    children: bind(ledger, "debts-liabilities").as((x) =>
      Object.keys(x).map(DebtWidget),
    ),
  });

/**
 * Widget for debts/liabilities to a single account.
 */
const DebtWidget = (account: string) => {
  /* Array of objects representing uncleared transactions for this account. */
  const debtData = ledger.debtsLiabilities[account];

  const whoOwesYou = Widget.Label({
    cssClasses: ["debts-account"],
    halign: Gtk.Align.START,
    label: account,
  });

  /* Parse total amount owed */
  const amounts = debtData.map((txn: DebtsLiabilitiesProps) => txn.total);
  let totalAmountOwed = 0;
  amounts.forEach((n: number) => (totalAmountOwed += n));

  /* Text saying either "you owe" or "you're owed" */
  const oweText = Widget.Label({
    label: totalAmountOwed > 0 ? "you're owed" : "you owe",
    valign: Gtk.Align.END,
    cssClasses:
      totalAmountOwed > 0 ? ["owe-type", "greentext"] : ["owe-type", "redtext"],
  });

  const oweAmount = Widget.Label({
    halign: Gtk.Align.END,
    cssClasses:
      totalAmountOwed > 0
        ? ["debts-amount", "greentext"]
        : ["debts-amount", "redtext"],
    label: String(totalAmountOwed.toFixed(2)),
    ellipsize: Pango.EllipsizeMode.END,
  });

  /**
   * Create a widget for every transaction
   * (If someone owes you $52 for X and $56 for Y,
   * this will create 2 widgets: one for X, one for Y)
   */
  const txnWidgets = debtData.map((txn: DebtsLiabilitiesProps) => {
    const desc = Widget.Label({
      cssClasses: ["desc"],
      halign: Gtk.Align.END,
      label: txn.desc,
      ellipsize: Pango.EllipsizeMode.END,
    });

    const amount = Widget.Label({
      cssClasses: ["entry-amount"],
      halign: Gtk.Align.END,
      label: String(Number(txn.total).toFixed(2)),
    });

    return Widget.CenterBox({
      cssClasses: ["transaction"],
      hexpand: true,
      start_widget: desc,
      end_widget: amount,
    });
  });

  return Widget.Box({
    vertical: true,
    hexpand: true,
    spacing: 6,
    children: [
      Widget.CenterBox({
        cssClasses: ["entry-top"],
        hexpand: true,
        halign: Gtk.Align.END,
        endWidget: oweText,
      }),
      Widget.CenterBox({
        cssClasses: ["entry-top"],
        hexpand: true,
        startWidget: whoOwesYou,
        endWidget: oweAmount,
      }),
      Widget.Box({
        hexpand: true,
        vertical: true,
        spacing: 6,
        children: txnWidgets,
      }),
    ],
  });
};

export const Debts = () => {
  return Widget.Box({
    vertical: true,
    vexpand: true,
    hexpand: true,
    cssClasses: ["widget-container"],
    children: [
      Widget.Label({
        label: "Debts and Liabilities",
        cssClasses: ["widget-header"],
      }),
      Scrollable({
        hexpand: true,
        vexpand: true,
        css: "min-width: 20rem;",
        hscroll: "never",
        child: DebtBoxContainer(),
      }),
    ],
  });
};
