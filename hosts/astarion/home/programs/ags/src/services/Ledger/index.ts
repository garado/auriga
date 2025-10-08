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
  CashFlow,
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
  declare balancesOverTime: Number[];

  @property(Object)
  declare accountData: Array<Account>;

  @property(Object)
  declare transactions: Array<TransactionData>;

  @property(Object)
  declare debtItems: Record<string, Array<DebtItem>>;

  @property(Object)
  declare monthlyCategorySpending: CategorySpending[];

  @property(Number)
  declare incomeThisMonth: Number;

  @property(Number)
  declare expensesThisMonth: Number;

  @property(Number)
  declare netWorth: Number;

  @property(Object)
  declare monthlySpendingByCategory: Object;

  // Private functions ---------------------------------------------------------
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
  async initAll() {
    // Check if hledger files are even there. If not, skip all of init
    if (!(await this.#testIncludeFilesExist())) {
      console.warn(
        "Could not find hledger files; aborting hledger service init",
      );

      return;
    }

    this.#initAccountData();
    this.#initNetWorth();
    this.#initMonthlyCashFlow();
    this.#initDebts();
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

  async #initAccountData() {
    this.accountData = await LedgerQuery.accountData(
      this.hledgerCmd(),
      ledgerConfig.accountList,
    );
  }

  async #initNetWorth() {
    this.netWorth = await LedgerQuery.netWorth(this.hledgerCmd());
  }

  async #initMonthlyCashFlow() {
    const monthlyCashFlow: CashFlow = await LedgerQuery.monthlyCashFlow(
      this.hledgerCmd(),
    );

    this.incomeThisMonth = monthlyCashFlow.income;
    this.expensesThisMonth = monthlyCashFlow.expenses;
  }

  async #initDebts() {
    this.debtItems = await LedgerQuery.debtsLiabilities(this.hledgerCmd());
  }

  async #initCategorySpending() {
    this.monthlyCategorySpending = await LedgerQuery.categorySpending(
      this.hledgerCmd(),
    );
  }

  async #initBalanceTrends() {
    this.balancesOverTime = await LedgerQuery.balanceTrends(
      this.hledgerCmd(),
      BALANCE_TREND_CACHEFILE,
    );
  }

  async #initSpendingAnalysis() {
    this.monthlySpendingByCategory = await LedgerQuery.spendingAnalysis(
      this.hledgerCmd(),
    );
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
}
