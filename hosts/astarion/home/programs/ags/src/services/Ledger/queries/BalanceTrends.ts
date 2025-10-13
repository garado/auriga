/**
 * █▄▄ ▄▀█ █░░ ▄▀█ █▄░█ █▀▀ █▀▀   ▀█▀ █▀█ █▀▀ █▄░█ █▀▄ █▀
 * █▄█ █▀█ █▄▄ █▀█ █░▀█ █▄▄ ██▄   ░█░ █▀▄ ██▄ █░▀█ █▄▀ ▄█
 *
 * Query balance trend data over time using hledger's daily balance sheet output.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync, Gio } from "astal";
import LedgerCSVParser from "../Parsing";

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Fetch all balance trends from hledger using the --daily flag.
 * hledger bs -X '$' --infer-market-prices --depth O --output-format csv --daily
 */
const fetchBalanceTrendFromLedger = async (
  baseCmd: string,
  cachefile: string,
): Promise<number[]> => {
  const cmd = `${baseCmd} bs -X '$' --infer-market-prices --depth 0 --output-format csv --daily`;

  try {
    const out = await execAsync(`${cmd} | tail -n 1 | tee ${cachefile}`);

    try {
      return LedgerCSVParser.balanceTrend(out);
    } catch (parseError) {
      console.error(`Failed to parse balance trend data:`, parseError);
      return [];
    }
  } catch (err) {
    console.error(`Failed to fetch balance trends:`, err);
    return [];
  }
};

/**
 * Load balance trends from cached file.
 */
const fetchBalanceTrendFromFile = async (
  baseCmd: string,
  cachefile: string,
): Promise<number[]> => {
  const cmd = `cat ${cachefile}`;

  try {
    const out = await execAsync(`bash -c "${cmd}"`);

    try {
      return LedgerCSVParser.balanceTrend(out);
    } catch (parseErr) {
      console.error(`Failed to parse cached balance data:`, parseErr);
      throw parseErr;
    }
  } catch (err) {
    console.warn(
      `Balance trend cachefile read failed; fetching fresh data:`,
      err,
    );
    return await fetchBalanceTrendFromLedger(baseCmd, cachefile);
  }
};

/**
 * Initialize balance trend data over time using hledger's daily balance sheet output.
 * Uses a single hledger command with --daily flag to get daily net worth snapshots.
 *
 * The command outputs one CSV row per day with the net worth for that date.
 * Results are cached to file avoid expensive recalculation.
 *
 * @private
 * @returns {void}
 */
export const balanceTrends = async (
  baseCmd: string,
  cachefile: string,
): Promise<number[]> => {
  const cfile = Gio.File.new_for_path(cachefile);

  if (!cfile.query_exists(null)) {
    return await fetchBalanceTrendFromLedger(baseCmd, cachefile);
  } else {
    return await fetchBalanceTrendFromFile(baseCmd, cachefile);
  }
};
