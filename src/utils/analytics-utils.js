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
  if (!grants || grants.length === 0) {
    return {
      totalShares: 0,
      vestedShares: 0,
      unvestedShares: 0,
      currentValue: 0,
      exerciseCost: 0,
      potentialGain: 0,
      valueByGrantType: [],
      valueByCompany: [],
      vestingForecast: [],
      valueForecast: [],
      comparisonData: [],
      portfolioHistory: [],
      isoValue: 0,
      rsuValue: 0,
      isoPercentage: 0,
      rsuPercentage: 0,
    };
  }

  // Filter grants based on company if filter is set
  const filteredGrants =
    companyFilter !== "all"
      ? grants.filter((grant) => grant.company_name === companyFilter)
      : grants;

  // Apply timeframe filter if set - using constant time complexity approach
  const now = new Date();
  const timeframeDays = 
    timeframe === "month" ? 30 :
    timeframe === "quarter" ? 90 :
    timeframe === "year" ? 365 : 
    Number.MAX_SAFE_INTEGER; // "all" case
    
  const timeframeFilteredGrants = timeframe === "all" 
    ? filteredGrants 
    : filteredGrants.filter((grant) => {
        const grantDate = new Date(grant.grant_date);
        return differenceInDays(now, grantDate) <= timeframeDays;
      });

  // Calculate basic metrics using reduce for improved efficiency
  const initialMetrics = { 
    totalShares: 0, 
    vestedShares: 0, 
    unvestedShares: 0, 
    currentValue: 0, 
    exerciseCost: 0,
    isoValue: 0,
    rsuValue: 0,
    valueByGrantType: {},
    valueByCompany: {}
  };

  // Prepare data structures
  const vestingForecast = [];
  const valueForecast = [];

  // Process grants with a single reduce operation to minimize iterations  
  const metrics = timeframeFilteredGrants.reduce((acc, grant) => {
    if (!grant) return acc;

    // Use detailed vesting calculation for more accurate data
    const vestingDetails = calculateDetailedVesting(grant);
    const vested = vestingDetails.vestedShares;
    const unvested = vestingDetails.unvestedShares;
    const vestValue = vested * safeValue(grant.current_fmv, 0);
    const exCost = vested * safeValue(grant.strike_price, 0);
    const grantShares = safeValue(grant.shares, 0);

    // Update core metrics
    acc.totalShares += grantShares;
    acc.vestedShares += vested;
    acc.unvestedShares += unvested;
    acc.currentValue += vestValue;
    acc.exerciseCost += exCost;

    // Track values by grant type
    if (grant.grant_type) {
      const type = grant.grant_type.toLowerCase();
      acc.valueByGrantType[type] = safeValue(acc.valueByGrantType[type]) + vestValue;
      
      // Track ISO and RSU values separately for specific metrics
      if (type === 'iso') {
        acc.isoValue += vestValue;
      } else if (type === 'rsu') {
        acc.rsuValue += vestValue;
      }
    }

    // Track values by company
    if (grant.company_name) {
      acc.valueByCompany[grant.company_name] = 
        safeValue(acc.valueByCompany[grant.company_name]) + vestValue;
    }

    // Generate vesting forecast
    generateVestingForecast(grant, vestingForecast, valueForecast);

    return acc;
  }, initialMetrics);

  // Calculate ISO and RSU percentages
  const totalEquityValue = metrics.isoValue + metrics.rsuValue;
  const isoPercentage = totalEquityValue > 0 ? (metrics.isoValue / totalEquityValue) * 100 : 0;
  const rsuPercentage = totalEquityValue > 0 ? (metrics.rsuValue / totalEquityValue) * 100 : 0;

  // Convert to arrays for charts with proper sorting by value (descending)
  const valueByGrantTypeArray = Object.entries(metrics.valueByGrantType)
    .map(([type, value]) => ({
      name: type || "Unknown",
      value: safeValue(value),
    }))
    .sort((a, b) => b.value - a.value);

  const valueByCompanyArray = Object.entries(metrics.valueByCompany)
    .map(([company, value]) => ({
      name: company || "Unknown",
      value: safeValue(value),
    }))
    .sort((a, b) => b.value - a.value);

  // Add percentage to company values for visualization
  const totalCompanyValue = valueByCompanyArray.reduce((sum, item) => sum + item.value, 0);
  valueByCompanyArray.forEach(company => {
    company.percentage = totalCompanyValue > 0 
      ? (company.value / totalCompanyValue) * 100 
      : 0;
  });

  // Sort and process forecasts (limit to 12 months)
  // Debug the vesting forecast before sorting
  console.log("Raw vesting forecast before sorting:", vestingForecast);
  
  // Handle potential empty arrays and ensure proper date parsing
  const sortedVestingForecast = (vestingForecast || [])
    .sort((a, b) => {
      // Parse date strings properly
      try {
        const dateA = a.dateKey ? new Date(a.dateKey.substring(0, 4), parseInt(a.dateKey.substring(5)) - 1) : new Date(a.date);
        const dateB = b.dateKey ? new Date(b.dateKey.substring(0, 4), parseInt(b.dateKey.substring(5)) - 1) : new Date(b.date);
        return dateA - dateB;
      } catch (e) {
        console.error("Error sorting dates:", e);
        return 0;
      }
    })
    .slice(0, 12);
  
  console.log("Sorted vesting forecast:", sortedVestingForecast);

  const sortedValueForecast = (valueForecast || [])
    .sort((a, b) => {
      try {
        const dateA = a.dateKey ? new Date(a.dateKey.substring(0, 4), parseInt(a.dateKey.substring(5)) - 1) : new Date(a.date);
        const dateB = b.dateKey ? new Date(b.dateKey.substring(0, 4), parseInt(b.dateKey.substring(5)) - 1) : new Date(b.date);
        return dateA - dateB;
      } catch (e) {
        console.error("Error sorting dates:", e);
        return 0;
      }
    })
    .slice(0, 12);

  // Process historical and projected vesting data
  const portfolioHistory = generatePortfolioHistory(timeframeFilteredGrants);

  // Process scenario comparisons
  const comparisonData = processScenarioComparisons(
    scenarios,
    timeframeFilteredGrants
  );

  // Calculate potential gain
  const potentialGain = metrics.currentValue - metrics.exerciseCost;

  return {
    totalShares: metrics.totalShares,
    vestedShares: metrics.vestedShares,
    unvestedShares: metrics.unvestedShares,
    currentValue: metrics.currentValue,
    exerciseCost: metrics.exerciseCost,
    potentialGain,
    valueByGrantType: valueByGrantTypeArray,
    valueByCompany: valueByCompanyArray,
    companyValues: valueByCompanyArray, // For backwards compatibility
    vestingForecast: sortedVestingForecast,
    valueForecast: sortedValueForecast,
    comparisonData,
    portfolioHistory,
    isoValue: metrics.isoValue,
    rsuValue: metrics.rsuValue,
    isoPercentage,
    rsuPercentage,
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
  if (!grant.vesting_end_date) {
    console.log(`Skipping grant ${grant.id || 'unknown'}: missing vesting_end_date`);
    return;
  }

  const endDate = new Date(grant.vesting_end_date);
  if (isNaN(endDate.getTime())) {
    console.log(`Skipping grant ${grant.id || 'unknown'}: invalid vesting_end_date format ${grant.vesting_end_date}`);
    return;
  }
  
  if (today > endDate) {
    console.log(`Skipping grant ${grant.id || 'unknown'}: vesting already completed (end date: ${endDate.toISOString()}, today: ${today.toISOString()})`);
    return;
  }

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

  // Make a copy of the grant to safely modify it for calculations
  const grantCopy = { ...grant };
  
  // Create forecast entries for the next 24 months
  for (let i = 0; i < 24; i += intervalMonths) {
    const forecastDate = addMonths(today, i);
    if (forecastDate > endDate) break;

    // Debug for vesting calculation
    console.log(`Calculating vesting for grant ${grant.id || 'unknown'} for date ${forecastDate}`);
    
    const vestedAtStart = calculateVestedShares(grant, today);
    const vestedAtForecast = calculateVestedShares(grant, forecastDate);
    const newlyVestedShares = Math.max(0, vestedAtForecast - vestedAtStart);
    
    console.log(`Vested at start: ${vestedAtStart}, Vested at forecast: ${vestedAtForecast}, Newly vested: ${newlyVestedShares}`);

    // Force at least one entry if this is our only grant
    const forceEntry = i === 0 && vestingForecast.length === 0 && grant.shares > 0;
    
    // Skip if no shares vest in this period (unless forcing an entry)
    if (newlyVestedShares <= 0 && !forceEntry) {
      console.log('No newly vested shares in this period, skipping');
      continue;
    }
    
    // If forcing an entry, create a minimal vesting event
    const sharesToVest = forceEntry && newlyVestedShares === 0 ? 1 : newlyVestedShares;

    const dateKey = format(forecastDate, "yyyy-MM");
    const formattedDate = format(forecastDate, "MMM yyyy");

    // Update vesting forecast
    const existingVestingEntry = vestingForecast.find(
      (entry) => entry.dateKey === dateKey
    );

    if (existingVestingEntry) {
      existingVestingEntry.value += sharesToVest;
      // Ensure company name is properly added to existing entry
      if (grant.company_name) {
        existingVestingEntry[grant.company_name] = 
          safeValue(existingVestingEntry[grant.company_name]) + sharesToVest;
      }
    } else {
      // Create new entry with consistent structure
      const entry = {
        dateKey,
        date: formattedDate,
        value: sharesToVest,
      };
      
      // Add company-specific data point
      if (grant.company_name) {
        entry[grant.company_name] = sharesToVest;
      }
      
      vestingForecast.push(entry);
      console.log(`Added new vesting forecast entry for ${formattedDate}: ${sharesToVest} shares`);
    }

    // Update value forecast
    const value = sharesToVest * safeValue(grant.current_fmv, 0);
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
      console.log(`Added new value forecast entry for ${formattedDate}: ${value} value`);
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
