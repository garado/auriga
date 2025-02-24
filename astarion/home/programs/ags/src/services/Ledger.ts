/* █░█ █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█ */
/* █▀█ █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄ */

import { GObject, register, property } from "astal/gobject";
import { GLib } from "astal";
import { execAsync } from "astal/process";
import Gio from "gi://Gio";
import UserConfig from "../../userconfig.js";

const INCLUDES = " -f /home/alexis/Enchiridion/self/ledger/2024/2024.ledger ";
const CSV = " --output-format csv ";
const BALANCE_TREND_CACHEFILE = "/tmp/ags/ledgerbal";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export type DisplayAccountProps = {
  displayName: string;
  total: Number | Binding<Number>;
};

export type DebtsLiabilitiesProps = {
  desc: string;
  total: string;
};

export type TransactionData = {
  txnidx: string;
  date: string;
  code: string;
  desc: string;
  account: string;
  amount: string;
  total: string;
};

/**********************************************
 * PRIVATE TYPEDEFS
 **********************************************/

/**
 * Order of fields from `hledger register` CSV output.
 */
enum HLedgerRegCSV {
  TxnIdx,
  Date,
  Code,
  Desc,
  Account,
  Amount,
  Total,
}

/**********************************************
 * UTILITY
 **********************************************/

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Ledger" })
export default class Ledger extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Ledger;

  static get_default() {
    if (!this.instance) {
      this.instance = new Ledger();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @property(Object)
  declare balancesOverTime: Array<Number>;

  @property(Object)
  declare displayAccounts: Array<DisplayAccountProps>;

  @property(Object)
  declare transactions: Array<TransactionData>;

  @property(Object)
  declare debtsLiabilities: Object;

  @property(Object)
  declare monthlyBreakdown: Object;

  @property(Number)
  declare incomeThisMonth: Number;

  @property(Number)
  declare expensesThisMonth: Number;

  @property(Number)
  declare netWorth: Number;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super({
      displayAccounts: [],
      netWorth: 0,
      incomeThisMonth: 0,
      expensesThisMonth: 0,
      debtsLiabilities: {},
      monthlyBreakdown: {},
      balancesOverTime: [],
    } as any);

    this.#initAll();
  }

  /**
   * Initialize the service's data.
   */
  #initAll() {
    this.#initAccountData();
    this.#initNetWorth();
    this.#initMonthlyIncomeExpenses();
    this.#initDebtsLiabilities();
    this.#initMonthlyBreakdown();
    this.#initRecentTransactions();
    this.#initBalanceTrends();
  }

  /**
   * Fetch balance trend data.
   */
  #initBalanceTrends() {
    /* Run if cachefile doesn't exist */
    const fetchAllFromLedger = () => {
      /* @TODO Init timestamp to user-configurable date */
      /* let ts = new Date(new Date().getFullYear(), 0, 1).valueOf() */
      let ts = new Date(2024, 0, 1).valueOf();
      const now = Date.now().valueOf();

      /**
       * To get total balance trends:
       * Chain together multiple `ledger balance --end ${timestamp}` commands.
       * The output of each command will be put on a new line.
       * Get total balance (Assets - Liabilities) by piping to `tail -n 1`.
       */

      let cmd = "";
      let baseCmd = `hledger ${INCLUDES} balance ^Assets ^Liabilities --depth 1 --exchange '$'`;

      while (ts < now) {
        const year = new Date(ts).getFullYear();
        const month = new Date(ts).getMonth() + 1;
        const date = new Date(ts).getDate();
        cmd += `${baseCmd} -e ${year}/${month}/${date} | tail -n 1 ; \n`;
        ts += MILLISECONDS_PER_DAY;
      }

      cmd = cmd.trimEnd();
      cmd = cmd.slice(0, -1);

      execAsync(`bash -c "\(${cmd}\) | tee ${BALANCE_TREND_CACHEFILE}"`)
        .then((out) => {
          this.balancesOverTime = out
            .split("\n")
            .map((x) => Number(x.replace(/[^0-9.]/g, "")));
          this.balancesOverTime = [];
        })
        .catch((err) => print(`LedgerService: initBalanceGraph: ${err}`));
    };

    const fetchFromFile = () => {
      const cmd = `cat ${BALANCE_TREND_CACHEFILE}`;

      execAsync(cmd)
        .then((out) => {
          this.balancesOverTime = out
            .split("\n")
            .map((x) => Number(x.replace(/[^0-9.]/g, "")));
        })
        .catch(print);
    };

    const cfile = Gio.File.new_for_path(BALANCE_TREND_CACHEFILE);
    if (!cfile.query_exists(null)) {
      fetchAllFromLedger();
    } else {
      fetchFromFile();
    }
  }

  /**
   * Initialize account data for the accounts defined in UserConfig.
   *
   * Raw output for each account:
   *      "account","balance"
   *      "Assets:Checking:NFCU","$11064.66"
   *      "total","$11064.66"
   *
   * This gets transformed into:
   *      a DisplayAccountProps instance
   */
  #initAccountData() {
    const commands = UserConfig.ledger.accountList.map((accountData) => {
      /* use `--infer-market-prices -X '$'` to convert shares to $ */
      return `hledger ${INCLUDES} balance ${accountData.accountName} ${CSV} -X '$' --infer-market-prices`;
    });

    const promises = commands.map(async (cmd) => {
      return execAsync(`bash -c '${cmd}'`);
    });

    Promise.all(promises)
      .then((result) => {
        const tmpDisplayAccounts: DisplayAccountProps[] = [];

        for (let i = 0; i < UserConfig.ledger.accountList.length; i++) {
          const lines = result[i].replaceAll('"', "").split("\n");
          const totalStr = lines[lines.length - 1].split(",").pop();

          const output: DisplayAccountProps = {
            displayName: UserConfig.ledger.accountList[i].displayName,
            total: Number(totalStr.replace("$", "")) || 0,
          };

          tmpDisplayAccounts.push(output);
        }

        this.displayAccounts = tmpDisplayAccounts;
      })
      .catch((err) => print(`initAccountData: ${err}`));
  }

  /**
   * Get total net worth (assets - liabilities)
   */
  #initNetWorth() {
    log("ledgerService", "#initNetWorth");

    const cmd = `hledger ${INCLUDES} bs --depth 1 -X '$' --infer-market-prices ${CSV}`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        const lines = out.replaceAll('"', "").split("\n");
        const netWorthStr = lines[lines.length - 1].split(",")[1];
        const netWorth = Number(netWorthStr.replace("$", ""));

        this.netWorth = netWorth;
      })
      .catch((err) => print(`#initNetWorth: ${err}`));
  }

  /**
   * @function initMonthlyIncomeExpenses
   * @brief Get total income and expenses for this month
   */
  #initMonthlyIncomeExpenses() {
    log("ledgerService", "#initMonthlyIncomeExpenses");

    const monthStart = `${new Date().getMonth() + 1}/01`;
    const cmd = `hledger ${INCLUDES} bal --depth 1 -X '$' --infer-market-price ${CSV} -b ${monthStart}`;

    execAsync(`bash -c '${cmd}'`).then((out) => {
      const lines = out.replaceAll('"', "").split("\n");
      const relevantLines = lines.filter(
        (str) => str.includes("Income") || str.includes("Expenses"),
      );

      relevantLines.forEach((element) => {
        const fields = element.split(",");
        const total = Math.abs(Number(fields[1].replace("$", "")));

        if (fields[0].includes("Income")) {
          this.incomeThisMonth = total.toFixed(2);
        } else if (fields[0].includes("Expenses")) {
          this.expensesThisMonth = total.toFixed(2);
        }
      });
    });
  }

  /**
   * Parse **uncleared** debts and liabilities.
   *
   * This is specific to the way I personally use hledger.
   * Liabilities for things like credit cards are never marked as pending/cleared.
   * Debts/liabilities to other people (e.g. if I owe someone $20) are marked as pending,
   * then are cleared when they are paid back.
   * This function is specifically for those interpersonal debts/liabilities.
   */
  #initDebtsLiabilities() {
    log("ledgerService", "#initDebtsLiabilities");

    const cmd = `hledger ${INCLUDES} register Reimbursements Liabilities --pending ${CSV} | tail -n 40`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        const lines = out.replaceAll('"', "").split("\n").slice(1);

        const tmp = {};

        lines.map((line) => {
          const fields = line.split(",");

          const account = fields[HLedgerRegCSV.Account];

          if (tmp[account] == undefined) {
            tmp[account] = [];
          }

          tmp[account].push({
            desc: fields[HLedgerRegCSV.Desc],
            total: Number(fields[HLedgerRegCSV.Amount].replace("$", "")),
          });
        });

        this.debtsLiabilities = tmp;
      })
      .catch((err) => print(`#initDebtsLiabilities: ${err}`));
  }

  /**
   * Initializes spending data for the current month.
   * Used in a pie chart.
   */
  #initMonthlyBreakdown() {
    log("ledgerService", `#initMonthlyBreakdown`);

    const monthStart = `${new Date().getMonth() + 1}/01`;
    const cmd = `hledger ${INCLUDES} bal Expenses --begin ${monthStart} --no-total --depth 2 ${CSV}`;

    this.monthlyBreakdown = [];

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        const row = out.replaceAll('"', "").split("\n").slice(1);

        row.forEach((data) => {
          const fields = data.split(",");

          const category = fields[0].split(":")[1];
          const price = Number(fields[1].replace("$", ""));

          this.monthlyBreakdown.push({
            category: category,
            total: price,
          });
        });

        this.notify("monthly-breakdown");
      })
      .catch((err) => print(`initMonthlyBreakdown: ${err}`));
  }

  /**
   * Initialize recent transactions.
   */
  #initRecentTransactions() {
    log("ledgerService", "#initRecentTransactions");

    const cmd = `hledger ${INCLUDES} reg Income Expenses ${CSV}`;

    execAsync(`bash -c '${cmd} | tail -n 20'`)
      .then((out) => {
        out = out.replaceAll('"', "").split("\n").slice(1);

        /* This takes the raw CSV output and turns it into an array of
         * TransactionData objects, where the object keys are the fields of the
         * HLedgerRegCSV enum. */
        this.transactions = out.map((line) => {
          line = line.split(",");

          return Object.fromEntries(
            Object.keys(HLedgerRegCSV)
              .filter((k) => isNaN(Number(k))) /* exclude numeric keys */
              .map((key, index) => [key.toLowerCase(), line[index]]),
          );
        });
      })
      .catch((err) => print(`initRecentTransactions: ${err}`));
  }
}
