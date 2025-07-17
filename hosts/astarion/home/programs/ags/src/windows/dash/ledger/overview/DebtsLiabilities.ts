/**
 * █▀▄ █▀▀ █▄▄ ▀█▀ █▀   ▄▀█ █▄░█ █▀▄   █░░ █ ▄▀█ █▄▄ █ █░░ █ ▀█▀ █ █▀▀ █▀
 * █▄▀ ██▄ █▄█ ░█░ ▄█   █▀█ █░▀█ █▄▀   █▄▄ █ █▀█ █▄█ █ █▄▄ █ ░█░ █ ██▄ ▄█
 *
 * Displays debts and liabilities organized by account.
 *
 * Shows both amounts owed to user and amounts user owes to others.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify } from "astal/gtk4";
import { bind } from "astal";
import Pango from "gi://Pango?version=1.0";

import Ledger, { DebtItem } from "@/services/Ledger.ts";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerService = Ledger.get_default();
const ScrollableWindow = astalify(Gtk.ScrolledWindow);

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  widgetContainer: "widget-container",
  widgetHeader: "widget-header",
  debts: "debts",
  debtsAccount: "debts-account",
  debtsAmount: "debts-amount",
  oweType: "owe-type",
  greenText: "greentext",
  redText: "redtext",
  description: "desc",
  entryAmount: "entry-amount",
  entryTop: "entry-top",
  transaction: "transaction",
} as const;

const LAYOUT = {
  mainSpacing: 6,
  debtSpacing: 14,
  minWidth: "20rem",
} as const;

const DEBT_LABELS = {
  owedToYou: "you're owed",
  youOwe: "you owe",
} as const;

const FORMATTING = {
  decimalPlaces: 2,
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Calculates the total amount for a collection of debt items.
 * @param debtItems - Array of debt items to sum
 * @returns Total amount owed (positive if owed to you, negative if you owe)
 */
const calculateTotalDebtAmount = (debtItems: DebtItem[]): number => {
  return debtItems.reduce((total, item) => total + item.total, 0);
};

/**
 * Determines the appropriate styling and text based on debt amount.
 * @param totalAmount - The total debt amount
 * @returns Object containing styling classes and descriptive text
 */
const getDebtDisplayInfo = (totalAmount: number) => {
  const isOwedToYou = totalAmount > 0;

  return {
    isOwedToYou,
    textLabel: isOwedToYou ? DEBT_LABELS.owedToYou : DEBT_LABELS.youOwe,
    textClasses: isOwedToYou
      ? [CSS_CLASSES.oweType, CSS_CLASSES.greenText]
      : [CSS_CLASSES.oweType, CSS_CLASSES.redText],
    amountClasses: isOwedToYou
      ? [CSS_CLASSES.debtsAmount, CSS_CLASSES.greenText]
      : [CSS_CLASSES.debtsAmount, CSS_CLASSES.redText],
  };
};

/**
 * Formats a number as a currency string with specified decimal places.
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
const formatCurrencyAmount = (amount: number): string => {
  return amount.toFixed(FORMATTING.decimalPlaces);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Creates a label widget for the account name.
 * @param accountName - The name of the account
 * @returns Widget displaying account name
 */
const createAccountNameLabel = (accountName: string) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.debtsAccount],
    halign: Gtk.Align.START,
    label: accountName,
  });

/**
 * Creates a label indicating the debt direction (you owe vs you're owed).
 * @param displayInfo - Object containing styling and text information
 * @returns Widget displaying debt direction
 */
const createDebtDirectionLabel = (
  displayInfo: ReturnType<typeof getDebtDisplayInfo>,
) =>
  Widget.Label({
    label: displayInfo.textLabel,
    valign: Gtk.Align.END,
    cssClasses: displayInfo.textClasses,
  });

/**
 * Creates a label displaying the total debt amount.
 * @param totalAmount - The total debt amount
 * @param displayInfo - Object containing styling information
 * @returns Widget displaying formatted debt amount
 */
const createTotalAmountLabel = (
  totalAmount: number,
  displayInfo: ReturnType<typeof getDebtDisplayInfo>,
) =>
  Widget.Label({
    halign: Gtk.Align.END,
    cssClasses: displayInfo.amountClasses,
    label: formatCurrencyAmount(totalAmount),
    ellipsize: Pango.EllipsizeMode.END,
  });

/**
 * Creates a widget for a single debt transaction item.
 * @param debtItem - The debt item to display
 * @returns Widget containing transaction description and amount
 */
