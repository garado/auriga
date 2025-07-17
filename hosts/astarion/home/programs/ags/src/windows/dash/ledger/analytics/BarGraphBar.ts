/**
 * █▄▄ ▄▀█ █▀█   █▀▀ █▀█ ▄▀█ █▀█ █░█   █▄▄ ▄▀█ █▀█
 * █▄█ █▀█ █▀▄   █▄█ █▀▄ █▀█ █▀▀ █▀█   █▄█ █▀█ █▀▄
 *
 * Draws a singular bar graph bar using Cairo.
 * Renders a vertical bar with customizable dimensions and value representation.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, astalify } from "astal/gtk4";
import Gdk from "gi://Gdk";

import { setCairoColorFromClass } from "@/utils/Helpers";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const DrawingArea = astalify(Gtk.DrawingArea);

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  barGraph: "bar-graph",
  barBackground: "bar-graph-bar-bg",
  barForeground: "bar-graph-bar-fg",
} as const;

const DEFAULTS = {
  heightRequest: 500,
  widthRequest: 10,
  value: 0,
  minValue: 0,
  maxValue: 100,
  decimalPlaces: 0,
} as const;

/*****************************************************************************
 * Type definitions
 *****************************************************************************/

/** Configuration interface for the bar graph bar */
interface BarGraphBarProps {
  /** Height of the bar in pixels */
  heightRequest?: number;
  /** Width of the bar in pixels */
  widthRequest?: number;
  /** Current value to display */
  value?: number;
  /** Minimum possible value (for scaling) */
  minValue?: number;
  /** Maximum possible value (for scaling) */
  maxValue?: number;
  /** Number of decimal places for tooltip */
  decimalPlaces?: number;
  /** Optional CSS class for custom styling */
  cssClass?: string;
}

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Validates bar graph parameters to prevent rendering errors.
 * @param value - The current value
 * @param minValue - The minimum value
 * @param maxValue - The maximum value
 * @returns Object containing validation result and normalized values
 */
const validateBarParameters = (
  value: number,
  minValue: number,
  maxValue: number,
) => {
  const isValidRange = maxValue > minValue;
  const clampedValue = Math.max(minValue, Math.min(maxValue, value));
  const normalizedValue = isValidRange
    ? (clampedValue - minValue) / (maxValue - minValue)
    : 0;

  return {
    isValid: isValidRange,
    normalizedValue,
    clampedValue,
  };
};

/**
 * Draws the bar background (empty/unfilled portion).
 * @param cr - The Cairo drawing context
 * @param width - Bar width
 * @param height - Bar height
 * @param filledHeight - Height of the filled portion
 */
const drawBarBackground = (
  cr: any,
  width: number,
  height: number,
  filledHeight: number,
): void => {
  setCairoColorFromClass(cr, CSS_CLASSES.barBackground);

  // Draw the unfilled portion at the top
  const backgroundHeight = height - filledHeight;
  cr.rectangle(0, 0, width, backgroundHeight);
  cr.fill();
};

/**
 * Draws the bar foreground (filled portion).
 * @param cr - The Cairo drawing context
 * @param width - Bar width
 * @param height - Bar height
 * @param filledHeight - Height of the filled portion
 */
const drawBarForeground = (
  cr: any,
  width: number,
  height: number,
  filledHeight: number,
): void => {
  setCairoColorFromClass(cr, CSS_CLASSES.barForeground);

  // Draw the filled portion at the bottom
  const startY = height - filledHeight;
  cr.rectangle(0, startY, width, filledHeight);
  cr.fill();
};

/**
 * Formats the tooltip text for the bar.
 * @param value - The value to display
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted tooltip string
 */
const formatTooltipText = (value: number, decimalPlaces: number): string => {
  return value.toFixed(decimalPlaces);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Creates a single bar for a bar graph using Cairo drawing.
 * The bar fills from bottom to top based on the value relative to min/max range.
 *
 * @param props - Configuration object for the bar
 * @returns Widget containing the rendered bar
 */
export default ({
  heightRequest = DEFAULTS.heightRequest,
  widthRequest = DEFAULTS.widthRequest,
  value = DEFAULTS.value,
  minValue = DEFAULTS.minValue,
  maxValue = DEFAULTS.maxValue,
  decimalPlaces = DEFAULTS.decimalPlaces,
  cssClass,
}: BarGraphBarProps = {}) => {
  const { isValid, normalizedValue, clampedValue } = validateBarParameters(
    value,
    minValue,
    maxValue,
  );

  if (!isValid) {
    console.warn(
      `Invalid bar graph parameters: min=${minValue}, max=${maxValue}`,
    );
  }

  /**
   * Cairo drawing function that renders the bar.
   * @param self - The drawing area widget
   * @param cr - Cairo drawing context
   * @param width - Available width
   * @param height - Available height
   */
  const drawBar = (
    _self: any,
    cr: any,
    width: number,
    height: number,
  ): void => {
    const filledHeight = normalizedValue * height;
    drawBarBackground(cr, width, height, filledHeight);
    drawBarForeground(cr, width, height, filledHeight);
  };

  // Determine CSS classes to apply
  const appliedCssClasses = cssClass
    ? [CSS_CLASSES.barGraph, cssClass]
    : [CSS_CLASSES.barGraph];

  const barWidget = DrawingArea({
    hexpand: false,
    vexpand: false,
    widthRequest,
    heightRequest,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    cssClasses: appliedCssClasses,
    hasTooltip: true,
    tooltipText: formatTooltipText(clampedValue, decimalPlaces),
    cursor: Gdk.Cursor.new_from_name("pointer", null),
  });

  // Set the drawing function
  barWidget.set_draw_func(drawBar);

  return barWidget;
};
