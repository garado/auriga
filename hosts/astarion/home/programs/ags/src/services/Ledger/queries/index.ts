import { accountData } from "./accountData";
import { categorySpending } from "./CategorySpending";
import { debtsLiabilities } from "./DebtsLiabilities";
import { monthlyCashFlow } from "./MonthlyTotals";
import { netWorth } from "./netWorth";

const LedgerQuery = {
  accountData: accountData,
  netWorth: netWorth,
  monthlyCashFlow: monthlyCashFlow,
  debtsLiabilities: debtsLiabilities,
  categorySpending: categorySpending,
};

export default LedgerQuery;
