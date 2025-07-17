/**
 * █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█   █▀█ █░█ █▀▀ █▀█ █░█ █ █▀▀ █░█░█
 * █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄   █▄█ ▀▄▀ ██▄ █▀▄ ▀▄▀ █ ██▄ ▀▄▀▄▀
 *
 * Entry point for ledger overview page.
 *
 * Displays account balances, monthly spending breakdown, recent transactions,
 * and an overview of debts/liabilities.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";

import { Accounts } from "@/windows/dash/ledger/overview/Accounts.ts";
import { Debts } from "@/windows/dash/ledger/overview/DebtsLiabilities.ts";
import { SpendingBreakdown } from "@/windows/dash/ledger/overview/SpendingBreakdown.ts";
import { Transactions } from "@/windows/dash/ledger/overview/RecentTransactions.ts";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import Ledger from "@/services/Ledger";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const Grid = astalify(Gtk.Grid);

/*****************************************************************************
 * Constants
 *****************************************************************************/

const WIDGET_SPACING = 20;

const KEYBOARD_SHORTCUTS = {
  REFRESH_LEDGER: "r",
} as const;

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Overview = () => {
  return Grid({
    cssClasses: ["overview"],
    row_spacing: WIDGET_SPACING,
    column_spacing: WIDGET_SPACING,
    setup: (self) => {
      /* Widget, Col, Row, Width, Height */
      self.attach(Accounts(), 0, 0, 1, 2);
      self.attach(Debts(), 1, 0, 1, 1);
      self.attach(SpendingBreakdown(), 1, 1, 1, 1);
      self.attach(Transactions(), 2, 0, 1, 2);

      setupEventController({
        name: "LedgerOverview",
        widget: self,
        binds: {
          [KEYBOARD_SHORTCUTS.REFRESH_LEDGER]: () =>
            Ledger.get_default().initAll(),
        },
      });
    },
  });
};
