/**
 * █░█ █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█
 * █▀█ █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄
 *
 * Service for interfacing with hledger.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal/process";
import { GObject, register, property, GLib } from "astal/gobject";
import SettingsManager from "../settings";
import LedgerQuery from "./queries";

import {
  Account,
  DebtItem,
  TransactionData,
  CategorySpending,
  CashFlow,
} from "./Types";
import { CMD } from "@/utils/Commands";
import { dummyLedgerData } from "./DummyData";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerConfig = SettingsManager.get_default().config.dashLedger;

const BALANCE_TREND_CACHEFILE = `${GLib.get_user_cache_dir()}/astal/ledgerbal`;

const INCLUDES = ledgerConfig.includes
  .map((file: string) => `-f "${file.replace(/"/g, '\\"')}"`)
  .join(" ");

/*****************************************************************************
 * Enums/interfaces
 *****************************************************************************/

/** All data used by the ledger interface. */
interface LedgerData {
  balancesOverTime: number[];
  accountData: Account[];
  recentTransactions: TransactionData[];
  debtsAndLoans: Record<string, DebtItem[]>;
  recentCategorySpending: CategorySpending[];
  recentIncome: number;
  recentExpenses: number;
  netWorth: number;
  monthlySpendingByCategory: Object;
}

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

  // Private variables ---------------------------------------------------------
  #hledgerCmd: string = `${CMD.hledger} ${INCLUDES} `;

  // Real and fake ledger data
  private realData: LedgerData;
  private fakeData: LedgerData;

  private _obfuscate: boolean = true;

  // Properties ----------------------------------------------------------------

  /** Whether to obfuscate ledger data */
  @property(Boolean)
  get obfuscate() {
    return this._obfuscate;
  }

  set obfuscate(doObfuscate: boolean) {
    const target = doObfuscate ? this.fakeData : this.realData;

    this.accountData = target.accountData;
    this.netWorth = target.netWorth;
    this.recentIncome = target.recentIncome;
    this.recentExpenses = target.recentExpenses;
    this.debtsAndLoans = target.debtsAndLoans;
    this.recentTransactions = target.recentTransactions;
    this.recentCategorySpending = target.recentCategorySpending;
    this.balancesOverTime = target.balancesOverTime;
    this.monthlySpendingByCategory = target.monthlySpendingByCategory;

    this._obfuscate = doObfuscate;
    this.notify("obfuscate");
  }

  /**
   * Array of historical net worth values over time.
   * Each element represents the total net worth (assets minus liabilities)
   * for a specific date, sampled regular intervals.
   * Used in dashboard "FIRE" tab.
   */
  @property(Object)
  declare balancesOverTime: number[];

  /**
   * Array of financial accounts with their balances and metadata.
   * Used in dashboard "Overview" tab.
   */
  @property(Object)
  declare accountData: Account[];

  /**
   * List of recent financial transactions.
   * Ordered chronologically, showing the most recent N transactions
   * across all accounts.
   */
  @property(Object)
  declare recentTransactions: Array<TransactionData>;

  /**
   * Outstanding debts and liabilities.
   * key is the account name, value is an array containing all debts/liabilities
   * to/from that account.
   */
  @property(Object)
  declare debtsAndLoans: Record<string, Array<DebtItem>>;

  /**
   * Spending breakdown by category for the last 30 days.
   * Hierarchical structure of expense categories with their amounts,
   * used for visualizing recent spending distribution in pie charts.
   * Used in pie chart in dashboard ledger "Overview" tab.
   */
  @property(Object)
  declare recentCategorySpending: CategorySpending[];

  /** Income obtained in the last 30 days. */
  @property(Number)
  declare recentIncome: number;

  /** Expenses from the last 30 days. */
  @property(Number)
  declare recentExpenses: number;

  /** Total net worth. */
  @property(Number)
  declare netWorth: number;

  /** Monthly spending sorted by category for the last N months. */
  @property(Object)
  declare monthlySpendingByCategory: Object;

  // Private functions ---------------------------------------------------------
  constructor() {
    super();

    // Default values for real data
    this.realData = {
      accountData: [],
      netWorth: 0,
      recentIncome: 0,
      recentExpenses: 0,
      debtsAndLoans: {},
      recentTransactions: [],
      recentCategorySpending: [],
      balancesOverTime: [],
      monthlySpendingByCategory: {
        subcategories: {},
        subtotal: [0],
      },
    };

    // Default values for fake data
    this.fakeData = dummyLedgerData;

    // Display obfuscated ledger data on startup
    // A keybind toggles obfuscate state (obfusc-state?)
    this.obfuscate = true;

    this.initRealData();
  }

  /** Initialize the service's data. */
  async initRealData() {
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
    this.#initRecentCategorySpending();
    this.#initRecentTransactions();
    this.#initBalanceTrends();
    this.#initSpendingAnalysis();
  }

  async #testIncludeFilesExist(): Promise<boolean> {
    const cmd = `${CMD.hledger} files ${INCLUDES}`;

    try {
      await execAsync(cmd);
      return true;
    } catch {
      return false;
    }
  }

  async #initAccountData() {
    this.realData.accountData = await LedgerQuery.accountData(
      this.#hledgerCmd,
      ledgerConfig.accountList,
    );
  }

  async #initNetWorth() {
    this.realData.netWorth = await LedgerQuery.netWorth(this.#hledgerCmd);
  }

  async #initMonthlyCashFlow() {
    const monthlyCashFlow: CashFlow = await LedgerQuery.monthlyCashFlow(
      this.#hledgerCmd,
    );

    this.realData.recentIncome = monthlyCashFlow.income;
    this.realData.recentExpenses = monthlyCashFlow.expenses;
  }

  async #initDebts() {
    this.realData.debtsAndLoans = await LedgerQuery.debtsLoans(
      this.#hledgerCmd,
    );
  }

  async #initRecentCategorySpending() {
    this.realData.recentCategorySpending = await LedgerQuery.categorySpending(
      this.#hledgerCmd,
    );
  }

  async #initBalanceTrends() {
    this.realData.balancesOverTime = await LedgerQuery.balanceTrends(
      this.#hledgerCmd,
      BALANCE_TREND_CACHEFILE,
    );
  }

  async #initSpendingAnalysis() {
    this.realData.monthlySpendingByCategory =
      await LedgerQuery.spendingAnalysis(this.#hledgerCmd);
  }

  async #initRecentTransactions() {
    this.realData.recentTransactions = await LedgerQuery.recentTransactions(
      this.#hledgerCmd,
    );
  }
}
