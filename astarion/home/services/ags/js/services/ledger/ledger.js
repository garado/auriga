
/* █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀ */
/* █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄ */

/* Interface with hledger. */

import Service from 'resource:///com/github/Aylur/ags/service.js'
import Gio from 'gi://Gio'

import UserConfig from '../../../userconfig.js'
import * as LedgerUtils from './utils.js'

const SYMBOL_CACHE_DIR = '/tmp/ags/stocks'
const INCLUDES = UserConfig.ledger.includes.map(f => `-f ${f}`).join(' ')
const CSV = ' --output-format csv '
const ALPHAVANTAGE_API = UserConfig.ledger.alphavantage
const BALANCE_TREND_CACHEFILE = '/tmp/ags/ledgerbal'

const HLedgerRegCSVEnum = {
  TXNIDX:   0,
  DATE:     1,
  CODE:     2,
  DESC:     3,
  ACCOUNT:  4,
  AMOUNT:   5,
  TOTAL:    6,
}

/********************************************
 * HELPER FUNCTIONS
 ********************************************/

/** 
 * Merge 2 objects as follows:
 *
 * const obj1 = { 
 *    expenses: {
 *        bills: 200,
 *    }
 * }
 *
 *
 * const obj2 = { 
 *    expenses: {
 *        rent: 400,
 *    }
 * }
 *
 * Result after deepMerge:
 *
 * const deepMergedObject = { 
 *    expenses: {
 *        bills: 200,
 *        rent:  400,
 *    }
 * }
 */
const deepMerge = (obj1, obj2) => {
  let result = { ...obj1 }

  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (
        typeof obj2[key] === 'object' && 
          obj2[key] !== null && 
          !Array.isArray(obj2[key]) &&
          typeof result[key] === 'object'
      ) {
        result[key] = deepMerge(result[key], obj2[key]) // Recursively merge
      } else {
        result[key] = obj2[key] // Assign new values
      }
    }
  }

  return result
}

/********************************************
 * SERVICE DEFINITION
 ********************************************/

/** Interface for ledger-cli. **/
class LedgerService extends Service {
  static {
    Service.register (
      this,
      { /* Signals */
        'monthly-breakdown-changed': ['jsobject'],


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
      { /* Properties */
        /* Array of commodity data 
         * Elements of array are objects: {'symbolName': price } 
         * @TODO make this just an object, not an array of objects */
        'commodities':        ['r'],

        /* Floats */
        'total-income':       ['r'],
        'total-expenses':     ['r'],
        'total-liabilities':  ['r'],

        /* array of objects {category: <category>, total: total}*/
        'monthly-breakdown': ['r'],

        /* array of objects { displayName: <name>, total: <total> } */
        'display-accounts': ['r'],

        'debts-liabilities': ['r'],

        /* float */
        'net-worth': ['r'],
        'income-this-month': ['r'],
        'expenses-this-month': ['r'],
      },
    )
  }

  /**************************************
   * PRIVATE VARIABLES
   **************************************/

  #accountTotals = {}
  #commodities = []
  #monthlyBreakdown = []
  #displayAccounts = []
  #netWorth = 0
  #incomeThisMonth = 0
  #expensesThisMonth = 0
  #debtsLiabilities = {}
  
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
  
  get commodities() {
    return this.#commodities
  }
  
  get incomeThisMonth() {
    return this.#incomeThisMonth
  }
  
  get expensesThisMonth() {
    return this.#expensesThisMonth
  }

  get monthlyBreakdown() {
    return this.#monthlyBreakdown
  }
  
  get displayAccounts() {
    return this.#displayAccounts
  }
  
  get netWorth() {
    return this.#netWorth
  }
  
  get debtsLiabilities() {
    return this.#debtsLiabilities
  }
  
  /**************************************
   * PRIVATE FUNCTIONS
   **************************************/

  /**
   * @function initAll
   * @brief Initialize all data for service.
   */
  #initAll() {
    this.#initNetWorth()
    this.#initMonthlyIncomeExpenses()
    this.#initCommodities()
    this.#initMonthlyBreakdown()
    this.#initAccountData()
    this.#initDebtsLiabilities()
    this.#initRecentTransactions()
  }

  /**
   * @function initRecentTransactions
   * @brief
   */
  #initRecentTransactions() {
    log('ledgerService', '#initRecentTransactions')