const createDebtTransactionWidget = (debtItem: DebtItem) => {
  const descriptionLabel = Widget.Label({
    cssClasses: [CSS_CLASSES.description],
    halign: Gtk.Align.END,
    label: debtItem.desc,
    ellipsize: Pango.EllipsizeMode.END,
  });

  const amountLabel = Widget.Label({
    cssClasses: [CSS_CLASSES.entryAmount],
    halign: Gtk.Align.END,
    label: formatCurrencyAmount(debtItem.total),
  });

  return Widget.CenterBox({
    cssClasses: [CSS_CLASSES.transaction],
    hexpand: true,
    start_widget: descriptionLabel,
    end_widget: amountLabel,
  });
};

/**
 * Creates the header section showing debt direction and account name.
 * @param accountName - The account name
 * @param displayInfo - Object containing styling and text information
 * @returns Widget containing debt direction header
 */
const createDebtHeaderSection = (
  accountName: string,
  displayInfo: ReturnType<typeof getDebtDisplayInfo>,
) =>
  Widget.CenterBox({
    cssClasses: [CSS_CLASSES.entryTop],
    hexpand: true,
    halign: Gtk.Align.END,
    endWidget: createDebtDirectionLabel(displayInfo),
  });

/**
 * Creates the account summary section showing account name and total amount.
 * @param accountName - The account name
 * @param totalAmount - The total debt amount
 * @param displayInfo - Object containing styling information
 * @returns Widget containing account summary
 */
const createAccountSummarySection = (
  accountName: string,
  totalAmount: number,
  displayInfo: ReturnType<typeof getDebtDisplayInfo>,
) =>
  Widget.CenterBox({
    cssClasses: [CSS_CLASSES.entryTop],
    hexpand: true,
    startWidget: createAccountNameLabel(accountName),
    endWidget: createTotalAmountLabel(totalAmount, displayInfo),
  });

/**
 * Creates the transactions list section for individual debt items.
 * @param debtItems - Array of debt items to display
 * @returns Widget containing list of debt transactions
 */
const createTransactionsListSection = (debtItems: DebtItem[]) =>
  Widget.Box({
    hexpand: true,
    vertical: true,
    spacing: LAYOUT.mainSpacing,
    children: debtItems.map(createDebtTransactionWidget),
  });

/**
 * Creates a complete debt widget for a single account.
 * Displays account name, total amount, debt direction, and individual transactions.
 * @param accountName - The name of the account
 * @returns Widget containing complete debt information for the account
 */
const createAccountDebtWidget = (accountName: string) => {
  const debtItems = ledgerService.debtItems[accountName];
  const totalAmount = calculateTotalDebtAmount(debtItems);
  const displayInfo = getDebtDisplayInfo(totalAmount);

  return Widget.Box({
    vertical: true,
    hexpand: true,
    spacing: LAYOUT.mainSpacing,
    children: [
      createDebtHeaderSection(accountName, displayInfo),
      createAccountSummarySection(accountName, totalAmount, displayInfo),
      createTransactionsListSection(debtItems),
    ],
  });
};

/**
 * Creates the container that holds all debt widgets.
 * @returns Widget containing all account debt information
 */
const createDebtsContainer = () =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.debts],
    hexpand: false,
    vertical: true,
    spacing: LAYOUT.debtSpacing,
    children: bind(ledgerService, "debtItems").as((debtItemsMap) =>
      Object.keys(debtItemsMap).map(createAccountDebtWidget),
    ),
  });

/**
 * Creates the header widget for the debts section.
 * @returns Widget containing section header
 */
const createDebtsHeader = () =>
  Widget.Label({
    label: "Debts and Liabilities",
    cssClasses: [CSS_CLASSES.widgetHeader],
  });

/**
 * Creates a scrollable container for the debts list.
 * @returns Widget containing scrollable debts container
 */
const createScrollableDebtsContainer = () =>
  ScrollableWindow({
    hexpand: true,
    vexpand: true,
    css: `min-width: ${LAYOUT.minWidth};`,
    hscroll: "never",
    child: createDebtsContainer(),
  });

/**
 * Main debts component that displays debts and liabilities organized by account.
 * Shows both amounts owed to you (positive, green) and amounts you owe (negative, red).
 * Each account displays individual transactions that contribute to the total.
 * @returns Widget containing the complete debts interface
 */
export const Debts = () => {
  return Widget.Box({
    vertical: true,
    vexpand: true,
    hexpand: true,
    cssClasses: [CSS_CLASSES.widgetContainer],
    children: [createDebtsHeader(), createScrollableDebtsContainer()],
  });
};
