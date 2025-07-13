/* █░█ █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█ */
/* █▀█ █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄ */

/* Service for interfacing with hledger.
 * NOTE: This will be refactored as part of issue auriga-27 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property } from "astal/gobject";
import { execAsync } from "astal/process";
import Gio from "gi://Gio";

import { log } from "@/globals.ts";

import UserConfig from "../../userconfig.js";
import { Binding } from "astal";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const CSV = " --output-format csv ";
const BALANCE_TREND_CACHEFILE = "/tmp/ags/ledgerbal";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const INCLUDES = UserConfig.ledger.includes
  .map((file: string) => `-f "${file.replace(/"/g, '\\"')}"`)
  .join(" ");

/*****************************************************************************
 * Types/interfaces
 *****************************************************************************/

export interface DebtItem {
  desc: string;
  total: number;
}

export interface CategorySpend {
  subtotal: number;
  subcategories: Record<string, CategorySpend>;
}

// { "2025-01": CategorySpend, "2025-02": CategorySpend, ... }
type MonthlySpending = Record<string, CategorySpend>;

type CategoryTotals = Record<string, number[]>; // { "Food": [JanTotal, FebTotal, ...], "Transport": [...] }

// REWRITTEN INTERFACES ----------------------------

/**
 * Represents spending data for a single category.
 * @interface
 */
interface CategorySpending {
  category: string;
  total: number;
}

/**
 * @interface
 */
export interface AccountConfig {
  accountName: string;
  displayName: string;
}

/**
 * @interface
 */
export interface Account {
  displayName: string;
  total: Number | Binding<Number>;
}

export interface TransactionData {
  txnidx: string;
  date: string;
  code: string;
  desc: string;
  account: string;
  amount: string;
  total: string;
}

/**
 * Define types for data parsed from a line from `hledger register` CSV output.
 * @interface
 * @name HLedgerRegisterRow
 */
interface HLedgerRegisterRow {
  txnidx: string;
  date: string;
  code: string;
  desc: string;
  account: string;
  amount: string;
  total: string;
}

/**
 * Order of fields in a line from `hledger register` CSV output.
 * @enum
 * @name HLedgerRegisterFields
 */
enum HLedgerRegisterFields {
  txnidx,
  date,
  code,
  desc,
  account,
  amount,
  total,
  LENGTH,
}

/**
 * CSV output format for hledger `balance` and `balancesheet` commands.
 * @interface
 */
interface HLedgerBalanceRow {
  account: string;
  balance: string;
}

/**
 * Enum for CSV output of hledger `balance` and `balancesheet` commands.
 * @interface
 */
enum HLedgerBalanceFields {
  account,
  balance,
}

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

const deepMergeCategories = (
  node1: CategorySpend,
  node2: CategorySpend,
): CategorySpend => {
  const mergedSubcategories = { ...node1.subcategories };

  for (const key in node2.subcategories) {
    if (mergedSubcategories[key]) {
      mergedSubcategories[key] = deepMergeCategories(
        mergedSubcategories[key],
        node2.subcategories[key],
      );
    } else {
      mergedSubcategories[key] = node2.subcategories[key];
    }
  }

  return {
    subtotal: node1.subtotal + node2.subtotal,
    subcategories: mergedSubcategories,
  };
};

const stringToCategorySpend = (
  input: string,
  subtotal: number,
): CategorySpend => {
  const parts = input.split(":");

  const obj: CategorySpend = {
    subcategories: {},
    subtotal: 0,
  };

  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    current.subcategories[part] =
      current.subcategories[part] ||
      ({ subcategories: {}, subtotal: 0 } as CategorySpend);

    current = current.subcategories[part] as CategorySpend;
  }

  current.subtotal = subtotal;

  return obj;
};

