/**
 * █▀▀ █ █▀█ █▀▀   █▀▀ █▀█ ▄▀█ █▀█ █░█
 * █▀░ █ █▀▄ ██▄   █▄█ █▀▄ █▀█ █▀▀ █▀█
 *
 * Plot user's current FIRE progress vs expected FIRE progress.
 *
 * @TODO User-configurable params to adjust expected progress trendline
 * @TODO Page is very bare overall; add more stuff
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { bind } from "astal";

import Ledger from "@/services/Ledger";
import InteractiveGraph from "@/components/InteractiveGraph";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let ledgerService: InstanceType<typeof Ledger> | undefined = undefined;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

const formatLargeNumber = (x: number) => {
  if (x > 1000000) {
    return `${(x / 1000000).toFixed(2)}m`;
  } else {
    return `${Math.round(x / 1000)}k`;
  }
};

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  FIRE_GRAPH_WIDGET: "fire-graph",
  BALANCE: "balance",
  TARGET: "target",
} as const;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const fireDailySavingsTarget = (
  currentAge: number,
  currentNetWorth: number,
  targetAmount: number,
  retireAge: number,
  annualReturn: number,
  startAge: number,
  projectionYears: number,
): number[] => {
  const daysSinceStart = (currentAge - startAge) * 365;
  const totalDays = projectionYears * 365;
  const dailyRate = Math.pow(1 + annualReturn, 1 / 365) - 1;

  // Calculate required annual savings from current position
  const yearsRemaining = retireAge - currentAge;
  const futureValueOfCurrent =
    currentNetWorth * Math.pow(1 + annualReturn, yearsRemaining);
  const remainingNeeded = targetAmount - futureValueOfCurrent;
  const annualSavings =
    (remainingNeeded * annualReturn) /
    (Math.pow(1 + annualReturn, yearsRemaining) - 1);
  const dailySavings = annualSavings / 365;

  // Backtrack to startAge with 0 net worth
  let startValue = currentNetWorth;
  for (let i = 0; i < daysSinceStart; i++) {
    startValue = (startValue - dailySavings) / (1 + dailyRate);
  }

  const targets: number[] = new Array(totalDays);
  targets[0] = startValue + dailySavings;

  for (let day = 1; day < totalDays; day++) {
    targets[day] = targets[day - 1] * (1 + dailyRate) + dailySavings;
  }

  return targets;
};

export const FIREGraph = () => {
  ledgerService = Ledger.get_default();

  const GRAPH_CONFIG = {
    BALANCE_OVER_TIME: {
      name: "Balance over time",
      values: bind(ledgerService!, "balancesOverTime"),
      calculateFit: true,
      cssClass: CSS_CLASSES.BALANCE,
      xIntersect: {
        enable: true,
        label: true,
        labelTransform: formatLargeNumber,
      },
    },
    FIRE_TARGET: {
      name: "FIRE target",
      values: fireDailySavingsTarget(23, 0, 2_000_000, 45, 0.07, 23, 27).slice(
        365 * 1,
        365 * 3,
      ),
      cssClass: CSS_CLASSES.TARGET,
      dashed: true,
      xIntersect: {
        enable: true,
        label: true,
        labelTransform: formatLargeNumber,
      },
    },
  } as const;

  return Widget.Box({
    children: [
      InteractiveGraph({
        wRequest: 1000,
        hRequest: 1000,
        yIntersectLabel: true,
        grid: {
          enable: true,
          xStepPercent: 15,
          yStepPercent: 10,
        },
        graphs: [GRAPH_CONFIG.BALANCE_OVER_TIME, GRAPH_CONFIG.FIRE_TARGET],
        cssClass: CSS_CLASSES.FIRE_GRAPH_WIDGET,
      }),
    ],
  });
};
