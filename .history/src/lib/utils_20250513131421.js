import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/lib/utils.js

/**
 * Format a number as USD currency
 * @param {number} value - The value to format
 * @param {boolean} abbreviate - Whether to abbreviate large numbers
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, abbreviate = false) => {
  if (value === null || value === undefined) return "-";

  if (abbreviate && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (abbreviate && value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a date to a readable string
 * @param {string|Date} date - The date to format
 * @param {string} format - Format style ('short', 'medium', 'long')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "medium") => {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options = {
    short: { month: "short", year: "2-digit" },
    medium: { month: "short", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
  };

  return dateObj.toLocaleDateString("en-US", options[format] || options.medium);
};

// Add other utility functions as needed