const recursiveSubtotalSum = (category: CategorySpend): number => {
  const subtotal =
    category.subtotal +
    Object.values(category.subcategories).reduce(
      (sum, child) => sum + recursiveSubtotalSum(child),
      0,
    );

  category.subtotal = subtotal;

  return subtotal ?? 0;
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

    this.initAll();
  }

  /**
   * Initialize the service's data.
   */
  initAll() {
    this.#initAccountData();
    this.#initNetWorth();
    this.#initMonthlyTotals();
    this.#initDebtItems();
    this.#initCategorySpending();
    this.#initRecentTransactions();
    this.#initBalanceTrends();
    this.#initSpendingAnalysis();
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
      const cmd = `hledger ${INCLUDES} bs -X '$' --infer-market-prices --depth 0 --output-format csv --daily`;

      execAsync(`bash -c "${cmd} | tail -n 1 | tee ${BALANCE_TREND_CACHEFILE}"`)
        .then((out) => {
          try {
            this.balancesOverTime = this.#parseBalanceTrendCSV(out);
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
            this.balancesOverTime = this.#parseBalanceTrendCSV(out);
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

  /**
   * Initialize account balance data for accounts defined in UserConfig.
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
  #initAccountData() {
    // Build hledger commands for each account
    const commands = UserConfig.ledger.accountList.map(
      (accountData: AccountConfig) => {
        // use `--infer-market-prices -X '$'` to convert shares to $
        return `hledger ${INCLUDES} balance "${accountData.accountName}" ${CSV} -X "$" --infer-market-prices`;
      },
    );

    // Execute all commands in parallel
    const promises = commands.map(async (cmd: string) => {
      return execAsync(`bash -c '${cmd}'`);
    });

    Promise.all(promises)
      .then((results) => {
        const tmpAccountData: Array<Account> = [];

        // Process each account's result
        for (let i = 0; i < UserConfig.ledger.accountList.length; i++) {
          const accountConfig = UserConfig.ledger.accountList[i];

          try {
            const balanceRows = this.parseBalanceCSV(results[i]);

            if (balanceRows.length === 0) {
              console.warn(
                `No balance data found for account: ${accountConfig.displayName}`,
              );
              tmpAccountData.push({
                displayName: accountConfig.displayName,
                total: 0,
              });
              continue;
            }

            // Get the total row (should be the last row)
            const totalRow =
              balanceRows.find((row) => row.account === "total") ||
              balanceRows[balanceRows.length - 1];

            const balance = this.parseAmount(totalRow.balance);

            const output: Account = {
              displayName: accountConfig.displayName,
              total: balance,
            };

            tmpAccountData.push(output);
          } catch (parseError) {
            console.error(
              `Failed to parse balance data for account ${accountConfig.displayName}:`,
              parseError,
            );

            // Add account with 0 balance as fallback to prevent UI breakage
            tmpAccountData.push({
              displayName: accountConfig.displayName,
              total: 0,
            });
          }
        }

        // Update the property with all results
        this.accountData = tmpAccountData;

        log(
          "ledgerService",
          `#initAccountData: Successfully loaded ${tmpAccountData.length} account balances`,
        );
      })
      .catch((err) => {
        console.error(`Failed to fetch account data:`, err);

        // Set empty array as fallback to prevent UI crashes
        this.accountData = [];
      });
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
    const cmd = `hledger ${INCLUDES} bs --depth 0 -X '$' --infer-market-prices ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        try {
          const balanceRows = this.parseBalanceCSV(out);

          if (balanceRows.length === 0) {
            throw new Error("No balance sheet data returned from hledger");
          }

          // The net worth is in the last row
          const netWorthRow = balanceRows[balanceRows.length - 1];
          const netWorth = this.parseAmount(netWorthRow.balance);

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
    const cmd = `hledger ${INCLUDES} bal ^Income ^Expenses --depth 1 -X '$' --infer-market-price ${CSV} --no-total -b ${startDate}`;

    execAsync(`bash -c '${cmd}' | tail -n -2`).then((out) => {
      try {
        const balanceRows = this.parseBalanceCSV(out);

        balanceRows.forEach((row) => {
          const accountName = row.account.toLowerCase();
          const absoluteAmount = Math.abs(this.parseAmount(row.balance));

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
    const cmd = `hledger ${INCLUDES} register Reimbursements Liabilities --pending ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        try {
          this.debtItems = this.#parseDebtsLiabilitiesCSV(out);
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
    const cmd = `hledger ${INCLUDES} bal Expenses --begin ${startDate} --no-total --depth 2 ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        try {
          this.monthlyCategorySpending = this.#parseCategorySpendingCSV(out);
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
        try {
          this.transactions = this.#parseRegisterTransactionsCSV(out);
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

          const categorySpend = stringToCategorySpend(category, amount);

          if (rawCategory == "total") {
            total = amount;
          } else {
            tmp = deepMergeCategories(tmp, categorySpend);
          }
        });

        recursiveSubtotalSum(tmp);

        tmp.subtotal = total;

        return tmp;
      })
      .catch((err) =>
        print(`calculateMonthlySpend (${first} - ${last}): ${err}`),
      );
  };

  // Private helper functions --------------------------------------------------

  /**
   * Parses a monetary amount string into a numeric value.
   * Handles various currency symbols and formatting.
   *
   * @param amountStr - String representation of monetary amount (e.g., "$1,234.56", "€500.00")
   * @returns Numeric value of the amount, or 0 if parsing fails
   */
  parseAmount(amountStr: string): number {
    if (!amountStr || typeof amountStr !== "string") {
      return 0;
    }

    const cleaned = amountStr.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);

    if (isNaN(parsed)) {
      console.warn(`Failed to parse amount: "${amountStr}"`);
      return 0;
    }

    return parsed;
  }

  /**
   * Parses CSV output from hledger balance command into structured data.
   *
   * @param csvOutput - Raw CSV string from hledger balance command
   * @returns Array of parsed balance rows
   * @throws {Error} When CSV output is invalid or malformed
   */
  parseBalanceCSV(csvOutput: string): Array<HLedgerBalanceRow> {
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
  }

  /**
   * Parses CSV output from hledger daily balance sheet command.
   * The --daily flag outputs a single row with all daily balances as comma-separated values.
   *
   * @param csvOutput - Single CSV row with daily balance amounts
   * @returns Array of numeric balance values for each day
   * @throws {Error} When CSV output is invalid or malformed
   *
   * @private
   *
   * @example
   * Input: `"Net:","$4199.26","$4087.17","$1454.35"`
   * Output: [4199.26, 4087.17, 1454.35]
   */
  #parseBalanceTrendCSV(csvOutput: string): Array<number> {
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
      const balance = this.parseAmount(amountStr);

      if (isNaN(balance)) {
        console.warn(
          `Invalid balance amount at position ${index + 1}: "${amountStr}"`,
        );
        return 0;
      }

      return balance;
    });
  }

  /**
   * Parses CSV output from hledger register command into TransactionData objects.
   * Maps CSV fields using the HLedgerRegCSV enum to proper object properties.
   *
   * @param csvOutput - Raw CSV string from hledger register command
   * @returns Array of parsed transaction objects
   * @throws {Error} When CSV output is invalid or malformed
   *
   * @private
   *
   * @example
   * Input CSV row: `"1","2024-01-15","","Store","Expenses:Food","$45.67","$45.67"`
   * Output object: `{ txnidx: "1", date: "2024-01-15", desc: "Store", ... }`
   */
  #parseRegisterTransactionsCSV(csvOutput: string): Array<TransactionData> {
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
  }

  /**
   * Parses CSV output from hledger register command for debts and liabilities.
   * Groups transactions by account and creates DebtItem objects.
   *
   * @param csvOutput - Raw CSV string from hledger register --pending command
   * @returns Object with accounts as keys and arrays of debt/liability transactions as values
   * @throws {Error} When CSV output is invalid or malformed
   *
   * @private
   */
  #parseDebtsLiabilitiesCSV(csvOutput: string): Record<string, DebtItem[]> {
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

      const amount = this.parseAmount(amountStr);

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
  }

  /**
   * Parses CSV output from hledger balance command for category spending data.
   * Extracts category names from account paths and converts amounts to numbers.
   *
   * @param csvOutput - Raw CSV string from hledger balance Expenses command
   * @returns Array of category spending objects
   * @throws {Error} When CSV output is invalid or malformed
   *
   * @private
   *
   * @example
   * Input: `"Expenses:Food","$450.00"`
   * Output: `{ category: "Food", total: 450.00 }`
   */
  #parseCategorySpendingCSV(csvOutput: string): Array<CategorySpending> {
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
        const amount = this.parseAmount(amountStr);

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
  }
}
