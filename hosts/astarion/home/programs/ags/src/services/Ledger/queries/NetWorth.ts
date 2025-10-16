import { execAsync } from "astal";
import LedgerCSVParser from "../Parsing";
import LedgerUtils from "../Utils";
import { CMD } from "@/utils/Commands";

const CSV = " --output-format csv ";

/**
 * Calculate and update total net worth (assets minus liabilities).
 * Uses hledger's balance sheet command to get the net position.
 *
 * The balance sheet command returns CSV with account categories and their totals,
 * with the final row containing the net worth calculation.
 *
 * @private
 * @returns {void}
 *
 * @example
 * Raw hledger balance sheet output:
 * ```
 * "account","balance"
 * "Assets","$50000.00"
 * "Liabilities","$-10000.00"
 * "Net:","$40000.00"
 * ```
 *
 * The last row contains the net worth: $40,000
 */
export const netWorth = async (baseCmd: string): Promise<number> => {
  // Use balance sheet command:
  // `hledger bs --depth 0 -X '$' --infer-market-prices --output-format csv`
  // -X '$' converts all currencies to dollars; --infer-market-prices converts investments to dollars
  const cmd = `${baseCmd} bs --depth 0 -X '$' --infer-market-prices ${CSV}`;

  let netWorth = 0;

  try {
    const out = await execAsync(`${CMD.bash} -c '${cmd}'`);

    if (!out) return 0;

    try {
      const balanceRows = LedgerCSVParser.balance(out);

      if (balanceRows.length === 0) {
        throw new Error("No balance sheet data returned from hledger");
      }

      // The net worth is in the last row
      const netWorthRow = balanceRows[balanceRows.length - 1];
      const netWorth = LedgerUtils.parseAmount(netWorthRow.balance);

      if (isNaN(netWorth)) {
        throw new Error(`Invalid net worth value: ${netWorthRow.balance}`);
      }

      log("ledgerService", `Net worth updated: $${netWorth.toFixed(2)}`);

      return netWorth;
    } catch (parseError) {
      console.error(`Failed to parse net worth data:`, parseError);
      console.error(`Raw hledger output:`, out);
      return netWorth;
    }
  } catch (err) {
    console.error(`Failed to fetch net worth:`, err);
    return netWorth;
  }
};
