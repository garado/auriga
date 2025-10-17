import { accountData } from "./AccountData";
import { balanceTrends } from "./BalanceTrends";
import { categorySpending } from "./CategorySpending";
import { debtsLoans } from "./DebtsLoans";
import { monthlyCashFlow } from "./MonthlyTotals";
import { netWorth } from "./NetWorth";
import { recentTransactions } from "./RecentTransactions";
import { spendingAnalysis } from "./SpendingAnalysis";

const LedgerQuery = {
  accountData: accountData,
  netWorth: netWorth,
  monthlyCashFlow: monthlyCashFlow,
  debtsLoans: debtsLoans,
  categorySpending: categorySpending,
  balanceTrends: balanceTrends,
  spendingAnalysis: spendingAnalysis,
  recentTransactions: recentTransactions,
};

export default LedgerQuery;
