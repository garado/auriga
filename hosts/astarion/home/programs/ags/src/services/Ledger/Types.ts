/**
 * ▀█▀ █▄█ █▀█ █▀▀ █▀
 * ░█░ ░█░ █▀▀ ██▄ ▄█
 *
 * Implements types, interfaces, enums for interactions with hledger data.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Binding } from "astal";

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
export type MonthlySpending = Record<string, CategorySpend>;

// REWRITTEN INTERFACES ----------------------------

/**
 * Represents cash flow (income and expenses).
 * @interface
 */
export interface CashFlow {
  income: number;
  expenses: number;
}

/**
 * Represents spending data for a single category.
 * @interface
 */
export interface CategorySpending {
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
  total: number | Binding<number>;
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
export interface HLedgerRegisterRow {
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
export enum HLedgerRegisterFields {
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
export interface HLedgerBalanceRow {
  account: string;
  balance: string;
}

/**
 * Enum for CSV output of hledger `balance` and `balancesheet` commands.
 * @interface
 */
export enum HLedgerBalanceFields {
  account,
  balance,
}
