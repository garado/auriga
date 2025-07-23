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

import InteractiveGraph from "@/components/InteractiveGraph";
import { Services } from "@/services/LazyService";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerService = Services.ledger;

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

const GRAPH_CONFIG = {
  BALANCE_OVER_TIME: {
    name: "Balance over time",
    values: bind(ledgerService, "balancesOverTime"),
    calculateFit: true,
    cssClass: CSS_CLASSES.BALANCE,
    xIntersect: {
      enable: true,
      label: true,
      labelTransform: formatLargeNumber,
    },
  },

  // @TODO Make this user-configurable. Would be cool if runtime-configurable
  FIRE_TARGET: {
    name: "FIRE target",
    values: Array.from({ length: 365 * 2 }, (_, i) => i * 160),
    cssClass: CSS_CLASSES.TARGET,
    dashed: true,
    xIntersect: {
      enable: true,
      label: true,
      labelTransform: formatLargeNumber,
    },
  },
} as const;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

export const FIREGraph = () => {
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
