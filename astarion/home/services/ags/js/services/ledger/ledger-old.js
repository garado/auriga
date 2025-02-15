
/* █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀ */
/* █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄ */

/* Interface with ledger-cli. */

import Service from 'resource:///com/github/Aylur/ags/service.js'
import Gio from 'gi://Gio'

import UserConfig from '../../../userconfig.js'
import * as LedgerUtils from './utils.js'

const INCLUDES = UserConfig.ledger.includes.map(f => `-f ${f}`).join(' ')
const BALANCE_TREND_CACHEFILE = '/tmp/ags/ledgerbal'

/********************************************
 * SERVICE DEFINITION
 ********************************************/

/** Interface for ledger-cli. **/
class LedgerService extends Service {
  static {
    Service.register (
      this,
      { // Signals
        'accounts-changed': ['jsobject'],
        'transactions-changed': ['jsobject'],
        'yearly-balances-changed': ['jsobject'],
        'debts': ['jsobject'],
        'budget': ['jsobject'],
        'breakdown-changed': ['jsobject'],
        'card-balances-changed': ['jsobject'],

        'monthly-income-changed': ['float'],
        'monthly-expenses-changed': ['float'],
        'assets-changed': ['float'],
        'liabilities-changed': ['float'],
        'net-worth-changed': ['float'],
      },
      { // Properties
        // No need for properties because data remains largely unchanged.
        // Data only changes when ledger or budget file are updated,
        // and in that case we'll just re-run the init functions and
        // emit the signals (along with the data) again
      },
    )
  }

  // Private variables
  #netWorth = 0
  #totalAssets = 0
  #totalLiabilities = 0
  #monthlyIncome = 0
  #monthlyExpenses = 0

  #accountData = []
  #transactionData = []
  #balancesOverTime = []
  #debts = []
  #budget = []
  #breakdown = []
  #cardBalances = []

  constructor() {
    super()

    this.#initAll()

    /* Watch ledger file for changes */
    Utils.monitorFile(UserConfig.ledger.monitorDir, (file, event) => {
      if (event === Gio.FileMonitorEvent.CHANGED) {
        this.#initAll()
      }
    })
  }

