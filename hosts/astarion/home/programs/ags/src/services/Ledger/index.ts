/**
 * █░█ █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█
 * █▀█ █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄
 *
 * Service for interfacing with hledger.
 * NOTE: This will be refactored as part of issue auriga-27
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property, GLib } from "astal/gobject";
import { execAsync } from "astal/process";
import Gio from "gi://Gio";

import { log } from "@/globals.ts";

import SettingsManager from "../settings";

import {
  Account,
  DebtItem,
  CategorySpend,
  TransactionData,
  CategorySpending,
  MonthlySpending,
} from "./Types";

import LedgerCSVParser from "./Parsing";
import LedgerUtils from "./Utils";
import LedgerQuery from "./queries";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerConfig = SettingsManager.get_default().config.dashLedger;

const CSV = " --output-format csv ";

const BALANCE_TREND_CACHEFILE = `${GLib.get_user_cache_dir()}/astal/ledgerbal`;

const INCLUDES = ledgerConfig.includes
  .map((file: string) => `-f "${file.replace(/"/g, '\\"')}"`)
  .join(" ");

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

const getLastNMonthsDays = (n: number) => {
  const now = new Date();
  const result = [];

  for (let i = 0; i < n; i++) {
    let month = now.getMonth() - i;

    const year = month < 1 ? now.getFullYear() - 1 : now.getFullYear();

    month = month < 1 ? 12 + month : month;

    const d = new Date(year, month, 1);

    const firstDay =
      `${d.getFullYear()}` +
      "-" +
      `${d.getMonth() + 1}`.padStart(2, "0") +
      "-" +
      `${d.getDate()}`.padStart(2, "0");

    d.setMonth(d.getMonth() + 1);

    d.setDate(0); // Last day of previous month

    const lastDay =
      `${d.getFullYear()}` +
      "-" +
      `${d.getMonth() + 1}`.padStart(2, "0") +
      "-" +
      `${d.getDate()}`.padStart(2, "0");

    result.push({ first: firstDay, last: lastDay });
  }

  return result.reverse();
};

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "Ledger" })
export default class Ledger extends GObject.Object {
  // Singleton -----------------------------------------------------------------
  static instance: Ledger;

  static get_default() {
    if (!this.instance) {
      this.instance = new Ledger();
    }

    return this.instance;
  }

  // Properties ----------------------------------------------------------------
  @property(Object)
  declare balancesOverTime: Array<Number>;

  @property(Object)
  declare accountData: Array<Account>;

  @property(Object)
  declare transactions: Array<TransactionData>;

  @property(Object)
  declare debtItems: Record<string, Array<DebtItem>>;

  @property(Object)
  declare monthlyCategorySpending: Array<CategorySpending>;

  @property(Number)
  declare incomeThisMonth: Number;

  @property(Number)
  declare expensesThisMonth: Number;

  @property(Number)
  declare netWorth: Number;

  @property(Object)
  declare monthlySpendingByCategory: Object;

  // Private main functions ----------------------------------------------------
  constructor() {
    super();

    // Default values
    this.accountData = [];
    this.netWorth = 0;
    this.incomeThisMonth = 0;
    this.expensesThisMonth = 0;
    this.debtItems = {};
    this.monthlyCategorySpending = [];
    this.balancesOverTime = [];
    this.monthlySpendingByCategory = {
      subcategories: {},
      subtotal: [0],
    };

    // Check if hledger files are even there
    // If not, skip all of init

    this.initAll();
  }

  /**
   * Initialize the service's data.
   */
  async initAll() {
    if (!(await this.#testIncludeFilesExist())) {
      console.warn(
        "Could not find hledger files; aborting hledger service init",
      );

      return;
    }

    this.#initAccountData();
    this.#initNetWorth();
    this.#initMonthlyTotals();
    this.#initDebtItems();
    this.#initCategorySpending();
    this.#initRecentTransactions();
    this.#initBalanceTrends();
    this.#initSpendingAnalysis();
  }

  hledgerCmd = () => {
    return `hledger ${INCLUDES} `;
  };

  async #testIncludeFilesExist(): Promise<boolean> {
    const cmd = `hledger files ${INCLUDES}`;

    try {
      await execAsync(cmd);
      return true;
    } catch {
      return false;
    }
  }

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
  #initBalanceTrends(): void {
    log("ledgerService", "#initBalanceTrends");

    /**
     * Fetch all balance trends from hledger using the --daily flag.
     * hledger bs -X '$' --infer-market-prices --depth O --output-format csv --daily
     */
    const fetchAllFromLedger = () => {
      const cmd = `${this.hledgerCmd()} bs -X '$' --infer-market-prices --depth 0 --output-format csv --daily`;

      execAsync(`bash -c "${cmd} | tail -n 1 | tee ${BALANCE_TREND_CACHEFILE}"`)
        .then((out) => {
          try {
            this.balancesOverTime = LedgerCSVParser.balanceTrend(out);
            log(
              "ledgerService",
              `Loaded ${this.balancesOverTime.length} daily balance data points`,
            );
          } catch (parseError) {
            console.error(`Failed to parse balance trend data:`, parseError);
            this.balancesOverTime = [];
          }
        })
        .catch((err) => {
          console.error(`Failed to fetch balance trends:`, err);
          this.balancesOverTime = [];
        });
    };

    /**
     * Load balance trends from cached file.
     */
    const fetchFromFile = () => {
      const cmd = `cat ${BALANCE_TREND_CACHEFILE}`;

      execAsync(cmd)
        .then((out) => {
          try {
            this.balancesOverTime = LedgerCSVParser.balanceTrend(out);
            log(
              "ledgerService",
              `Loaded ${this.balancesOverTime.length} cached balance data points`,
            );
          } catch (parseError) {
            console.error(`Failed to parse cached balance data:`, parseError);
            // If cache is corrupted, fetch fresh data
            fetchAllFromLedger();
          }
        })
        .catch((err) => {
          console.warn(`Cache file read failed, fetching fresh data:`, err);
          fetchAllFromLedger();
        });
    };

    // Check if cache file exists
    const cfile = Gio.File.new_for_path(BALANCE_TREND_CACHEFILE);
    if (!cfile.query_exists(null)) {
      fetchAllFromLedger();
    } else {
      fetchFromFile();
    }
  }

  async #initAccountData() {
    this.accountData = await LedgerQuery.accountData(
      this.hledgerCmd(),
      ledgerConfig.accountList,
    );
  }

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
  #initNetWorth(): void {
    log("ledgerService", "#initNetWorth");

    // Use balance sheet command:
    // `hledger bs --depth 0 -X '$' --infer-market-prices --output-format csv`
    // -X '$' converts all currencies to dollars; --infer-market-prices converts investments to dollars
    const cmd = `${this.hledgerCmd()} bs --depth 0 -X '$' --infer-market-prices ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        if (!out) return;

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

          this.netWorth = netWorth;
          log("ledgerService", `Net worth updated: $${netWorth.toFixed(2)}`);
        } catch (parseError) {
          console.error(`Failed to parse net worth data:`, parseError);
          console.error(`Raw hledger output:`, out);

          // Keep previous value or set to 0 if first time
          if (this.netWorth === undefined) {
            this.netWorth = 0;
          }
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch net worth:`, err);

        // Keep previous value or set to 0 if first time
        if (this.netWorth === undefined) {
          this.netWorth = 0;
        }
      });
  }

  /**
   * Initialize monthly income and expenses for the last 30 days.
   *
   * Uses hledger balance command with --depth 1 to get only top-level categories,
   * filtered to the current month using --begin parameter.
   *
   * @private
   * @returns {void}
   */
  #initMonthlyTotals(): void {
    log("ledgerService", "#initMonthlyTotals");

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 30 days ago in YYYY-MM-DD format
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

    // hledger bal ^Income ^Expenses --depth 1 -X '$' --infer-market-price --output-format csv --no-total -b ${startDate}
    const cmd = `${this.hledgerCmd()} bal ^Income ^Expenses --depth 1 -X '$' --infer-market-price ${CSV} --no-total -b ${startDate}`;

    execAsync(`bash -c '${cmd}' | tail -n -2`).then((out) => {
      try {
        const balanceRows = LedgerCSVParser.balance(out);

        balanceRows.forEach((row) => {
          const accountName = row.account.toLowerCase();
          const absoluteAmount = Math.abs(LedgerUtils.parseAmount(row.balance));

          if (accountName.includes("income")) {
            this.incomeThisMonth = absoluteAmount;
          } else if (accountName.includes("expenses")) {
            this.expensesThisMonth = absoluteAmount;
          }
        });
      } catch (error) {
        console.error(`Failed to parse monthly income/expenses data:`, error);
        console.error(`Raw hledger output:`, out);

        this.incomeThisMonth = 0;
        this.expensesThisMonth = 0;
      }
    });
  }

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
  #initDebtItems(): void {
    log("ledgerService", "#initDebtItems");

    // hledger register Reimbursements Liabilities --pending --output-format csv
    const cmd = `${this.hledgerCmd()} register Reimbursements Liabilities --pending ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        try {
          this.debtItems = LedgerCSVParser.debtsLiabilities(out);
        } catch (parseError) {
          console.error(`Failed to parse debts/liabilities data:`, parseError);
          console.error(`Raw hledger output:`, out);

          // Set empty object as fallback
          this.debtItems = {};
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch debts/liabilities:`, err);

        // Set empty object as fallback to prevent UI crashes
        this.debtItems = {};
      });
  }

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
  #initCategorySpending(): void {
    log("ledgerService", `#initCategorySpending`);

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 30 days ago in YYYY-MM-DD format
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

    // hledger bal Expenses --no-total --depth 2 --output-format csv --begin monthStart
    const cmd = `${this.hledgerCmd()} bal Expenses --begin ${startDate} --no-total --depth 2 ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        try {
          this.monthlyCategorySpending = LedgerCSVParser.categorySpending(out);
          // this.notify("monthly-category-spending");
        } catch (parseError) {
          console.error(`Failed to parse category spending data:`, parseError);
          console.error(`Raw hledger output:`, out);
          this.monthlyCategorySpending = [];
          // this.notify("monthly-category-spending");
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch category spending:`, err);
        this.monthlyCategorySpending = [];
        // this.notify("monthly-category-spending");
      });
  }

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
  #initRecentTransactions(): void {
    log("ledgerService", "#initRecentTransactions");

    // hledger reg ^Income ^Expenses --output-format csv
    const cmd = `hledger ${INCLUDES} reg ^Income ^Expenses ${CSV}`;

    execAsync(`bash -c '${cmd} | tail -n 20'`)
      .then((out) => {
        if (!out) return;

        try {
          this.transactions = LedgerCSVParser.registerTransactions(out);
          log(
            "ledgerService",
            `Loaded ${this.transactions.length} recent transactions`,
          );
        } catch (parseError) {
          console.error(`Failed to parse recent transactions:`, parseError);
          console.error(`Raw hledger output:`, out);
          this.transactions = [];
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch recent transactions:`, err);
        this.transactions = [];
      });
  }

  #initSpendingAnalysis = () => {
    const monthStrings = getLastNMonthsDays(3);

    const promises = monthStrings.map(async (monthStr) => {
      return this.#calculateMonthlySpend(monthStr.first, monthStr.last);
    });

    Promise.all(promises)
      .then((result) => {
        const spendingByMonth = {} as MonthlySpending;

        for (let i = 0; i < monthStrings.length; i++) {
          spendingByMonth[monthStrings[i].first] = result[i]!;
        }

        this.monthlySpendingByCategory =
          this.#aggregateMonthlySpendingByCategory(spendingByMonth);
      })
      .catch((err) => print(`initSpendingAnalysis: ${err}`));
  };

  /**
   * I have to be honest this was vibe coded
   */
  #aggregateMonthlySpendingByCategory = (
    monthlyData: MonthlySpending,
  ): CategorySpend => {
    const months = Object.keys(monthlyData).sort(); // Ensure chronological order
    const monthCount = months.length;

    function mergeNodes(
      category: string,
      index: number,
      node: SpendingNode,
      result: CategorySpend,
    ) {
      if (node === undefined) return;

      result.subtotal[index] = node.subtotal; // Set the correct month index

      for (const subcategory in node.subcategories) {
        if (!result.subcategories[subcategory]) {
          result.subcategories[subcategory] = {
            subtotal: new Array(monthCount).fill(0),
            subcategories: {},
          };
        }

        mergeNodes(
          subcategory,
          index,
          node.subcategories[subcategory],
          result.subcategories[subcategory],
        );
      }
    }

    const aggregated: CategorySpend = {
      subtotal: new Array(monthCount).fill(0),
      subcategories: {},
    };

    months.forEach((month, index) => {
      const rootNode = monthlyData[month];
      mergeNodes("root", index, rootNode, aggregated);
    });

    return aggregated;
  };

  /**
   * Initialize monthly spending for a single month.
   */
  #calculateMonthlySpend = async (first: string, last: string) => {
    const cmd = `hledger ${INCLUDES} -b ${first} -e ${last} bal ^Expenses ${CSV}`;

    return execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        const split = out.replaceAll('"', "").split("\n").slice(1);

        let tmp = {} as CategorySpend;
        let total = 0;

        split.map((line: string) => {
          const [rawCategory, rawAmount] = line.split(",");
          const category = rawCategory.replaceAll("Expenses:", "");
          const amount = Number(rawAmount.replace(/[^0-9,.]/g, ""));

          const categorySpend = LedgerUtils.stringToCategorySpend(
            category,
            amount,
          );

          if (rawCategory == "total") {
            total = amount;
          } else {
            tmp = LedgerUtils.deepMergeCategories(tmp, categorySpend);
          }
        });

        LedgerUtils.recursiveSubtotalSum(tmp);

        tmp.subtotal = total;

        return tmp;
      })
      .catch((err) =>
        print(`calculateMonthlySpend (${first} - ${last}): ${err}`),
      );
  };

  // Private helper functions --------------------------------------------------
}
