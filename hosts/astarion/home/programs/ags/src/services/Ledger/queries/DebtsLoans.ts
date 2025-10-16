/**
 * █▀▄ █▀▀ █▄▄ ▀█▀ █▀   ▄▀█ █▄░█ █▀▄   █░░ █▀█ ▄▀█ █▄░█ █▀
 * █▄▀ ██▄ █▄█ ░█░ ▄█   █▀█ █░▀█ █▄▀   █▄▄ █▄█ █▀█ █░▀█ ▄█
 *
 * Query pending debts and loans/liabilities from uncleared transactions.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import LedgerCSVParser from "../Parsing";
import { DebtItem } from "../Types";
import { CMD } from "@/utils/Commands";

/*****************************************************************************
 * Function definition
 *****************************************************************************/

/**
 * Load pending debts and liabilities from uncleared transactions.
 *
 * This function is specific to a personal hledger workflow where:
 * - Credit card liabilities are never marked as pending/cleared
 * - Interpersonal debts (money owed to/from people) are marked as pending
 * - When debts are paid back, they get cleared
 *
 * Only fetches pending (uncleared) transactions to show outstanding debts.
 * Groups transactions by account to show who owes what.
 *
 * @private
 * @returns {void}
 *
 * @example
 * Raw hledger register output:
 * ```
 * "1","2024-01-15","","Lunch split","Liabilities:John","$15.00","$15.00"
 * "2","2024-01-16","","Gas money","Reimbursements:Work","$25.00","$40.00"
 * ```
 *
 * Gets grouped into:
 * ```typescript
 * {
 *   "Liabilities:John": [{ desc: "Lunch split", total: 15.00 }],
 *   "Reimbursements:Work": [{ desc: "Gas money", total: 25.00 }]
 * }
 * ```
 */

export const debtsLoans = async (
  baseCmd: string,
): Promise<Record<string, DebtItem[]>> => {
  // hledger register Reimbursements Liabilities --pending --output-format csv
  const cmd = `${baseCmd} register Reimbursements Liabilities --pending --output-format csv`;

  const fallback: Record<string, DebtItem[]> = {};

  try {
    const out = await execAsync(`${CMD.bash} -c '${cmd}'`);
    return LedgerCSVParser.debtsLoans(out);
  } catch (err) {
    console.error(`Failed to fetch debts/liabilities:`, err);
    return fallback;
  }
};
