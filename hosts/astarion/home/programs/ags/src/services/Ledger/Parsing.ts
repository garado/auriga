/**
 * █▀█ ▄▀█ █▀█ █▀ █ █▄░█ █▀▀
 * █▀▀ █▀█ █▀▄ ▄█ █ █░▀█ █▄█
 *
 * Parsing for CSV outputs from hledger.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { HLedgerBalanceRow } from "./Types";
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
export const parseBalanceTrendCSV = (csvOutput: string): Array<number> => {
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
export const parseBalanceCSV = (
  csvOutput: string,
): Array<HLedgerBalanceRow> => {
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
