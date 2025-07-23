/**
 * █▀ █▀█ █▀▀ █▄░█ █▀▄ █ █▄░█ █▀▀   █▄▄ █▀█ █▀▀ ▄▀█ █▄▀ █▀▄ █▀█ █░█░█ █▄░█
 * ▄█ █▀▀ ██▄ █░▀█ █▄▀ █ █░▀█ █▄█   █▄█ █▀▄ ██▄ █▀█ █░█ █▄▀ █▄█ ▀▄▀▄▀ █░▀█
 *
 * Displays a breakdown of monthly spending in an interactive pie chart.
 * Provides visual representation of spending categories for budget analysis.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import { bind } from "astal";

import PieChart from "@/components/PieChart.ts";
import { Services } from "@/services/LazyService";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerService = Services.ledger;

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  widgetContainer: "widget-container",
  widgetHeader: "widget-header",
  breakdown: "breakdown",
} as const;

const LAYOUT = {
  chartContainerSpacing: 24,
  breakdownSectionSpacing: 20,
} as const;

const LABELS = {
  sectionHeader: "Recent Spending",
} as const;

const CHART_CONFIG = {
  showLegend: true,
} as const;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Creates the pie chart widget with spending data.
 * @param spendingBreakdown - Object containing category spending data
 * @returns PieChart widget configured with spending data
 */
const createSpendingPieChart = (spendingBreakdown: Record<string, number>) =>
  PieChart({
    values: spendingBreakdown,
    drawLegend: CHART_CONFIG.showLegend,
  });

/**
 * Creates the container that holds the pie chart.
 * Renders the chart only when spending data is available.
 * @returns Widget containing the pie chart or empty state
 */
const createChartContainer = () =>
  Widget.Box({
    hpack: "center",
    vpack: "center",
    spacing: LAYOUT.chartContainerSpacing,
    children: bind(ledgerService, "monthlyCategorySpending").as(
      (spendingBreakdown) => {
        if (spendingBreakdown === undefined) {
          // Return empty array when no data is available
          // TODO: Consider adding a loading state or empty state message
          return [];
        }

        return [createSpendingPieChart(spendingBreakdown)];
      },
    ),
  });

/**
 * Creates the header widget for the breakdown section.
 * @returns Widget containing section header
 */
const createBreakdownHeader = () =>
  Widget.Label({
    label: LABELS.sectionHeader,
    cssClasses: [CSS_CLASSES.widgetHeader],
  });

/**
 * Creates the main content section containing header and chart.
 * @returns Widget containing breakdown content with proper spacing and alignment
 */
const createBreakdownContent = () =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.breakdown],
    orientation: Gtk.Orientation.VERTICAL,
    halign: Gtk.Align.CENTER,
    spacing: LAYOUT.breakdownSectionSpacing,
    children: [createBreakdownHeader(), createChartContainer()],
  });

/**
 * Main breakdown component that displays monthly spending analysis.
 * Shows a pie chart visualization of spending categories to help users
 * understand their spending patterns and budget allocation.
 * @returns Widget containing the complete spending breakdown interface
 */
export const SpendingBreakdown = () => {
  return Widget.Box({
    vertical: true,
    hexpand: true,
    cssClasses: [CSS_CLASSES.widgetContainer],
    children: [createBreakdownContent()],
  });
};
