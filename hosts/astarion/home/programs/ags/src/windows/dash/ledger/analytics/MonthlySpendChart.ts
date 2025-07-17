/**
 * █▀▄▀█ █▀█ █▄░█ ▀█▀ █░█ █░░ █▄█   █▀ █▀█ █▀▀ █▄░█ █▀▄   █▀▀ █░█ ▄▀█ █▀█ ▀█▀
 * █░▀░█ █▄█ █░▀█ ░█░ █▀█ █▄▄ ░█░   ▄█ █▀▀ ██▄ █░▀█ █▄▀   █▄▄ █▀█ █▀█ █▀▄ ░█░
 *
 * Monthly spending bar graph component.
 * Displays spending data organized by category and month with interactive bar charts.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import Ledger from "@/services/Ledger";
import { bind } from "astal";
import Bar from "./BarGraphBar";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const ledgerService = Ledger.get_default();

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  widgetContainer: "widget-container",
  widgetHeader: "widget-header",
  barGraph: "bar-graph",
  categoryContainer: "category-container",
  categoryLabel: "category-label",
  averageLabel: "average-label",
  monthLabel: "month-label",
} as const;

const LAYOUT = {
  categorySpacing: 20,
  barSpacing: 5,
  barHeight: 500,
  barWidth: 10,
} as const;

const FORMATTING = {
  averageDecimalPlaces: 2,
} as const;

const MONTH_LABELS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
] as const;

/*****************************************************************************
 * Type definitions
 *****************************************************************************/

/** Interface for monthly spending data structure */
interface MonthlySpendingData {
  subcategories: {
    [categoryName: string]: {
      subtotal: number[];
    };
  };
}

/** Interface for processed category data */
interface CategoryData {
  name: string;
  monthlyTotals: number[];
  average: number;
}

/*****************************************************************************
 * Utility functions
 *****************************************************************************/

/**
 * Calculates the maximum value across all categories and months.
 * @param spendingData - The monthly spending data
 * @returns Maximum value for scaling bars, or 1 as fallback
 */
const calculateMaximumValue = (spendingData: MonthlySpendingData): number => {
  const allValues = Object.values(spendingData.subcategories)
    .flatMap((subcategory) => subcategory.subtotal)
    .filter((value) => typeof value === "number" && !isNaN(value));

  if (allValues.length === 0) {
    return 1; // Fallback to prevent division by zero
  }

  return Math.max(...allValues);
};

/**
 * Calculates the average of an array of numbers.
 * @param values - Array of numeric values
 * @returns Average value, or 0 if array is empty
 */
const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
};

/**
 * Formats an average value for display.
 * @param average - The average value to format
 * @returns Formatted string with appropriate decimal places
 */
const formatAverage = (average: number): string => {
  return average.toFixed(FORMATTING.averageDecimalPlaces);
};

/**
 * Gets the appropriate month label for recent months.
 * Calculates the actual month based on current date and data position.
 * @param dataIndex - Index in the data array (0 = oldest month in data)
 * @param totalMonths - Total number of months in the data
 * @returns Month abbreviation for the actual calendar month
 *
 * @TODO totalMonths hardcoded to 3! should be user-configurable
 */
const getMonthLabel = (dataIndex: number, totalMonths: number = 3): string => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan = 0, Dec = 11)

  // Calculate which month this data index represents
  // If we have 3 months of data, dataIndex 0 = 2 months ago, dataIndex 2 = current month
  const monthsBack = totalMonths - 1 - dataIndex;
  const actualMonth = (currentMonth - monthsBack + 12) % 12;

  return MONTH_LABELS[actualMonth] || dataIndex.toString();
};

/*****************************************************************************
 * Widget creation functions
 *****************************************************************************/

/**
 * Creates a single bar with month label.
 * @param value - The spending value for this month
 * @param monthIndex - Index of the month (for labeling)
 * @param maxValue - Maximum value for scaling
 * @returns Widget containing bar and month label
 */
const createMonthBarWidget = (
  value: number,
  monthIndex: number,
  maxValue: number,
) => {
  const barWidget = Bar({
    heightRequest: LAYOUT.barHeight,
    widthRequest: LAYOUT.barWidth,
    value,
    minValue: 0,
    maxValue,
    decimalPlaces: FORMATTING.averageDecimalPlaces,
  });

  const monthLabel = Widget.Label({
    cssClasses: [CSS_CLASSES.monthLabel],
    halign: Gtk.Align.CENTER,
    label: getMonthLabel(monthIndex),
  });

  return Widget.Box({
    vertical: true,
    children: [barWidget, monthLabel],
  });
};

