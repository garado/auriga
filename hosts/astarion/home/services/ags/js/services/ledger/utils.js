
// █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█   █░█ ▀█▀ █ █░░ █▀
// █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄   █▄█ ░█░ █ █▄▄ ▄█

// Utilities for the Ledger service.

/********************************************
 * CUSTOM DATATYPES
 ********************************************/
 
/** Ordering of data parsed from CSV output of ledger commands. */
export const CsvFieldsEnum = {
  Date: 0,
  Account: 1,
  Description: 2,
  Amount: 3,
}

/** 
 * Instantiate a BudgetData object
 * */
export function BudgetData(account, spent, allotted) {
  this.account = account
  this.spent = spent
  this.allotted = allotted
}

/** 
 * Instantiate a DebtData object
 * */
export function DebtData(account = 'NoAccount', transactions = []) {
  this.account = account
  this.transactions = transactions
}

/**
 * Instantiate a TransactionAccountData object
 * */
export function TransactionAccountData(account, amount) {
  /** Account name 
   * @type string */
  this.account = account

  /** Amount  
   * @type string */
  this.amount = amount
}

/**
 * Instantiate a TransactionData object
 * */
export function TransactionData(date, targets = [], sources = [], description, amount, isIncome = false) {
 /** Date of transaction
   * @type string */
  this.date = date
  
  /** Target accounts
   * @type TransactionAccountData */
  this.targets = targets

  /** Source accounts
   * @type TransactionAccountData */
  this.sources = sources

  /** Transaction description
    * @type string */
  this.description = description
  
  /** Transaction amount
    * @type string */
  this.amount = amount

  this.isIncome = isIncome
}

/********************************************
 * HELPER FUNCTIONS
 ********************************************/
  
/** Turn command output into array of tdata
 * @param out array of lines
 * @param sep Custom separator
 * @return Array of TransactionAccountData */
export const convertToTransactionDatas = (lines) => {
  // Array of lines for a similar transaction
  let rawTransactions = []

  let currentTransactionLines = []
  let currentTransactionDesc = ""

  for (let i = 0; i < lines.length; i++) {
    const fields = lines[i].split(',')
    const desc = fields[CsvFieldsEnum.Description]

    if (desc != currentTransactionDesc) {
      // Handle previous transaction
      rawTransactions.push(currentTransactionLines)

      // Start collecting lines from next transaction
      currentTransactionDesc = desc
      currentTransactionLines = []
    }
      
    currentTransactionLines.push(fields)
  }

  // Push the final one
  rawTransactions.push(currentTransactionLines)

  // Now that all similar lines are grouped together,
  // try to build a TransactionData instance from them
  return rawTransactions.map(rawTransactionArrays => {
    if (rawTransactionArrays.length == 0) return // why is it even 0

    let currDate = ""
    let currDesc = ""
    let currTargets = []
    let currSources = []
   
    // Iterate to determine target and source accounts
    for (let i = 0; i < rawTransactionArrays.length; i++) {
      const currentLine = rawTransactionArrays[i]

      const account = currentLine[CsvFieldsEnum.Account]
      const amount = currentLine[CsvFieldsEnum.Amount]

      if (amount.includes('-')) {
        currSources.push(new TransactionAccountData(account, amount))
      } else {
        currTargets.push(new TransactionAccountData(account, amount))
      }

      if (i === 0) {
        currDate = currentLine[CsvFieldsEnum.Date]
        currDesc = currentLine[CsvFieldsEnum.Description]
      }
    }

    // Find transaction total by adding source values
    const sourceAmounts = currSources.map(s => s.amount.replace(/[^0-9.]/g, ''))

    let currAmount = 0
    sourceAmounts.forEach(n => currAmount += Number(n))

    // Determine if income
    let isIncome = false
    currSources.forEach(s => {
      if (s.account.includes("Income") || s.account.includes("Reimbursements")) {
        isIncome = true
      }
    })

    // why the fuck is destructuring not working
    const ret = new TransactionData(
      currDate,
      currTargets,
      currSources,
      currDesc,
      currAmount,
      isIncome,
    )
    // const ret = new TransactionData(currDate, currTargets, currSources, currDesc)
    return ret
  })
}