  #initAll() {
    this.#initIncomeAndExpenses()
    // this.#initNetWorth()
    // this.#initMonthlyIncome()
    // this.#initMonthlyExpenses()
    // this.#initAccountData()
    // this.#initCardBalance()
    // this.#initDebtsLiabilities()
    // this.#initMonthlyBreakdown()
    // this.#initBalanceGraph()
    // this.#initTransactionData()
    // this.#initCommodities()
    // this.#initBudget()
  }
  
  /** 
   * @function initAccountTotals
   * @brief Create an object containing data for every account 
   */
  #initIncomeAndExpenses() {
    const cmd = `hledger ${INCLUDES} incomestatement --output-format csv`

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        out = out.split('\n')
      })
      .catch()
  }

  /* OLD SHIT ******************************************************/

  /** 
   * Parse assets and liabilities to get total net worth. 
   */
  #initNetWorth() {
    this.#netWorth = 0
    this.#totalAssets = 0
    this.#totalLiabilities = 0

    const cmd = `ledger ${INCLUDES} balance ^Assets --depth 1 --exchange '$'; \
                 ledger ${INCLUDES} balance ^Liabilities --depth 1`
    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        out = out.split('\n')
        this.#totalAssets = out[0] ? Number(out[0].replace(/[^0-9.]/g,'')).toFixed(2) : 0
        this.#totalLiabilities = out[1] ? Number(out[1].replace(/[^0-9.]/g,'')).toFixed(2) : 0
        this.#netWorth = (this.#totalAssets - this.#totalLiabilities)

        this.emit('assets-changed', this.#totalAssets)
        this.emit('liabilities-changed', this.#totalLiabilities)
        this.emit('net-worth-changed', this.#netWorth)
      })
      .catch(err => print(`LedgerService: initNetWorth: ${err}`))
  }

  /** 
   * Parse monthly income.
   **/
  #initMonthlyIncome() {
    this.#monthlyIncome = 0
    const cmd = `ledger ${INCLUDES} balance ^Income --depth 1 --begin ${Utils.exec("date +%B")}`
    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {

        if (out) {
          this.#monthlyIncome = Number(out.replace(/[^0-9.]/g, ''))
        } else {
          this.#monthlyIncome = 0
        }

        this.emit('monthly-income-changed', this.#monthlyIncome)
      })
      .catch(err => print(`LedgerService: initMonthlyIncome: ${err}`))
  }
  
  /** 
   * Parse monthly expenses.
   **/
  #initMonthlyExpenses() {
    this.#monthlyExpenses = 0
    const cmd = `ledger ${INCLUDES} balance ^Expenses --depth 1 --begin ${Utils.exec("date +%B")}`
    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        if (out) {
          this.#monthlyExpenses = Number(out.replace(/[^0-9.]/g, ''))
        } else {
          this.#monthlyExpenses = 0
        }

        this.emit('monthly-expenses-changed', this.#monthlyExpenses)
      })
      .catch(err => print(`LedgerService: initMonthlyExpenses: ${err}`))
  }
  
  /**
   * Parse account data.
   **/
  #initAccountData() {
    this.#accountData = []
    const accountList = UserConfig.ledger.accountList
    let parsed = 0
    accountList.map((data, index) => {
      const cmd = `ledger ${INCLUDES} balance "${data.accountName}" --depth 1 --balance_format '%(display_total)' --exchange '$'`

      Utils.execAsync(`bash -c "${cmd}"`)
        .then(balance => {
          balance = balance.replace(/[^0-9.]/g, '')

          this.#accountData.push({
            accountName: data.accountName,
            displayName: data.displayName,
            balance: balance ? Number(balance) : 0,
          })

          if (++parsed == accountList.length) {
            this.emit('accounts-changed', this.#accountData)
          }
        })
        .catch(err => print(`LedgerService: initAccountData: ${err}`))
    })
  }

  /** Parse debts and liabilities from ledger-cli. */
  #initDebtsLiabilities() {
    this.#debts = []
    const SEP = '@,@'
    const cmd = `ledger ${INCLUDES} csv Reimbursements Liabilities --group-by account --pending \
      --csv-format '%(date)${SEP}%(account)${SEP}%(payee)${SEP}%(total)\n'`
    Utils.execAsync(['bash', '-c', cmd])
      .then(out => {
        if (out === "") { return }

        const rawData = out.split(/\n\n/)
        this.#debts = rawData.map(x => {
          const lines = x.split('\n')
        
          let ret = new LedgerUtils.DebtData()

          // Get account name
          const lastColonPos = lines[0].lastIndexOf(':')
          ret.account = lines[0].substring(lastColonPos + 1)
          
          // Get all uncleared transactions for that account
          const rawTransactions = lines.slice(1)

          // Output gives running total, so subtract previous running total
          // to get the transaction's debt amount
          let runningTotal = 0

          rawTransactions.map(x => {
            const fields = x.split(SEP)
            const amount = Number(fields[3].replace(/[^0-9.-]/g, '')) - runningTotal
            runningTotal += amount
            ret.transactions.push({
              amount: amount,
              description: fields[2],
            })
          })

          return ret
        })

        this.emit('debts', this.#debts)
      })
      .catch(err => print(err))
  }

  /**
   * Parse CSV transaction data from ledger-cli.
   **/
  #initTransactionData() {
    this.#transactionData = []

    const cmd = `ledger ${INCLUDES} csv Expenses -X '$' --csv_format '"%(date)","%(account)","%(payee)","%(t)"\n'`

    Utils .execAsync(`bash -c "${cmd} | sort | tail -n 20 | tac"`)
      .then(out => {
        this.#transactionData = LedgerUtils.convertToTransactionDatas(out.split('\n'))
        this.emit('transactions-changed', this.#transactionData)
      })
      .catch(err => {
        print(`LedgerService: initTransactionData: ${err}`)
      })

  }

  /**
   * Parse balance trends from ledger-cli.
   *
   * Data is cached in a file BALANCE_TREND_CACHEFILE.
   * This function will read the file, and then append to the file any information
   * for missing dates.
   **/
  #initBalanceGraph() {
    /* Run if cachefile doesn't exist */
    const fetchAllFromLedger = () => {
      /* @TODO Init timestamp to user-configurable date */
      /* let ts = new Date(new Date().getFullYear(), 0, 1).valueOf() */
      let ts = new Date(2024, 0, 1).valueOf()
      const now = Date.now().valueOf()

      /**
       * To get total balance trends:
       * Chain together multiple `ledger balance --end ${timestamp}` commands.
       * The output of each command will be put on a new line.
       * Get total balance (Assets - Liabilities) by piping to `tail -n 1`.
       */

      let cmd = ''
      let baseCmd = `ledger ${INCLUDES} balance ^Assets ^Liabilities --depth 1 --exchange '$'`
      const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

      while (ts < now) {
        const year  = new Date(ts).getFullYear()
        const month = new Date(ts).getMonth() + 1
        const date  = new Date(ts).getDate()
        cmd += `${baseCmd} -e ${year}/${month}/${date} | tail -n 1 ; \n`
        ts += (MILLISECONDS_PER_DAY)
      }

      cmd = cmd.trimEnd()
      cmd = cmd.slice(0, -1)

      Utils.execAsync(`bash -c "\(${cmd}\) | tee ${BALANCE_TREND_CACHEFILE}"`)
        .then(out => {
          this.#balancesOverTime = out.split('\n').map(x => Number(x.replace(/[^0-9.]/g, '')))
          this.emit('yearly-balances-changed', this.#balancesOverTime)
        })
        .catch(err => print(`LedgerService: initBalanceGraph: ${err}`))
    }

    const fetchFromFile = () => {
      const cmd = `cat ${BALANCE_TREND_CACHEFILE}`

      Utils.execAsync(cmd)
        .then(out => {
          this.#balancesOverTime = out.split('\n').map(x => Number(x.replace(/[^0-9.]/g, '')))
          this.emit('yearly-balances-changed', this.#balancesOverTime)
        })
        .catch(print)
    }

    this.#balancesOverTime = []
    const cfile = Gio.File.new_for_path(BALANCE_TREND_CACHEFILE)
    if (!cfile.query_exists(null)) {
      fetchAllFromLedger()
    } else {
      fetchFromFile()
    }
  }
 
  /** Parse budget information from ledger-cli. */
  #initBudget() {
    this.#budget = []
    const cmd = `ledger ${INCLUDES} budget --budget-format '%A, %T\n' --begin ${Utils.exec("date +%B")}`
    Utils.execAsync(['bash', '-c', cmd])
      .then(out => {
        if (out === "") { return }

        // Last element in the array gives total spent
        // Don't need it, so remove it
        const rawData = out.split('\n').slice(2, -1)

        this.#budget = rawData.map(x => {
          // remove: ( ) , $
          const fields = x.split(', ').map(x => x.replace(/\(|\)|,|\$/g, ''))
          return new LedgerUtils.BudgetData(fields[0], Number(fields[1]), Math.abs(Number(fields[2])))
        })

        this.emit('budget', this.#budget)
      })
    .catch(err => print(err))
  }
 
  /** Parse spending information for this month. */
  #initMonthlyBreakdown() {
    this.#breakdown = []
    
    const SEP = '@,@'

    const month = Utils.exec("date +%B")
    const cmd = `ledger ${INCLUDES} balance Expenses --begin ${month} --no-total --depth 2 \
      --balance_format '%(account)${SEP}%(display_total)\n'`

    Utils.execAsync(['bash', '-c', cmd])
      .then(out => {
        if (out === "") { return }

        out = out.split('\n')

        out.map(x => {
          x = x.split(SEP)
          this.#breakdown.push({
            account: x[0].replace('Expenses:', ''),
            amount: Number(x[1].replace(/[^0-9.]+/g, '')),
          })
        })

        // remove 1st
        this.#breakdown.shift()
        
        this.emit('breakdown-changed', this.#breakdown)
      })
      .catch(err => print(err))

  }
  
  /**
   * @function initCommodities
   * @brief Fetch list of commodities (excluding currency).
   *
   * Used mainly for stocks.
   */
  #initCommodities() {
  }

  /**
   * Show card balances. (Liabilities:Credit)
   **/
  #initCardBalance() {
    this.#cardBalances = []
    const cmd = `ledger ${INCLUDES} balance Liabilities:Credit --balance_format '%(display_total)\t%(account)'`

    Utils.execAsync(`bash -c "${cmd}"`)
      .then(out => {
        out = out.split('\n')

        out.forEach(x => {
          const data = x.split('\t')
          this.#cardBalances.push({
            amount: data[0].replace(/[^0-9.]/g, ''),
            account: data[1],
          })
        });

        this.emit('card-balances-changed', this.#cardBalances)
      })
      .catch(err => print(`LedgerService: initCardBalance: ${err}`))
  }

  // Given an account, return the feather icon it should display
  tdataToIcon = (transaction, account) => {
    for (let term in UserConfig.ledger.icon_maps.transaction_name) {
      if (transaction.includes(term))
        return UserConfig.ledger.icon_maps.transaction_name[term]
    }
    
    for (let term in UserConfig.ledger.icon_maps.account) {
      if (account.includes(term))
        return UserConfig.ledger.icon_maps.account[term]
    }

    return UserConfig.ledger.icon_maps.default
  }
}

const service = new LedgerService

export default service
