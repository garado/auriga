import { accountData } from "./accountData";
import { monthlyCashFlow } from "./MonthlyTotals";
import { netWorth } from "./netWorth";

const LedgerQuery = {
  accountData: accountData,
  netWorth: netWorth,
  monthlyCashFlow: monthlyCashFlow,
};

export default LedgerQuery;