/**
 * Creates the bar chart section for a category.
 * @param monthlyTotals - Array of monthly spending totals
 * @param maxValue - Maximum value for scaling
 * @returns Widget containing all monthly bars for the category
 */
const createCategoryBarChart = (monthlyTotals: number[], maxValue: number) =>
  Widget.Box({
    vertical: false,
    spacing: LAYOUT.barSpacing,
    halign: Gtk.Align.CENTER,
    children: monthlyTotals.map((total, monthIndex) =>
      createMonthBarWidget(total, monthIndex, maxValue),
    ),
  });

/**
 * Creates the category name label.
 * @param categoryName - Name of the spending category
 * @returns Widget containing category label
 */
const createCategoryNameLabel = (categoryName: string) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.categoryLabel],
    label: categoryName,
  });

/**
 * Creates the average spending label.
 * @param average - The calculated average spending
 * @returns Widget containing average label
 */
const createAverageLabel = (average: number) =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.averageLabel],
    label: `${formatAverage(average)}`,
  });

/**
 * Creates a complete category widget with bars, labels, and statistics.
 * @param categoryData - Processed category data
 * @param maxValue - Maximum value for scaling bars
 * @returns Widget containing complete category visualization
 */
const createCategoryWidget = (categoryData: CategoryData, maxValue: number) => {
  const barChart = createCategoryBarChart(categoryData.monthlyTotals, maxValue);
  const nameLabel = createCategoryNameLabel(categoryData.name);
  const averageLabel = createAverageLabel(categoryData.average);

  return Widget.Box({
    cssClasses: [CSS_CLASSES.categoryContainer],
    vertical: true,
    children: [barChart, nameLabel, averageLabel],
  });
};

/**
 * Processes raw spending data into structured category data.
 * @param spendingData - Raw monthly spending data
 * @returns Array of processed category data
 */
const processSpendingData = (
  spendingData: MonthlySpendingData,
): CategoryData[] => {
  return Object.entries(spendingData.subcategories).map(
    ([categoryName, categoryInfo]) => ({
      name: categoryName,
      monthlyTotals: categoryInfo.subtotal,
      average: calculateAverage(categoryInfo.subtotal),
    }),
  );
};

/**
 * Creates the main container with all category widgets.
 * @param spendingData - The monthly spending data
 * @returns Widget containing all category visualizations
 */
const createCategoriesContainer = (spendingData: MonthlySpendingData) => {
  if (!spendingData || !spendingData.subcategories) {
    return Widget.Box({
      children: [
        Widget.Label({
          label: "No spending data available",
        }),
      ],
    });
  }

  const maxValue = calculateMaximumValue(spendingData);
  const categoryData = processSpendingData(spendingData);

  const container = Widget.Box({
    vertical: false,
    hexpand: true,
    vexpand: true,
    spacing: LAYOUT.categorySpacing,
  });

  categoryData.forEach((category) => {
    const categoryWidget = createCategoryWidget(category, maxValue);
    container.append(categoryWidget);
  });

  return container;
};

/**
 * Creates the header widget for the component.
 * @returns Widget containing section header
 */
const createComponentHeader = () =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.widgetHeader],
    label: "Spending by category, then by month",
  });

/**
 * Creates the centered container for the categories.
 * @returns Widget containing centered categories display
 */
const createCenteredCategoriesContainer = () =>
  Widget.Box({
    halign: Gtk.Align.CENTER,
    children: bind(ledgerService, "monthlySpendingByCategory").as(
      (spendingData) => createCategoriesContainer(spendingData),
    ),
  });

/*****************************************************************************
 * Main component
 *****************************************************************************/

/**
 * Main monthly spending bar graph component.
 * Displays spending data organized by category and month with interactive bar charts.
 * Each category shows monthly bars and average spending statistics.
 * @returns Widget containing the complete monthly spending visualization
 */
export const MonthlySpendChart = () => {
  return Widget.Box({
    name: "monthly-spending-bar-graph",
    cssClasses: [CSS_CLASSES.widgetContainer, CSS_CLASSES.barGraph],
    vertical: true,
    hexpand: true,
    vexpand: true,
    children: [createComponentHeader(), createCenteredCategoriesContainer()],
  });
};
