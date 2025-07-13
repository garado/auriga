import { Gtk, astalify } from "astal/gtk4";

import { Accounts } from "@/windows/dash/ledger/overview/Accounts.ts";
import { Debts } from "@/windows/dash/ledger/overview/DebtsLiabilities.ts";
import { Breakdown } from "@/windows/dash/ledger/overview/Breakdown.ts";
import { Transactions } from "@/windows/dash/ledger/overview/RecentTransactions.ts";
import { setupEventController } from "@/utils/EventControllerKeySetup";
import Ledger from "@/services/Ledger";

const WIDGET_SPACING = 20;

const Grid = astalify(Gtk.Grid);

export const Overview = () => {
  return Grid({
    cssClasses: ["overview"],
    row_spacing: WIDGET_SPACING,
    column_spacing: WIDGET_SPACING,
    setup: (self) => {
      /* Widget, Col, Row, Width, Height */
      self.attach(Accounts(), 0, 0, 1, 2);
      self.attach(Debts(), 2, 0, 1, 1);
      self.attach(Transactions(), 1, 0, 1, 1);
      self.attach(Breakdown(), 1, 1, 1, 1);

      setupEventController({
        name: "LedgerOverview",
        widget: self,
        binds: {
          r: () => Ledger.get_default().initAll(),
        },
      });
    },
  });
};
