/**
 * ▄▀█ █▀▀ █▀▀ █▀█ █░█ █▄░█ ▀█▀   █▀▄ ▄▀█ ▀█▀ ▄▀█
 * █▀█ █▄▄ █▄▄ █▄█ █▄█ █░▀█ ░█░   █▄▀ █▀█ ░█░ █▀█
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import { Account, AccountConfig } from "../Types";
import LedgerCSVParser from "../Parsing";
import LedgerUtils from "../Utils";
import { CMD } from "@/utils/Commands";

const CSV = " --output-format csv ";

/*****************************************************************************
 * Function definition
 *****************************************************************************/

/**
 * Initialize account balance data for accounts defined in an account configuration.
 * Fetches current balances from hledger and converts them to display format.
 *
 * This method:
 * 1. Builds hledger balance commands for each configured account
 * 2. Executes commands in parallel
 * 3. Parses CSV output and converts to Account format
 * 4. Updates the accountData property with results
 *
 * @private
 * @returns void
 *
 * @example
 * Raw hledger output for each account:
 * ```
 * "account","balance"
 * "Assets:Checking","$11064.66"
 * "total","$11064.66"
 * ```
 *
 * Gets transformed into:
 * ```typescript
 * {
 *   displayName: "Checking Account",
 *   total: 11064.66
 * }
 * ```
 */
export const accountData = async (
  baseCmd: string,
  accountList: AccountConfig[],
): Promise<Account[]> => {
  // Build hledger commands for each account
  const commands = accountList.map((accountData: AccountConfig) => {
    // use `--infer-market-prices -X '$'` to convert shares to $
    return `${baseCmd} balance "${accountData.accountName}" ${CSV} -X "$" --infer-market-prices`;
  });

  // Execute all commands in parallel
  const promises = commands.map(async (cmd: string) => {
    return execAsync(`${CMD.bash} -c '${cmd}'`);
  });

  return Promise.all(promises)
    .then((results) => {
      const accountData: Account[] = [];

      // Process each account's result
      for (let i = 0; i < accountList.length; i++) {
        const accountConfig = accountList[i];

        try {
          const balanceRows = LedgerCSVParser.balance(results[i]);

          if (balanceRows.length === 0) {
            console.warn(
              `No balance data found for account: ${accountConfig.displayName}`,
            );
            accountData.push({
              displayName: accountConfig.displayName,
              total: 0,
            });
            continue;
          }

          // Get the total row (should be the last row)
          const totalRow =
            balanceRows.find((row) => row.account === "total") ||
            balanceRows[balanceRows.length - 1];

          const balance = LedgerUtils.parseAmount(totalRow.balance);

          const output: Account = {
            displayName: accountConfig.displayName,
            total: balance,
          };

          accountData.push(output);
        } catch (parseError) {
          console.error(
            `Failed to parse balance data for account ${accountConfig.displayName}:`,
            parseError,
          );

          // Add account with 0 balance as fallback to prevent UI breakage
          accountData.push({
            displayName: accountConfig.displayName,
            total: 0,
          });
        }
      }

      log(
        "ledgerService",
        `accountData: Successfully loaded ${accountData.length} account balances`,
      );

      return accountData;
    })
    .catch((err) => {
      console.error(`Failed to fetch account data:`, err);
      return [];
    });
};
