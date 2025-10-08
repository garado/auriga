/**
 * █▀▀ ▄▀█ ▀█▀ █▀▀ █▀▀ █▀█ █▀█ █▄█   █▀ █▀█ █▀▀ █▄░█ █▀▄ █ █▄░█ █▀▀
 * █▄▄ █▀█ ░█░ ██▄ █▄█ █▄█ █▀▄ ░█░   ▄█ █▀▀ ██▄ █░▀█ █▄▀ █ █░▀█ █▄█
 *
 * Query spending breakdown by category for the current month.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import LedgerCSVParser from "../Parsing";
import { CategorySpending } from "../Types";

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Load spending breakdown by category for the current month.
 * Fetches expense data at depth 2 to get subcategories (e.g., "Food", "Transport")
 * and calculates totals for pie chart visualization.
 *
 * Uses --depth 2 to get meaningful subcategories without too much detail,
 * and --no-total to exclude the summary total row.
 *
 * @private
 * @returns {void}
 *
 * @example
 * Raw hledger balance output:
 * ```
 * "account","balance"
 * "Expenses:Food","$450.00"
 * "Expenses:Transport","$120.00"
 * "Expenses:Entertainment","$80.00"
 * ```
 *
 * Gets transformed into:
 * ```typescript
 * [
 *   { category: "Food", total: 450.00 },
 *   { category: "Transport", total: 120.00 },
 *   { category: "Entertainment", total: 80.00 }
 * ]
 * ```
 */
export const categorySpending = async (
  baseCmd: string,
): Promise<CategorySpending[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 30 days ago in YYYY-MM-DD format
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

  // hledger bal Expenses --no-total --depth 2 --output-format csv --begin monthStart
  const cmd = `${baseCmd} bal Expenses --begin ${startDate} --no-total --depth 2 --output-format csv`;

  try {
    const out = await execAsync(`bash -c '${cmd}'`);
    return LedgerCSVParser.categorySpending(out);
  } catch (err) {
    console.error(`Failed to fetch category spending:`, err);
    return [];
  }
};
