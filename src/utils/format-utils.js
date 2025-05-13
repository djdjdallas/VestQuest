// src/utils/format-utils.js

/**
 * Formats a number as a currency string
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a number as a percentage string
 * @param {number} value - The value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

/**
 * Returns the value if it's a valid number, otherwise returns a default value
 * @param {any} value - The value to check
 * @param {number} defaultValue - The default value to return if value is invalid
 * @returns {number} The value or default
 */
export const safeValue = (value, defaultValue = 0) => {
  return typeof value === "number" && !isNaN(value) ? value : defaultValue;
};

/**
 * Chart colors used throughout the application
 */
export const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

/**
 * Custom tooltip formatter for charts
 * @param {number} value - The value to format
 * @param {string} name - The name of the data point
 * @returns {Array} Formatted value and name
 */
export const customTooltipFormatter = (value, name) => {
  if (
    typeof name === "string" &&
    (name.includes("ROI") || name.includes("Percentage"))
  ) {
    return [`${safeValue(value).toFixed(1)}%`, name];
  }
  return [formatCurrency(value), name];
};
