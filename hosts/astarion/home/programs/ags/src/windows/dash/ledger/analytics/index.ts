/**
 * ▄▀█ █▄░█ ▄▀█ █░░ █▄█ ▀█▀ █ █▀▀ █▀
 * █▀█ █░▀█ █▀█ █▄▄ ░█░ ░█░ █ █▄▄ ▄█
 *
 * Entrypoint for analytics page of ledger tab.
 *
 * Displays more intricate information from hledger.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { MonthlySpendChart } from "./MonthlySpendChart";

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

export const Analytics = () => {
  return Widget.Box({
    vertical: false,
    hexpand: true,
    vexpand: true,
    children: [MonthlySpendChart()],
  });
};
