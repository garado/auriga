/**
 * █▀▄▀█ █ █▀ █▀▀   █░█ █▀▀ █░░ █▀█ █▀▀ █▀█   █▀▀ █░█ █▄░█ █▀▀ ▀█▀ █ █▀█ █▄░█ █▀
 * █░▀░█ █ ▄█ █▄▄   █▀█ ██▄ █▄▄ █▀▀ ██▄ █▀▄   █▀░ █▄█ █░▀█ █▄▄ ░█░ █ █▄█ █░▀█ ▄█
 *
 * Collection of frequently used helper functions.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk } from "astal/gtk4";

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Convert ISO8601 date to relative time
 *
 * @returns {string} the relative time
 *
 * @param {string} isoDate - an ISO8601 date, e.g. 20250630T070000Z => June 30, 2025, at 07:00:00 UTC
 */
export const relativeTimeFromISO = (isoDate: string): string => {
  // Ensure the input is in a valid ISO 8601 format with separators
  const formattedDate = isoDate.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z",
  );

  const targetDate = new Date(formattedDate);
  const now = new Date();

  const diffMs = targetDate.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffYears) >= 1) return rtf.format(diffYears, "year");
  if (Math.abs(diffMonths) >= 1) return rtf.format(diffMonths, "month");
  if (Math.abs(diffWeeks) >= 1) return rtf.format(diffWeeks, "week");
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, "hour");
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, "minute");

  return "just now";
};

/**
 * Format ISO date to custom format
 *
 * @param {string} isoDate - ISO date to convert
 */
export const formatISODateToCustomFormat = (isoDate: string): string => {
  // Ensure the input is in a valid ISO 8601 format with separators
  const formattedDate = isoDate.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z",
  );

  const date = new Date(formattedDate); // Parse the ISO 8601 date string
  if (isNaN(date.getTime())) {
    return "Invalid date"; // Handle invalid date input
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    day: "2-digit",
    month: "short", // Abbreviated month name
  };

  // Create a formatter with the options
  const formatter = new Intl.DateTimeFormat("en-GB", options);

  // Format the date
  return formatter.format(date).replace(",", ""); // Replace comma for desired format
};

/**
 * Given a CSS class name, return its `color` property.
 */
export const getCairoColorFromClass = (...rest: Array<string>): any => {
  const dummyWidget = new Gtk.Box();
  const dummyContext = dummyWidget.get_style_context();

  for (const c of rest) {
    dummyContext.add_class(c);
  }

  return dummyContext.get_color();
};

/**
 * Sets the Cairo context color from a CSS class.
 * @param cr - The Cairo drawing context
 * @param cssClass - CSS class name to get color from
 */
export const setCairoColorFromClass = (cr: any, cssClass: string): void => {
  const color = getCairoColorFromClass(cssClass);
  cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha);
};
