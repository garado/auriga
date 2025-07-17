/**
 * ▄▀█ █▀▀ █▀▀ █▀█ █░█ █▄░█ ▀█▀ █▀
 * █▀█ █▄▄ █▄▄ █▄█ █▄█ █░▀█ ░█░ ▄█
 *
 * Displays account balances, net worth, and financial summary.
 * Shows balances for user-configured accounts plus monthly income/expense totals.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import { bind, Binding } from "astal";
import Ledger, { Account } from "@/services/Ledger.ts";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerService = Ledger.get_default();

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  accounts: "accounts",
  accountName: "account-name",
  accountCard: "account-card",
  accountBalance: "account-balance",
} as const;

const FORMATTING = {
  decimalPlaces: 2,
} as const;

const SUMMARY_ACCOUNTS = {
  netWorth: {
    displayName: "Net Worth",
    dataBinding: "netWorth" as const,
  },
  monthlyIncome: {
    displayName: "Income (last 30 days)",
    dataBinding: "incomeThisMonth" as const,
  },
  monthlyExpenses: {
    displayName: "Expenses (last 30 days)",
    dataBinding: "expensesThisMonth" as const,
  },
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Formats an account balance for display.
 * @param total - The account total (number or binding)
 * @returns Formatted string or binding for display
 */
const formatAccountBalance = (
  total: number | Binding<number>,
): string | Binding<string> => {
  if (total instanceof Object) {
    // Handle reactive binding
    return total.as((amount: number) =>
      amount.toFixed(FORMATTING.decimalPlaces),
    );
  } else {
    // Handle static number
    return total.toFixed(FORMATTING.decimalPlaces);
  }
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Creates a label widget for the account name.
 * @param displayName - The display name of the account
 * @returns Widget containing the account name
 */
const createAccountNameLabel = (displayName: string) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.accountName],
    halign: Gtk.Align.START,
    label: displayName,
  });

/**
 * Creates a label widget for the account balance.
 * @param formattedBalance - The formatted balance string or binding
 * @returns Widget containing the account balance
 */
const createAccountBalanceLabel = (
  formattedBalance: string | Binding<string>,
) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.accountBalance],
    halign: Gtk.Align.START,
    label: formattedBalance,
    selectable: true,
  });

/**
 * Creates a single account widget displaying name and balance.
 * @param accountData - The account data containing display name and total
 * @returns Widget representing a single account card
 */
const createAccountWidget = (accountData: Account) => {
  const formattedBalance = formatAccountBalance(accountData.total);

  const nameLabel = createAccountNameLabel(accountData.displayName);
  const balanceLabel = createAccountBalanceLabel(formattedBalance);

  return Widget.Box({
    cssClasses: [CSS_CLASSES.accountCard],
    vertical: true,
    hexpand: false,
    halign: Gtk.Align.START,
    valign: Gtk.Align.CENTER,
    children: [balanceLabel, nameLabel],
  });
};

/**
 * Creates a financial summary account widget.
 * @param summaryConfig - Configuration object containing display name and data binding key
 * @returns Widget representing a summary account (net worth, income, expenses)
 */
const createSummaryAccountWidget = (
  summaryConfig: (typeof SUMMARY_ACCOUNTS)[keyof typeof SUMMARY_ACCOUNTS],
) =>
  createAccountWidget({
    displayName: summaryConfig.displayName,
    total: bind(ledgerService, summaryConfig.dataBinding),
  });

/**
 * Creates the list of user-configured account widgets.
 * @returns Array of widgets representing user accounts
 */
const createUserAccountWidgets = () =>
  bind(ledgerService, "accountData").as((accounts) =>
    accounts.map(createAccountWidget),
  );

/**
 * Main accounts component that displays financial overview.
 * Shows net worth, monthly income/expenses, and individual account balances.
 * All amounts are selectable for easy copying.
 * @returns Widget containing the complete accounts interface
 */
export const Accounts = () => {
  return Widget.Box({
    cssClasses: [CSS_CLASSES.accounts],
    orientation: Gtk.Orientation.VERTICAL,
    halign: Gtk.Align.START,
    homogeneous: true,
    children: [
      createSummaryAccountWidget(SUMMARY_ACCOUNTS.netWorth),
      createSummaryAccountWidget(SUMMARY_ACCOUNTS.monthlyIncome),
      createSummaryAccountWidget(SUMMARY_ACCOUNTS.monthlyExpenses),
      createUserAccountWidgets(),
    ],
  });
};