    const cmd = `hledger ${INCLUDES} reg Income Expenses ${CSV}`

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        out = out.replaceAll('"', '').split('\n').slice(1)
      })
      .catch(err => print(`initRecentTransactions: ${err}`))
  }

  /** 
   * @function initDebtsLiabilities
   * @brief Parse **uncleared** debts and liabilities. 
   *
   * This is specific to the way I personally use hledger. 
   * Liabilities for things like credit cards are never marked as pending/cleared.
   * Debts/liabilities to other people (e.g. if I owe someone $20) are marked as pending, 
   * then are cleared when they are paid back. 
   * This function is specifically for those interpersonal debts/liabilities.
   */
  #initDebtsLiabilities() {
    log('ledgerService', '#initDebtsLiabilities')

    const cmd = `hledger ${INCLUDES} register Reimbursements Liabilities --pending ${CSV} | tail -n 40`

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const lines = out.replaceAll('"', '').split('\n').slice(1)

        this.#debtsLiabilities = {}

        lines.map(line => {
          const fields = line.split(',')

          const account = fields[HLedgerRegCSVEnum.ACCOUNT]

          if (this.#debtsLiabilities[account] == undefined) {
            this.#debtsLiabilities[account] = []
          }

          this.#debtsLiabilities[account].push({
            desc:  fields[HLedgerRegCSVEnum.DESC],
            total: Number(fields[HLedgerRegCSVEnum.AMOUNT].replace('$', '')),
          })
        })

        this.notify('debts-liabilities')
      })
      .catch(err => print(`#initDebtsLiabilities: ${err}`))
  }

  /**
   * @function initNetWorth
   * @brief Get total net worth (assets - liabilities)
   */
  #initNetWorth() {
    log('ledgerService', '#initNetWorth')

    const cmd = `hledger ${INCLUDES} bs --depth 1 -X '$' --infer-market-prices ${CSV}`

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const lines = out.replaceAll('"', '').split('\n')
        const netWorthStr = lines[lines.length - 1].split(',')[1]
        const netWorth = Number(netWorthStr.replace('$', ''))

        this.#netWorth = netWorth
        this.notify('net-worth')
      })
      .catch(err => print(`#initNetWorth: ${err}`))
  }

  /**
   * @function initMonthlyIncomeExpenses
   * @brief Get total income and expenses for this month
   */
  #initMonthlyIncomeExpenses() {
    log('ledgerService', '#initMonthlyIncomeExpenses')

    const monthStart = `${new Date().getMonth() + 1}/01`
    const cmd = `hledger ${INCLUDES} bal --depth 1 -X '$' --infer-market-price ${CSV} -b ${monthStart}`

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const lines = out.replaceAll('"', '').split('\n')
        const relevantLines = lines.filter(str => str.includes('Income') || str.includes('Expenses'))

        relevantLines.forEach(element => {
          const fields = element.split(',')
          const total = Math.abs(Number(fields[1].replace('$', '')))

          if (fields[0].includes('Income')) {
            this.#incomeThisMonth = total.toFixed(2)
            this.notify('income-this-month')
          } else if (fields[0].includes('Expenses')) {
            this.#expensesThisMonth = total.toFixed(2)
            this.notify('expenses-this-month')
          }
        })
      })
  }

  /**
   * @function initAccountData
   * @brief Initialize account data for the accounts defined in UserConfig.
   */
  #initAccountData() {
    log('ledgerService', '#initAccountData')

    const commands = UserConfig.ledger.accountList.map(accountData => {
      /* use `--infer-market-prices -X '$'` to convert shares to $ */
      return `hledger ${INCLUDES} balance ${accountData.accountName} ${CSV} -X '$' --infer-market-prices`
    })

    const promises = commands.map(async cmd => {
      return Utils.execAsync(`bash -c '${cmd}'`)
    })

    Promise.all(promises)
      .then(result => {
        /**
         * RAW OUTPUT:
         * "account","balance"
         * "Assets:Checking:NFCU","$11064.66"
         * "total","$11064.66"
         *
         * TURN THIS INTO:
         * { displayName: <userconfig display name>, total: <total> }
         */

        this.#displayAccounts = []

        for (let i = 0; i < UserConfig.ledger.accountList.length; i++) {
          const lines = result[i].replaceAll('"', '').split('\n')
          const totalStr = lines[lines.length - 1].split(',').pop()

          const output = {
            displayName: UserConfig.ledger.accountList[i].displayName,
            total: Number(totalStr.replace('$', ''))
          }

          this.#displayAccounts.push(output)
        }

        this.notify('display-accounts')
      })
      .catch(err => print(`initAccountData: ${err}`))
  }
  
  /**
   * @function initCommodities
   * @brief Initialize commodities (stocks) and their current prices using
   * AlphaVantage API.
   *
   * NOTE: Only 25 API requests allowed per day on free tier, which means 25 max
   * commodities.
   *
   * The program flow is:
   *    - initCommodities
   *        - for each commodity: readCachedCommodity or fetchNewCommodity (all async calls)
   *        - wait til all async calls are done before moving on
   *    - parseCommodityJSON
   *        - parse commodity JSON for all commodities
   *        - argument is an array of JSON data
   *        - this is where signals/etc are emitted
   */
  #initCommodities() {
    /* Parse initial list of commodities from hledger */
    const cmd = `hledger ${INCLUDES} commodities`
    const commodities = Utils.exec(`bash -c '${cmd}'`).split('\n').slice(1)

    const promises = commodities.map(async commodity => {
      const path = `${SYMBOL_CACHE_DIR}/${commodity}/${new Date().toISOString().slice(0, 10)}`
      const cfile = Gio.File.new_for_path(path)

      if (!cfile.query_exists(null)) {
        return this.#fetchNewCommodity(commodity, path)
      } else {
        return this.#readCachedCommodity(path)
      }
    })

    Promise.all(promises)
      .then(result => this.#parseCommodityJSON(result))
      .catch(err => print(`initCommodities: ${err}`))
  }
  
  /**
   * @function parseCommodityJSON
   */
  #parseCommodityJSON(commodityData) {
    log('ledgerService', 'parseCommodityJSON')

    this.#commodities = []

    commodityData.forEach(raw => {
      const parsed = JSON.parse(raw)
      const symbol = parsed["Global Quote"]["01. symbol"]
      const price  = parsed["Global Quote"]["05. price"]

      const result = {}
      result[symbol] = price
      this.#commodities.push(result)
    })

    this.notify('commodities')
  }

  /**
   * @function fetchNewCommodity
   * @brief Request commodity information from AlphaVantage.
   */
  async #fetchNewCommodity(commodity, cachefile) {
    log('ledgerService', `fetchNewCommodity: ${commodity} (${cachefile})`)

    let cmd = `mkdir -p \$(dirname ${cachefile}) && touch ${cachefile} && `
    cmd += `curl -f "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${commodity}&apikey=${ALPHAVANTAGE_API}"`
    cmd += `| tee ${cachefile}`

    try {
      return Utils.execAsync(`bash -c '${cmd}'`)
    } catch (err) {
      print(`fetchNewCommodity: (${commodity}) (${err})`)
    }
  }

  /**
   * @function readCachedCommodity
   * @brief Read contents of previously cached commodity file.
   */
  async #readCachedCommodity(cachefile) {
    log('ledgerService', `readCachedCommodity: ${cachefile}`)

    return Utils.execAsync(`bash -c 'cat ${cachefile}'`)
  }

  /**
   * @function initMonthlyBreakdown
   * @brief Initializes spending data for the current month. Used for pie chart.
   */
  #initMonthlyBreakdown() {
    const monthStart = `${new Date().getMonth() + 1}/01`
    const cmd = `hledger ${INCLUDES} bal Expenses --begin ${monthStart} --no-total --depth 2 ${CSV}`

    this.#monthlyBreakdown = []

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const row = out.replaceAll('"', '').split('\n').slice(1)

        row.forEach(data => {
          const fields = data.split(',')

          const category  = fields[0].split(':')[1]
          const price     = Number(fields[1].replace('$', ''))

          this.#monthlyBreakdown.push({
            category: category,
            total: price,
          })
        })

        this.notify('monthly-breakdown')
        this.emit('monthly-breakdown-changed', this.#monthlyBreakdown)
      })
      .catch(err => print(`initMonthlyBreakdown: ${err}`))
  }
}

const service = new LedgerService

export default service
