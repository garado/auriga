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
import { MonthlySpendBarGraph } from "./MonthlySpendBarGraph";

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

export const Analytics = () => {
  return Widget.Box({
    vertical: false,
    hexpand: true,
    vexpand: true,
    children: [MonthlySpendBarGraph()],
  });
};
