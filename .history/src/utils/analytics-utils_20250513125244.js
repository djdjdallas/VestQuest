// src/utils/analytics-utils.js

import { differenceInDays, format, addMonths } from "date-fns";
import { calculateVestedShares } from "@/utils/calculations";
import { calculateDetailedVesting } from "@/utils/enhanced-vesting-calculations";
import { safeValue } from "@/utils/format-utils";

/**
 * Processes data for analytics based on grants and scenarios
 * @param {Array} grants - List of equity grants
 * @param {Array} scenarios - List of scenarios
 * @param {string} timeframe - Filter timeframe (all, month, quarter, year)
 * @param {string} companyFilter - Filter by company name or "all"
 * @returns {Object} Processed analytics data
 */
export const processAnalyticsData = (
  grants,
  scenarios,
  timeframe,
  companyFilter
) => {
  // Filter grants based on company if filter is set
  const filteredGrants =
    companyFilter !== "all"
      ? grants.filter((grant) => grant.company_name === companyFilter)
      : grants;

  // Apply timeframe filter if set
  const now = new Date();
  const timeframeFilteredGrants = filteredGrants.filter((grant) => {
    if (timeframe === "all") return true;

    const grantDate = new Date(grant.grant_date);
    if (timeframe === "month") {
      return differenceInDays(now, grantDate) <= 30;
    } else if (timeframe === "quarter") {
      return differenceInDays(now, grantDate) <= 90;
    } else if (timeframe === "year") {
      return differenceInDays(now, grantDate) <= 365;
    }
    return true;
  });

  // Calculate basic metrics
  let totalShares = 0;
  let vestedShares = 0;
  let unvestedShares = 0;
  let currentValue = 0;
  let exerciseCost = 0;

  // Create data structures for charts
  const valueByGrantType = {};
  const valueByCompany = {};
  const vestingForecast = [];
  const valueForecast = [];

  // Process each grant
  timeframeFilteredGrants.forEach((grant) => {
    if (!grant) return;

    // Use detailed vesting calculation for more accurate data
    const vestingDetails = calculateDetailedVesting(grant);
    const vested = vestingDetails.vestedShares;
    const unvested = vestingDetails.unvestedShares;
    const vestValue = vested * safeValue(grant.current_fmv, 0);
    const exCost = vested * safeValue(grant.strike_price, 0);

    totalShares += safeValue(grant.shares, 0);
    vestedShares += vested;
    unvestedShares += unvested;
    currentValue += vestValue;
    exerciseCost += exCost;

    // Accumulate by grant type
    if (grant.grant_type) {
      valueByGrantType[grant.grant_type] =
        safeValue(valueByGrantType[grant.grant_type]) + vestValue;
    }

    // Accumulate by company
    if (grant.company_name) {
      valueByCompany[grant.company_name] =
        safeValue(valueByCompany[grant.company_name]) + vestValue;
    }

    // Generate vesting forecast
    generateVestingForecast(grant, vestingForecast, valueForecast);
  });

  // Convert to arrays for charts
  const valueByGrantTypeArray = Object.entries(valueByGrantType).map(
    ([type, value]) => ({
      name: type || "Unknown",
      value: safeValue(value),
    })
  );

  const valueByCompanyArray = Object.entries(valueByCompany).map(
    ([company, value]) => ({
      name: company || "Unknown",
      value: safeValue(value),
    })
  );

  // Sort and process forecasts
  const sortedVestingForecast = vestingForecast
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 12); // Limit to next 12 months

  const sortedValueForecast = valueForecast
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 12); // Limit to next 12 months

  // Process historical and projected vesting data
  const portfolioHistory = generatePortfolioHistory(timeframeFilteredGrants);

  // Process scenario comparisons
  const comparisonData = processScenarioComparisons(
    scenarios,
    timeframeFilteredGrants
  );

  // Calculate potential gain
  const potentialGain = currentValue - exerciseCost;

  return {
    totalShares,
    vestedShares,
    unvestedShares,
    currentValue,
    exerciseCost,
    potentialGain,
    valueByGrantType: valueByGrantTypeArray,
    valueByCompany: valueByCompanyArray,
    vestingForecast: sortedVestingForecast,
    valueForecast: sortedValueForecast,
    comparisonData,
    portfolioHistory,
  };
};

/**
 * Generate vesting forecast for the next 24 months
 * @param {Object} grant - The equity grant
 * @param {Array} vestingForecast - Array to store vesting forecast
 * @param {Array} valueForecast - Array to store value forecast
 */
