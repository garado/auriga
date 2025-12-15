/**
 * █░█ ▀█▀ █ █░░ █▀
 * █▄█ ░█░ █ █▄▄ ▄█
 *
 * Utility functions for working with hledger data.
 *
 * Usage:
 * ------
 * import LedgerUtils from "./Utils";
 * LedgerUtils.parseAmount(...);
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { CategorySpend } from "./Types";

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Parses a monetary amount string into a numeric value.
 * Handles various currency symbols and formatting.
 *
 * @param amountStr - String representation of monetary amount (e.g., "$1,234.56", "€500.00")
 * @returns Numeric value of the amount, or 0 if parsing fails
 */
const parseAmount = (amountStr: string): number => {
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
 * Export
 *****************************************************************************/

const LedgerUtils = {
  parseAmount: parseAmount,
  deepMergeCategories: deepMergeCategories,
  stringToCategorySpend: stringToCategorySpend,
  recursiveSubtotalSum: recursiveSubtotalSum,
};

export default LedgerUtils;
