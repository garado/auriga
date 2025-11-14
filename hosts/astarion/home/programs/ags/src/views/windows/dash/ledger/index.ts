/**
 * █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█
 * █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄
 *
 * Entrypoint for dashboard ledger tab displaying financial data parsed from
 * hledger, the plaintext accounting tool.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { DashTabLayout } from "@/views/components/DashTabLayout.ts";
import { Overview } from "@/views/windows/dash/ledger/overview";
import { FIREGraph } from "@/views/windows/dash/ledger/fire";
import { Analytics } from "@/views/windows/dash/ledger/analytics";
import { setupKeybinds } from "@/utils/KeybindHandler";
import Ledger from "@/services/ledger";
import { bind } from "astal";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const KEYBINDS = {
  TOGGLE_OBFUSCATE: "O", // shift + o
} as const;

export default () => {
  const ledgerService = Ledger.get_default();

  const ledgerTab = DashTabLayout({
    name: bind(ledgerService, "obfuscate").as((obfuscated) =>
      obfuscated ? "Ledger*" : "Ledger",
    ),
    cssClasses: ["ledger"],
    pages: [
      { name: "Overview", ui: Overview },
      { name: "Analytics", ui: Analytics },
      { name: "FIRE", ui: FIREGraph },
    ],
  });

  setupKeybinds({
    widget: ledgerTab,
    binds: {
      [KEYBINDS.TOGGLE_OBFUSCATE]: () => {
        ledgerService.obfuscate = !ledgerService.obfuscate;
      },
    },
  });

  return ledgerTab;
};