export const generateVestingForecast = (
  grant,
  vestingForecast,
  valueForecast
) => {
  if (!grant) return;

  const today = new Date();
  if (!grant.vesting_end_date) return;

  const endDate = new Date(grant.vesting_end_date);
  if (isNaN(endDate.getTime()) || today > endDate) return;

  // Determine vesting interval
  const schedule = grant.vesting_schedule || "monthly";
  let intervalMonths;

  switch (schedule) {
    case "monthly":
      intervalMonths = 1;
      break;
    case "quarterly":
      intervalMonths = 3;
      break;
    case "yearly":
      intervalMonths = 12;
      break;
    default:
      intervalMonths = 1;
  }

  // Create forecast entries for the next 24 months
  for (let i = 0; i < 24; i += intervalMonths) {
    const forecastDate = addMonths(today, i);
    if (forecastDate > endDate) break;

    const vestedAtStart = calculateVestedShares(grant, today);
    const vestedAtForecast = calculateVestedShares(grant, forecastDate);
    const newlyVestedShares = Math.max(0, vestedAtForecast - vestedAtStart);

    if (newlyVestedShares <= 0) continue;

    const dateKey = format(forecastDate, "yyyy-MM");
    const formattedDate = format(forecastDate, "MMM yyyy");

    // Update vesting forecast
    const existingVestingEntry = vestingForecast.find(
      (entry) => entry.dateKey === dateKey
    );

    if (existingVestingEntry) {
      existingVestingEntry.value += newlyVestedShares;
      existingVestingEntry[grant.company_name] =
        safeValue(existingVestingEntry[grant.company_name]) + newlyVestedShares;
    } else {
      const entry = {
        dateKey,
        date: formattedDate,
        value: newlyVestedShares,
      };
      if (grant.company_name) {
        entry[grant.company_name] = newlyVestedShares;
      }
      vestingForecast.push(entry);
    }

    // Update value forecast
    const value = newlyVestedShares * safeValue(grant.current_fmv, 0);
    const existingValueEntry = valueForecast.find(
      (entry) => entry.dateKey === dateKey
    );

    if (existingValueEntry) {
      existingValueEntry.value += value;
      if (grant.company_name) {
        existingValueEntry[grant.company_name] =
          safeValue(existingValueEntry[grant.company_name]) + value;
      }
    } else {
      const entry = {
        dateKey,
        date: formattedDate,
        value,
      };
      if (grant.company_name) {
        entry[grant.company_name] = value;
      }
      valueForecast.push(entry);
    }
  }
};

/**
 * Generate historical and projected portfolio value
 * @param {Array} grants - List of equity grants
 * @returns {Array} Portfolio history data points
 */
export const generatePortfolioHistory = (grants) => {
  // Create data points from grant dates to future projections
  const dataPoints = [];
  const now = new Date();
  const earliestDate = grants.reduce((earliest, grant) => {
    const grantDate = new Date(grant.grant_date);
    return grantDate < earliest ? grantDate : earliest;
  }, now);

  // Create quarterly data points
  const startQuarter = new Date(earliestDate);
  startQuarter.setDate(1);
  startQuarter.setMonth(Math.floor(startQuarter.getMonth() / 3) * 3);

  // Generate data for past quarters
  for (
    let date = new Date(startQuarter);
    date <= now;
    date = addMonths(date, 3)
  ) {
    let totalValue = 0;

    grants.forEach((grant) => {
      // Only include grants that existed at this point
      if (new Date(grant.grant_date) <= date) {
        const vested = calculateVestedShares(grant, date);
        // Use historical FMV if we had it, but for now use current_fmv
        totalValue += vested * grant.current_fmv;
      }
    });

    dataPoints.push({
      date: format(date, "yyyy-MM"),
      value: totalValue,
      projected: false,
    });
  }

  // Generate projections for future quarters
  for (let i = 1; i <= 3; i++) {
    const projectedDate = addMonths(now, i * 3);
    let projectedValue = 0;

    grants.forEach((grant) => {
      const vested = calculateVestedShares(grant, projectedDate);
      // Apply growth factor for projections (10% growth per quarter in this example)
      const growthFactor = Math.pow(1.025, i); // 2.5% quarterly growth
      projectedValue += vested * grant.current_fmv * growthFactor;
    });

    dataPoints.push({
      date: format(projectedDate, "yyyy-MM"),
      value: projectedValue,
      projected: true,
    });
  }

  return dataPoints;
};

/**
 * Process scenario comparisons
 * @param {Array} scenarios - List of scenarios
 * @param {Array} grants - List of equity grants
 * @returns {Array} Processed scenario comparison data
 */
export const processScenarioComparisons = (scenarios, grants) => {
  if (!scenarios || scenarios.length === 0) return [];

  return scenarios
    .map((scenario) => {
      if (!scenario) return null;

      // Find related grant
      const relatedGrant = grants.find((g) => g && g.id === scenario.grant_id);

      // Calculate potential values
      const exerciseCost = relatedGrant
        ? (safeValue(scenario.shares_included) ||
            safeValue(relatedGrant.shares, 0)) *
          safeValue(relatedGrant.strike_price, 0)
        : 0;

      const exitValue =
        safeValue(scenario.share_price, 0) *
        (safeValue(scenario.shares_included) ||
          (relatedGrant ? safeValue(relatedGrant.shares, 0) : 0));

      // Calculate tax liability (more sophisticated in real implementation)
      const taxRate = 0.3; // This should come from actual tax calculations
      const taxes = Math.max(0, (exitValue - exerciseCost) * taxRate);
      const netValue = exitValue - exerciseCost - taxes;

      return {
        name: scenario.name || "Unnamed Scenario",
        exit_type: scenario.exit_type || "Unknown",
        exerciseCost,
        grossValue: exitValue,
        taxes,
        netValue,
      };
    })
    .filter(Boolean)
    .sort((a, b) => safeValue(b.netValue) - safeValue(a.netValue));
};
