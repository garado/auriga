/**
 * ▀█▀ █▀█ ▄▀█ █▄░█ █▀ ▄▀█ █▀▀ ▀█▀ █ █▀█ █▄░█ █▀
 * ░█░ █▀▄ █▀█ █░▀█ ▄█ █▀█ █▄▄ ░█░ █ █▄█ █░▀█ ▄█
 *
 * Displays a list of recent transactions.
 * Useful for quickly remembering the last time the ledger was balanced.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify } from "astal/gtk4";
import { bind } from "astal";

import Ledger, { TransactionData } from "@/services/Ledger.ts";

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
  transactions: "transactions",
  transaction: "transaction",
  iconBox: "iconbox",
  date: "date",
  description: "description",
  amount: "amount",
  amountIncome: "amount-green",
} as const;

const LAYOUT = {
  transactionSpacing: 14,
  transactionItemSpacing: 18,
} as const;

const REGEX = {
  nonNumeric: /[^0-9.]/g,
} as const;

const AMOUNT_INDICATORS = {
  income: "+",
  expense: "-",
} as const;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Processes transaction amount to determine if it's income or expense.
 * @param rawAmount - The raw amount string from transaction data
 * @returns Object containing processed amount and income status
 */
const processTransactionAmount = (rawAmount: string) => {
  const isIncome = rawAmount.includes("-");
  const cleanAmount = rawAmount.replace(REGEX.nonNumeric, "");

  return {
    isIncome,
    cleanAmount,
    displayAmount: `${isIncome ? AMOUNT_INDICATORS.income : AMOUNT_INDICATORS.expense}${cleanAmount}`,
  };
};

/**
 * Creates an icon widget for the transaction.
 * @param transactionData - The transaction data
 * @returns Widget containing transaction icon
 */
const createTransactionIcon = (transactionData: TransactionData) =>
  Widget.CenterBox({
    cssClasses: [CSS_CLASSES.iconBox],
    centerWidget: Widget.Image({
      // @TODO Implement icon mapping based on transaction description
      // iconName: LedgerService.transactionDataToIcon(transactionData.desc, iconAccount)
    }),
  });

/**
 * Creates a date label for the transaction.
 * @param date - The transaction date string
 * @returns Widget displaying transaction date
 */
const createDateLabel = (date: string) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.date],
    halign: Gtk.Align.START,
    label: date,
  });

/**
 * Creates a description label for the transaction.
 * @param description - The transaction description
 * @returns Widget displaying transaction description
 */
const createDescriptionLabel = (description: string) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.description],
    halign: Gtk.Align.START,
    label: description,
  });

/**
 * Creates an amount label for the transaction.
 * @param amount - The processed amount string
 * @param isIncome - Whether this is an income transaction
 * @returns Widget displaying transaction amount
 */
const createAmountLabel = (amount: string, isIncome: boolean) =>
  Widget.Label({
    cssClasses: [isIncome ? CSS_CLASSES.amountIncome : CSS_CLASSES.amount],
    halign: Gtk.Align.END,
    label: amount,
  });

/**
 * Creates the left section of a transaction row (icon + description/date).
 * @param transactionData - The transaction data
 * @returns Widget containing transaction details
 */
const createTransactionStartSection = (transactionData: TransactionData) => {
  const icon = createTransactionIcon(transactionData);
  const dateLabel = createDateLabel(transactionData.date);
  const descriptionLabel = createDescriptionLabel(transactionData.desc);

  const textContainer = Widget.Box({
    orientation: Gtk.Orientation.VERTICAL,
    children: [descriptionLabel, dateLabel],
  });

  return Widget.Box({
    vertical: false,
    spacing: LAYOUT.transactionItemSpacing,
    children: [icon, textContainer],
  });
};

/**
 * Creates the right section of a transaction row (amount).
 * @param displayAmount - The formatted amount to display
 * @param isIncome - Whether this is an income transaction
 * @returns Widget containing transaction amount
 */
const createTransactionEndSection = (
  displayAmount: string,
  isIncome: boolean,
) =>
  Widget.Box({
    vertical: true,
    children: [createAmountLabel(displayAmount, isIncome)],
  });

/**
 * Creates a widget representing a single transaction.
 * @param transactionData - The transaction data to display
 * @returns Widget containing complete transaction row
 */
const createTransactionWidget = (transactionData: TransactionData) => {
  const { isIncome, displayAmount } = processTransactionAmount(
    transactionData.amount,
  );

  const startSection = createTransactionStartSection(transactionData);
  const endSection = createTransactionEndSection(displayAmount, isIncome);

  return Widget.CenterBox({
    cssClasses: [CSS_CLASSES.transaction],
    hexpand: true,
    startWidget: startSection,
    endWidget: endSection,
  });
};

/**
 * Creates the container that holds all transaction widgets.
 * @returns Widget containing list of transactions
 */
const createTransactionContainer = () =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.transactions],
    vexpand: true,
    hexpand: false,
    vertical: true,
    homogeneous: true,
    spacing: LAYOUT.transactionSpacing,
    children: bind(ledgerService, "transactions").as((transactions) => {
      if (transactions === null) {
        // TODO: Investigate why transactions can be null and handle appropriately
        return [];
      }

      // Display transactions in reverse chronological order (most recent first)
      return transactions
        .slice() // Create a copy to avoid mutating original array
        .reverse()
        .map(createTransactionWidget);
    }),
  });

/**
 * Creates the header widget for the transactions section.
 * @returns Widget containing section header
 */
const createTransactionsHeader = () =>
  Widget.Label({
    label: "Recent Transactions",
    cssClasses: [CSS_CLASSES.widgetHeader],
  });

/**
 * Creates a scrollable container for the transactions list.
 * @returns Widget containing scrollable transactions container
 */
const createScrollableTransactionsContainer = () =>
  ScrollableWindow({
    child: createTransactionContainer(),
    vscrollbar_policy: Gtk.PolicyType.ALWAYS,
    hscrollbar_policy: Gtk.PolicyType.NEVER,
  });

/**
 * Main transactions component that displays a list of recent transactions.
 * Provides a scrollable view of transaction history for quick reference.
 * @returns Widget containing the complete transactions interface
 */
export const Transactions = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.widgetContainer],
    children: [
      createTransactionsHeader(),
      createScrollableTransactionsContainer(),
    ],
  });
};
