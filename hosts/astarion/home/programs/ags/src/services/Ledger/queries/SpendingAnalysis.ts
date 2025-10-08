/**
 * █▀ █▀█ █▀▀ █▄░█ █▀▄ █ █▄░█ █▀▀   ▄▀█ █▄░█ ▄▀█ █░░ █▄█ █▀ █ █▀
 * ▄█ █▀▀ ██▄ █░▀█ █▄▀ █ █░▀█ █▄█   █▀█ █░▀█ █▀█ █▄▄ ░█░ ▄█ █ ▄█
 *
 * I have to be honest, this was vibe-coded
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import { CategorySpend, MonthlySpending } from "../Types";
import LedgerUtils from "../Utils";

/*****************************************************************************
 * Helpers
 *****************************************************************************/

/**
 * Gets the first and last day of the last N months (including current month).
 *
 * @param n - Number of months to retrieve (e.g., 3 returns current month + 2 previous)
 * @returns Array of objects with `first` and `last` date strings in ISO format (YYYY-MM-DD),
 *          ordered chronologically from oldest to newest month
 *
 * @example
 * // If today is 2025-10-07 and n=3:
 * getLastNMonthsDays(3)
 * // Returns:
 * // [
 * //   { first: "2025-08-01", last: "2025-08-31" },
 * //   { first: "2025-09-01", last: "2025-09-30" },
 * //   { first: "2025-10-01", last: "2025-10-31" }
 * // ]
 */
const getLastNMonthsDays = (n: number) => {
  const result = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const first = d.toISOString().split("T")[0];

    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    const last = d.toISOString().split("T")[0];

    result.push({ first, last });
  }

  return result.reverse();
};

/**
 * Calculate spending breakdown by category for a single month.
 *
 * Queries hledger for all expenses within the date range and constructs
 * a hierarchical tree of spending categories with their amounts.
 *
 * @param baseCmd - Base hledger command with journal file path
 * @param first - Start date in YYYY-MM-DD format (inclusive)
 * @param last - End date in YYYY-MM-DD format (exclusive, as per hledger -e flag)
 * @returns CategorySpend object with nested subcategories and subtotals
 *
 * @example
 * // hledger output:
 * // "Expenses:Food:Restaurants","$150.00"
 * // "Expenses:Food:Groceries","$300.00"
 * // "total","$450.00"
 *
 * // Returns:
 * // {
 * //   subtotal: 450,
 * //   subcategories: {
 * //     Food: {
 * //       subtotal: 450,
 * //       subcategories: {
 * //         Restaurants: { subtotal: 150, subcategories: {} },
 * //         Groceries: { subtotal: 300, subcategories: {} }
 * //       }
 * //     }
 * //   }
 * // }
 */
const calculateMonthlySpend = async (
  baseCmd: string,
  first: string,
  last: string,
): Promise<CategorySpend> => {
  const cmd = `${baseCmd} -b ${first} -e ${last} bal ^Expenses --output-format csv`;

  try {
    const out = await execAsync(`bash -c '${cmd}'`);
    const split = out.replaceAll('"', "").split("\n").slice(1);

    let tmp = {} as CategorySpend;
    let total = 0;

    split.forEach((line: string) => {
      const [rawCategory, rawAmount] = line.split(",");
      const category = rawCategory.replaceAll("Expenses:", "");
      const amount = Number(rawAmount.replace(/[^0-9,.]/g, ""));

      const categorySpend = LedgerUtils.stringToCategorySpend(category, amount);

      if (rawCategory == "total") {
        total = amount;
      } else {
        tmp = LedgerUtils.deepMergeCategories(tmp, categorySpend);
      }
    });

    LedgerUtils.recursiveSubtotalSum(tmp);
    tmp.subtotal = total;

    return tmp;
  } catch (err) {
    console.error(`calculateMonthlySpend (${first} - ${last}): ${err}`);
    return { subtotal: 0, subcategories: {} };
  }
};

/**
 * Aggregates monthly spending data into a single category tree with time-series arrays.
 *
 * Transforms spending data from separate per-month category trees into a unified
 * tree where each category contains an array of spending values across all months.
 * This enables trend visualization and comparison across time periods.
 *
 * @param monthlyData - Object mapping date strings to CategorySpend trees
 * @returns Single CategorySpend tree where subtotals are arrays indexed by month
 *
 * @example
 * // Input: 2 months of data
 * {
 *   "2025-08-01": { subtotal: 500, subcategories: { Food: { subtotal: 300 } } },
 *   "2025-09-01": { subtotal: 600, subcategories: { Food: { subtotal: 350 } } }
 * }
 *
 * // Output: Time-series format
 * {
 *   subtotal: [500, 600],              // Total spending: [Aug, Sep]
 *   subcategories: {
 *     Food: {
 *       subtotal: [300, 350],          // Food spending: [Aug, Sep]
 *       subcategories: {}
 *     }
 *   }
 * }
 */
const aggregateMonthlySpendingByCategory = (
  monthlyData: MonthlySpending,
): CategorySpend => {
  const months = Object.keys(monthlyData).sort();
  const monthCount = months.length;

  function mergeNodes(
    category: string,
    index: number,
    node: SpendingNode,
    result: CategorySpend,
  ) {
    if (node === undefined) return;

    result.subtotal[index] = node.subtotal;

    for (const subcategory in node.subcategories) {
      if (!result.subcategories[subcategory]) {
        result.subcategories[subcategory] = {
          subtotal: new Array(monthCount).fill(0),
          subcategories: {},
        };
      }

      mergeNodes(
        subcategory,
        index,
        node.subcategories[subcategory],
        result.subcategories[subcategory],
      );
    }
  }

  const aggregated: CategorySpend = {
    subtotal: new Array(monthCount).fill(0),
    subcategories: {},
  };

  months.forEach((month, index) => {
    const rootNode = monthlyData[month];
    mergeNodes("root", index, rootNode, aggregated);
  });

  return aggregated;
};

/*****************************************************************************
 * Main function definition
 *****************************************************************************/

export const spendingAnalysis = async (
  baseCmd: string,
): Promise<CategorySpend> => {
  const monthStrings = getLastNMonthsDays(3);

  try {
    const results = await Promise.all(
      monthStrings.map((monthStr) =>
        calculateMonthlySpend(baseCmd, monthStr.first, monthStr.last),
      ),
    );

    const spendingByMonth = {} as MonthlySpending;
    for (let i = 0; i < monthStrings.length; i++) {
      spendingByMonth[monthStrings[i].first] = results[i]!;
    }

    return aggregateMonthlySpendingByCategory(spendingByMonth);
  } catch (err) {
    console.error(`spendingAnalysis: ${err}`);
    return {} as CategorySpend;
  }
};
