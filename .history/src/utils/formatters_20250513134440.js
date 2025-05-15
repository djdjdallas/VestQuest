// src/utils/formatters.js

/**
 * Utility to format currency values with locale settings
 * @param {number} value - The value to format as currency
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = "USD") {
  const numValue = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Utility to format percentage values
 * @param {number} value - The value to format as percentage
 * @param {number} fractionDigits - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, fractionDigits = 1) {
  const numValue = Number(value) || 0;
  return numValue.toFixed(fractionDigits) + "%";
}

/**
 * Utility to format number values with locale settings
 * @param {number} value - The value to format
 * @returns {string} Formatted number string
 */
export function formatNumber(value) {
  const numValue = Number(value) || 0;
  return new Intl.NumberFormat("en-US").format(numValue);
}

/**
 * Utility to format date values
 * @param {Date|string} date - The date to format
 * @param {string} formatStr - The format string (default: MMMM d, yyyy)
 * @returns {string} Formatted date string
 */
export function formatDate(date, formatStr = "MMMM d, yyyy") {
  if (!date) return "";

  // If a string is provided, convert to date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if date is valid
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "";

  // Use a date formatting library if available
  if (typeof format === "function") {
    return format(dateObj, formatStr);
  }

  // Simple fallback
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Safely retrieve a value with a default
 * @param {any} value - The value to check
 * @param {any} defaultValue - The default value to use if original is undefined/null
 * @returns {any} The original value or default if undefined/null
 */
export function safeValue(value, defaultValue = 0) {
  return value !== undefined && value !== null ? value : defaultValue;
}
