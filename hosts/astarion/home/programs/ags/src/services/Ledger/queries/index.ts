import { accountData } from "./accountData";
import { balanceTrends } from "./BalanceTrends";
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
  balanceTrends: balanceTrends,
};

export default LedgerQuery;
