import { accountData } from "./accountData";
import { balanceTrends } from "./BalanceTrends";
import { categorySpending } from "./CategorySpending";
import { debtsLiabilities } from "./DebtsLiabilities";
import { monthlyCashFlow } from "./MonthlyTotals";
import { netWorth } from "./netWorth";
import { recentTransactions } from "./RecentTransactions";
import { spendingAnalysis } from "./SpendingAnalysis";

const LedgerQuery = {
  accountData: accountData,
  netWorth: netWorth,
  monthlyCashFlow: monthlyCashFlow,
  debtsLiabilities: debtsLiabilities,
  categorySpending: categorySpending,
  balanceTrends: balanceTrends,
  spendingAnalysis: spendingAnalysis,
  recentTransactions: recentTransactions,
};

export default LedgerQuery;
