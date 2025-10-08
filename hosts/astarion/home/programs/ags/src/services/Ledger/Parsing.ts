/**
 * █▀█ ▄▀█ █▀█ █▀ █ █▄░█ █▀▀
 * █▀▀ █▀█ █▀▄ ▄█ █ █░▀█ █▄█
 *
 * All functions for parsing CSV outputs from hledger.
 *
 * Usage:
 * ------
 * import LedgerCSVParser from "./Parsing";
 * LedgerCSVParser.balance(...);
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import {
  DebtItem,
  TransactionData,
  CategorySpending,
  HLedgerBalanceRow,
  HLedgerRegisterFields,
} from "./Types";

import { parseAmount } from "./Utils";

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Parses CSV output from hledger daily balance sheet command.
 * The --daily flag outputs a single row with all daily balances as comma-separated values.
 *
 * @param csvOutput - Single CSV row with daily balance amounts
 * @returns Array of numeric balance values for each day
 * @throws {Error} When CSV output is invalid or malformed
 *
 * @example
 * Input: `"Net:","$4199.26","$4087.17","$1454.35"`
 * Output: [4199.26, 4087.17, 1454.35]
 */
const balanceTrend = (csvOutput: string): Array<number> => {
  if (!csvOutput || typeof csvOutput !== "string") {
    throw new Error(
      "Invalid balance trend CSV output: expected non-empty string",
    );
  }

  const trimmed = csvOutput.trim();
  if (trimmed === "") {
    console.warn("Empty balance trend data");
    return [];
  }

  // Split by comma and remove quotes
  const fields = trimmed
    .split(",")
    .map((field) => field.replaceAll('"', "").trim());

  if (fields.length < 2) {
    throw new Error(
      `Invalid balance trend format: expected at least 2 fields, got ${fields.length}`,
    );
  }

  // First field is "Net:" label; rest are daily balance amounts
  const balanceFields = fields.slice(1);

  return balanceFields.map((amountStr, index) => {
    const balance = parseAmount(amountStr);

    if (isNaN(balance)) {
      console.warn(
        `Invalid balance amount at position ${index + 1}: "${amountStr}"`,
      );
      return 0;
    }

    return balance;
  });
};

/**
 * Parses CSV output from hledger balance command into structured data.
 *
 * @param csvOutput - Raw CSV string from hledger balance command
 * @returns Array of parsed balance rows
 * @throws {Error} When CSV output is invalid or malformed
 */
const balance = (csvOutput: string): Array<HLedgerBalanceRow> => {
  if (!csvOutput || typeof csvOutput !== "string") {
    throw new Error("Invalid CSV output");
  }

  const lines = csvOutput.replaceAll('"', "").split("\n");
  const dataLines = lines.slice(1).filter((line) => line.trim() !== ""); // Skip header, remove empty lines

  return dataLines.map((line) => {
    const fields = line.split(",");
    if (fields.length < 2) {
      throw new Error(`Invalid balance CSV row: ${line}`);
    }
    return {
      account: fields[0],
      balance: fields[1],
    };
  });
};

/**
 * Parses CSV output from hledger register command into TransactionData objects.
 * Maps CSV fields using the HLedgerRegCSV enum to proper object properties.
 *
 * @param csvOutput - Raw CSV string from hledger register command
 * @returns Array of parsed transaction objects
 * @throws {Error} When CSV output is invalid or malformed
 *
 * @example
 * Input CSV row: `"1","2024-01-15","","Store","Expenses:Food","$45.67","$45.67"`
 * Output object: `{ txnidx: "1", date: "2024-01-15", desc: "Store", ... }`
 */
const registerTransactions = (csvOutput: string): Array<TransactionData> => {
  if (!csvOutput || typeof csvOutput !== "string") {
    throw new Error(
      "Invalid transactions CSV output: expected non-empty string",
    );
  }

  const lines = csvOutput.replaceAll('"', "").split("\n");

  // Remove header row and filter out empty lines
  const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

  if (dataLines.length === 0) {
    console.warn("No transaction data found");
    return [];
  }

  return dataLines.map((line, index) => {
    const fields = line.split(",");

    // Validate we have enough fields for a complete transaction
    if (fields.length != HLedgerRegisterFields.LENGTH) {
      // Divide by 2 because enum has numeric keys too
      console.warn(
        `Invalid transaction CSV row at line ${index + 2}: insufficient fields in "${line}"`,
      );

      // Return a minimal valid transaction object
      return {
        txnidx: "",
        date: "",
        code: "",
        desc: "Invalid transaction",
        account: "",
        amount: "$0.00",
        total: "$0.00",
      } as TransactionData;
    }

    // Map CSV fields to object properties using the enum
    const transaction: TransactionData = {
      txnidx: fields[HLedgerRegisterFields.txnidx] || "",
      date: fields[HLedgerRegisterFields.date] || "",
      code: fields[HLedgerRegisterFields.code] || "",
      desc: fields[HLedgerRegisterFields.desc] || "",
      account: fields[HLedgerRegisterFields.account] || "",
      amount: fields[HLedgerRegisterFields.amount] || "$0.00",
      total: fields[HLedgerRegisterFields.total] || "$0.00",
    };

    return transaction;
  });
};

