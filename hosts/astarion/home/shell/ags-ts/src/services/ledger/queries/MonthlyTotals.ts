/**
 * █▀▄▀█ █▀█ █▄░█ ▀█▀ █░█ █░░ █▄█   █▀▀ ▄▀█ █▀ █░█   █▀▀ █░░ █▀█ █░█░█
 * █░▀░█ █▄█ █░▀█ ░█░ █▀█ █▄▄ ░█░   █▄▄ █▀█ ▄█ █▀█   █▀░ █▄▄ █▄█ ▀▄▀▄▀
 *
 * Query income and expenses for the last 30 days.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import LedgerCSVParser from "../Parsing";
import LedgerUtils from "../Utils";
import { CashFlow } from "../Types";
import { CMD } from "@/utils/Commands";

const CSV = " --output-format csv ";

/*****************************************************************************
 * Function definition
 *****************************************************************************/

/**
 * Query income and expenses for the last 30 days.
 *
 * Uses hledger balance command with --depth 1 to get only top-level categories,
 * filtered to the current month using --begin parameter.
 *
 * @private
 * @returns {void}
 */
export const monthlyCashFlow = async (baseCmd: string): Promise<CashFlow> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 30 days ago in YYYY-MM-DD format
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

  // hledger bal ^Income ^Expenses --depth 1 -X '$' --infer-market-price --output-format csv --no-total -b ${startDate}
  const cmd = `${baseCmd} bal ^Income ^Expenses --depth 1 -X '$' --infer-market-price ${CSV} --no-total -b ${startDate}`;

  let monthlyCashFlow: CashFlow = { income: 0, expenses: 0 };

  try {
    const out = await execAsync(`${CMD.bash} -c '${cmd}' | tail -n -2`);
    const balanceRows = LedgerCSVParser.balance(out);

    balanceRows.forEach((row) => {
      const accountName = row.account.toLowerCase();
      const absoluteAmount = Math.abs(LedgerUtils.parseAmount(row.balance));

      if (accountName.includes("income")) {
        monthlyCashFlow.income = absoluteAmount;
      } else if (accountName.includes("expenses")) {
        monthlyCashFlow.expenses = absoluteAmount;
      }
    });

    return monthlyCashFlow;
  } catch (err) {
    console.error(`Failed to parse monthly income/expenses data:`, err);

    monthlyCashFlow.income = 0;
    monthlyCashFlow.expenses = 0;
    return monthlyCashFlow;
  }
};
