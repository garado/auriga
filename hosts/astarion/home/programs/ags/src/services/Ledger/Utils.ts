/**
 * Parses a monetary amount string into a numeric value.
 * Handles various currency symbols and formatting.
 *
 * @param amountStr - String representation of monetary amount (e.g., "$1,234.56", "€500.00")
 * @returns Numeric value of the amount, or 0 if parsing fails
 */
export const parseAmount = (amountStr: string): number => {
  if (!amountStr || typeof amountStr !== "string") {
    return 0;
  }

  const cleaned = amountStr.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);

  if (isNaN(parsed)) {
    console.warn(`Failed to parse amount: "${amountStr}"`);
    return 0;
  }

  return parsed;
};
