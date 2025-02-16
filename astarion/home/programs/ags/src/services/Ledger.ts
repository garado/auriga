
/* █░█ █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█ */
/* █▀█ █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄ */

import { GObject, register, signal, property } from "astal/gobject"
import { monitorFile, readFileAsync } from "astal/file"
import { execAsync } from "astal/process"
import UserConfig from '../../userconfig.js'

const INCLUDES = ' -f /home/alexis/Enchiridion/self/ledger/2024/2024.ledger '
const CSV = ' --output-format csv '

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export type DisplayAccountProps = {
  displayName: string;
  total: Number | Binding<Number>;
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

  static instance: Ledger

  static get_default() {
    if (!this.instance) {
      this.instance = new Ledger()
    }

    return this.instance
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @property(Object)
  declare displayAccounts: Array<DisplayAccountProps>
  
  @property(Number)
  declare incomeThisMonth: Number

  @property(Number)
  declare expensesThisMonth: Number

  @property(Number)
  declare netWorth: Number

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super()

    this.displayAccounts = []
    this.netWorth = 0
    this.incomeThisMonth = 0
    this.expensesThisMonth = 0

    this.#initAccountData()
    this.#initNetWorth()
    this.#initMonthlyIncomeExpenses()

    // monitorFile(kbdPath, async f => {
    //   const v = await readFileAsync(f)
    //   this.#kbd = Number(v) / this.#kbdMax
    //   this.notify("kbd")
    // })
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
    const commands = UserConfig.ledger.accountList.map(accountData => {
      /* use `--infer-market-prices -X '$'` to convert shares to $ */
      return `hledger ${INCLUDES} balance ${accountData.accountName} ${CSV} -X '$' --infer-market-prices`
    })

    const promises = commands.map(async cmd => {
      return execAsync(`bash -c '${cmd}'`)
    })

    Promise.all(promises)
      .then(result => {
        const tmpDisplayAccounts: DisplayAccountProps = []

        for (let i = 0; i < UserConfig.ledger.accountList.length; i++) {
          const lines = result[i].replaceAll('"', '').split('\n')
          const totalStr = lines[lines.length - 1].split(',').pop()

          const output: DisplayAccountProps = {
            displayName: UserConfig.ledger.accountList[i].displayName,
            total: Number(totalStr.replace('$', '')) || 0,
          }

          tmpDisplayAccounts.push(output)
        }

        this.displayAccounts = tmpDisplayAccounts
      })
      .catch(err => print(`initAccountData: ${err}`))
  }

  /**
   * Get total net worth (assets - liabilities)
   */
  #initNetWorth() {
    log('ledgerService', '#initNetWorth')

    const cmd = `hledger ${INCLUDES} bs --depth 1 -X '$' --infer-market-prices ${CSV}`

    execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const lines = out.replaceAll('"', '').split('\n')
        const netWorthStr = lines[lines.length - 1].split(',')[1]
        const netWorth = Number(netWorthStr.replace('$', ''))

        this.netWorth = netWorth
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

    execAsync(`bash -c '${cmd}'`)
      .then(out => {
        const lines = out.replaceAll('"', '').split('\n')
        const relevantLines = lines.filter(str => str.includes('Income') || str.includes('Expenses'))

        relevantLines.forEach(element => {
          const fields = element.split(',')
          const total = Math.abs(Number(fields[1].replace('$', '')))

          if (fields[0].includes('Income')) {
            this.incomeThisMonth = total.toFixed(2)
          } else if (fields[0].includes('Expenses')) {
            this.expensesThisMonth = total.toFixed(2)
          }
        })
      })
  }

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/
}