/**
 * Parses CSV output from hledger register command for debts and liabilities.
 * Groups transactions by account and creates DebtItem objects.
 *
 * @param csvOutput - Raw CSV string from hledger register --pending command
 * @returns Object with accounts as keys and arrays of debt/liability transactions as values
 * @throws {Error} When CSV output is invalid or malformed
 */
const debtsLiabilities = (csvOutput: string): Record<string, DebtItem[]> => {
  if (!csvOutput || typeof csvOutput !== "string") {
    throw new Error(
      "Invalid debts/liabilities CSV output: expected non-empty string",
    );
  }

  const lines = csvOutput.replaceAll('"', "").split("\n");
  const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

  if (dataLines.length === 0) {
    console.info("No pending debts or liabilities found");
    return {};
  }

  const groupedByAccount: Record<string, DebtItem[]> = {};

  dataLines.forEach((line, index) => {
    const fields = line.split(",");

    if (fields.length != HLedgerRegisterFields.LENGTH) {
      console.warn(
        `Invalid debt/liability CSV row at line ${index + 2}: insufficient fields in "${line}"`,
      );
      return;
    }

    const account = fields[HLedgerRegisterFields.account];
    const description = fields[HLedgerRegisterFields.desc];
    const amountStr = fields[HLedgerRegisterFields.amount];

    // Validate required fields
    if (!account || !description || !amountStr) {
      console.warn(
        `Missing required fields in debt/liability row at line ${index + 2}: "${line}"`,
      );
      return; // Skip this line
    }

    const amount = parseAmount(amountStr);

    // Initialize account array if it doesn't exist
    if (!groupedByAccount[account]) {
      groupedByAccount[account] = [];
    }

    // Add transaction to the account group
    groupedByAccount[account].push({
      desc: description,
      total: amount,
    });
  });

  return groupedByAccount;
};

/**
 * Parses CSV output from hledger balance command for category spending data.
 * Extracts category names from account paths and converts amounts to numbers.
 *
 * @param csvOutput - Raw CSV string from hledger balance Expenses command
 * @returns Array of category spending objects
 * @throws {Error} When CSV output is invalid or malformed
 *
 * @example
 * Input: `"Expenses:Food","$450.00"`
 * Output: `{ category: "Food", total: 450.00 }`
 */
const categorySpending = (csvOutput: string): Array<CategorySpending> => {
  if (!csvOutput || typeof csvOutput !== "string") {
    throw new Error(
      "Invalid category spending CSV output: expected non-empty string",
    );
  }

  const lines = csvOutput.replaceAll('"', "").split("\n");

  // Remove header row and filter out empty lines
  const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

  if (dataLines.length === 0) {
    console.info("No category spending data found for current month");
    return [];
  }

  return dataLines
    .map((line, index) => {
      const fields = line.split(",");

      if (fields.length < 2) {
        console.warn(
          `Invalid category spending CSV row at line ${index + 2}: insufficient fields in "${line}"`,
        );
        return { category: "Unknown", total: 0 };
      }

      const accountPath = fields[0];
      const amountStr = fields[1];

      // Extract category name from account path (e.g., "Expenses:Food" → "Food")
      const pathParts = accountPath.split(":");
      const category = pathParts.length > 1 ? pathParts[1] : pathParts[0];

      // Parse the amount
      const amount = parseAmount(amountStr);

      if (!category) {
        console.warn(
          `Could not extract category name from account path: "${accountPath}"`,
        );
        return { category: "Unknown", total: amount };
      }

      return {
        category: category,
        total: amount,
      };
    })
    .filter((item) => item.total > 0); // Filter out zero or negative amounts
};

/*****************************************************************************
 * Export
 *****************************************************************************/

const LedgerCSVParser = {
  balanceTrend: balanceTrend,
  balance: balance,
  registerTransactions: registerTransactions,
  debtsLiabilities: debtsLiabilities,
  categorySpending: categorySpending,
};

export default LedgerCSVParser;
