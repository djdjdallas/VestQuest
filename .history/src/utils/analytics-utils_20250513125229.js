// src/utils/analytics-utils.js
import { differenceInDays, format, addMonths } from "date-fns";
import { calculateVestedShares } from "@/utils/calculations";
import { calculateDetailedVesting } from "@/utils/enhanced-vesting-calculations";
import { safeValue } from "@/utils/format-utils";

// Constants
export const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export const processAnalyticsData = (
  grants,
  scenarios,
  timeframe,
  companyFilter
) => {
  // Filter grants based on company
  const filteredGrants =
    companyFilter !== "all"
      ? grants.filter((grant) => grant.company_name === companyFilter)
      : grants;

  // Apply timeframe filter
  // ... rest of the processing logic

  return {
    totalShares,
    vestedShares,
    // ... all computed analytics
  };
};

export const generateVestingForecast = (
  grant,
  vestingForecast,
  valueForecast
) => {
  // Forecast generation logic
};

export const generatePortfolioHistory = (grants) => {
  // Portfolio history generation logic
};

export const processScenarioComparisons = (scenarios, grants) => {
  // Scenario comparisons logic
};
