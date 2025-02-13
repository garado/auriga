
/* █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀ */
/* █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄ */

/* Interface with hledger. */

import Service from 'resource:///com/github/Aylur/ags/service.js'
import Gio from 'gi://Gio'

import UserConfig from '../../../userconfig.js'
import * as LedgerUtils from './utils.js'

const SYMBOL_CACHE_DIR = '/tmp/ags/stocks'
const INCLUDES = UserConfig.ledger.includes.map(f => `-f ${f}`).join(' ')
const USE_CSV_OUTPUT = ' --output-format csv '
const ALPHAVANTAGE_API = UserConfig.ledger.alphavantage
const BALANCE_TREND_CACHEFILE = '/tmp/ags/ledgerbal'

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

        /* float */
        'net-worth': ['r'],
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

  get monthlyBreakdown() {
    return this.#monthlyBreakdown
  }
  
  get displayAccounts() {
    return this.#displayAccounts
  }
  
  get netWorth() {
    return this.#netWorth
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
    this.#initCommodities()
    this.#initMonthlyBreakdown()
    this.#initAccountData()

    // this.#initIncomeExpensesLiabilities()
  }


  /**
   * @function initNetWorth
   */
  #initNetWorth() {
    log('ledgerService', '#initNetWorth')

    const cmd = `hledger ${INCLUDES} bs --depth 1 -X '$' --infer-market-prices ${USE_CSV_OUTPUT}`

    Utils.execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const lines = out.replaceAll('"', '').split('\n')
        const netWorthStr = lines[lines.length - 1].split(',')[1]
        const netWorth = Number(netWorthStr.replace('$', ''))

        this.#netWorth = netWorth
        this.notify('net-worth')
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
      return `hledger ${INCLUDES} balance ${accountData.accountName} ${USE_CSV_OUTPUT} -X '$' --infer-market-prices`
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
   * @function initIncomeExpensesLiabilities
   * @brief Parse total income, expenses, and liabilities to figure out
   */
  #initIncomeExpensesLiabilities() {
    log('ledgerService', '#initIncomeExpensesLiabilities')

    const commands = [
      `hledger ${INCLUDES} income --depth 1 ${USE_CSV_OUTPUT}`,
      `hledger ${INCLUDES} balance Liabilities --depth 1 ${USE_CSV_OUTPUT}`,
    ]

    const promises = commands.map(async cmd => {
      return Utils.execAsync(`bash -c '${cmd}'`)
    })

    Promise.all(promises)
      .then(result => {
        /* Income/Expenses */

        /* Liabilities */
      })
      .catch(err => print(`initIncomeExpensesLiabilities: ${err}`))

    // Utils.execAsync(`bash -c '${cmd}'`)
    //   .then(out => {
    //     out.split('\n').forEach(accountData => {
    //       const [account, amount] = accountData.split(',')
    //       if (!account.includes('Income:') && !account.includes('Expenses:')) return
    //
    //       /* 'Expenses:Bills:Rent' => ['Expenses', 'Bills', 'Rent'] (a hierarchy) */
    //       let nestedAccounts = account.split(':')
    //
    //       /* ['Expenses', 'Bills', 'Rent'] => nested object */
    //       const merged = nestedAccounts.reduceRight((acc, cur) => ({ [cur]: acc }), amount)
    //
    //       this.#accountTotals = deepMerge(this.#accountTotals, merged)
    //     })
    //   })
    //   .catch(err => print(`LedgerService: initIncomeExpensesLiabilities: ${err}`))
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
    const cmd = `hledger ${INCLUDES} bal Expenses --begin ${monthStart} --no-total --depth 2 ${USE_CSV_OUTPUT}`

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
