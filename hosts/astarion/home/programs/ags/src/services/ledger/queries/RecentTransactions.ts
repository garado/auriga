/*
 * █▀ █▀█ █▀▀ █▄░█ █▀▄ █ █▄░█ █▀▀   ▄▀█ █▄░█ ▄▀█ █░░ █▄█ █▀ █ █▀
 * ▄█ █▀▀ ██▄ █░▀█ █▄▀ █ █░▀█ █▄█   █▀█ █░▀█ █▀█ █▄▄ ░█░ ▄█ █ ▄█
 *
 * I have to be honest, this was vibe-coded
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import LedgerCSVParser from "../Parsing";
import { TransactionData } from "../Types";
import { CMD } from "@/utils/Commands";

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Load the most recent income and expense transactions.
 * Fetches the last 20 transactions from Income and Expenses accounts
 * and parses them into structured TransactionData objects.
 *
 * Uses hledger register command to get detailed transaction history,
 * limited to the most recent entries for performance.
 *
 * @private
 * @returns {void}
 *
 * @example
 * Raw hledger register output:
 * ```
 * "txnidx","date","code","desc","account","amount","total"
 * "1","2024-01-15","","Grocery Store","Expenses:Food","$45.67","$45.67"
 * "2","2024-01-16","","Salary","Income:Job","$-2000.00","$-1954.33"
 * ```
 *
 * Gets parsed into TransactionData objects with proper field mapping.
 */
export const recentTransactions = async (
  baseCmd: string,
): Promise<TransactionData[]> => {
  // hledger reg ^Income ^Expenses --output-format csv
  const cmd = `${baseCmd} reg ^Income ^Expenses --output-format csv`;

  try {
    const out = await execAsync(`${CMD.bash} -c '${cmd} | tail -n 20'`);
    if (!out) return [];

    try {
      return LedgerCSVParser.registerTransactions(out);
    } catch (parseError) {
      console.error(`Failed to parse recent transactions:`, parseError);
      console.error(`Raw hledger output:`, out);
      return [];
    }
  } catch (err) {
    console.error(`Failed to fetch recent transactions:`, err);
    return [];
  }
};
