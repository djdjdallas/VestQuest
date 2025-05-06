// src/utils/enhancedTaxCalculations.js

/**
 * Enhanced tax calculation utility with comprehensive AMT modeling and multi-state support
 */

/**
 * Calculate AMT with proper exemption phase-outs
 * @param {Object} params - Tax calculation parameters
 * @param {number} params.income - Regular taxable income
 * @param {number} params.amtIncome - AMT income adjustments (like ISO spread)
 * @param {number} params.amtCredits - Prior year AMT credits
 * @param {number} params.year - Tax year
 * @returns {Object} AMT calculation results with detailed breakdown
 */
export function calculateAMT({
  income,
  amtIncome,
  amtCredits = 0,
  year = new Date().getFullYear(),
}) {
  // Get AMT parameters for the specific tax year
  const { exemptionAmount, phaseoutThreshold, phaseoutRate, rate } =
    getAMTParams(year);

  // Calculate AMT income
  const totalAMTIncome = income + amtIncome;

  // Calculate exemption with phase-out
  let exemption = exemptionAmount;
  if (totalAMTIncome > phaseoutThreshold) {
    // Phase out exemption - reduce by 25% of amount over threshold
    const phaseoutAmount = Math.min(
      exemptionAmount,
      (totalAMTIncome - phaseoutThreshold) * phaseoutRate
    );
    exemption -= phaseoutAmount;
  }

  // Calculate AMT tax
  const amtTaxableIncome = Math.max(0, totalAMTIncome - exemption);
  const amtTax = amtTaxableIncome * rate;

  // Compare to regular tax (simplified for the example)
  const regularTax = calculateRegularTax(income, year);

  // AMT is the excess of AMT calculation over regular tax
  const amtExcess = Math.max(0, amtTax - regularTax);

  // Apply available AMT credits
  const amtCreditUsed = Math.min(amtCredits, amtExcess);
  const remainingAMTCredit = amtCredits - amtCreditUsed;
  const netAMTDue = amtExcess - amtCreditUsed;

  // New AMT credit generated this year (for future years)
  const newAMTCredit = netAMTDue;

  return {
    amtTaxableIncome,
    exemption,
    amtTax,
    regularTax,
    amtExcess,
    amtCreditUsed,
    remainingAMTCredit,
    netAMTDue,
    newAMTCredit,
    effectiveTaxRate: income > 0 ? (regularTax + netAMTDue) / income : 0,
    breakdown: {
      exemptionAmount,
      phaseoutThreshold,
      phaseoutAmount: exemptionAmount - exemption,
      rate,
    },
  };
}

/**
 * Calculate multi-state tax allocation
 * @param {Object} params - Tax calculation parameters
 * @param {number} params.income - Equity income to be allocated
 * @param {Object} params.stateData - State residency and workday data
 * @param {Object} params.grantDates - Grant and vesting dates
 * @returns {Object} State tax breakdown with allocation
 */
export function calculateMultiStateTax({ income, stateData, grantDates }) {
  const result = {
    stateBreakdown: [],
    totalStateTax: 0,
  };

  // Calculate days in each state during vesting period
  const workdayAllocation = calculateWorkdayAllocation(stateData, grantDates);

  // Calculate state tax for each applicable state
  Object.keys(workdayAllocation).forEach((stateCode) => {
    const allocation = workdayAllocation[stateCode];
    const stateRate = getStateRate(stateCode);
    const allocatedIncome = income * allocation.percentage;
    const stateTax = allocatedIncome * stateRate;

    result.stateBreakdown.push({
      stateCode,
      allocation: allocation.percentage,
      allocatedIncome,
      stateRate,
      stateTax,
    });

    result.totalStateTax += stateTax;
  });

  return result;
}

/**
 * Calculate comprehensive tax impact for equity transactions
 * @param {Object} grant - The equity grant
 * @param {number} exercisePrice - Strike price for options
 * @param {number} exitPrice - Sale price per share
 * @param {number} shares - Number of shares
 * @param {Object} taxSettings - User tax settings
 * @returns {Object} Comprehensive tax calculation
 */
export function calculateComprehensiveTax(
  grant,
  exercisePrice,
  exitPrice,
  shares,
  taxSettings
) {
  // Initialize result structure
  const result = {
    federal: {
      ordinaryIncome: 0,
      shortTermGains: 0,
      longTermGains: 0,
      federalTax: 0,
    },
    amt: {
      amtIncome: 0,
      amtTax: 0,
      amtCredit: 0,
    },
    state: {
      stateTax: 0,
      stateBreakdown: [],
    },
    totals: {
      totalTax: 0,
      effectiveRate: 0,
    },
    assumptions: taxSettings,
  };

  // Calculate income based on grant type
  if (grant.grant_type === "ISO") {
    // ISO calculation with AMT implications
    const spread = (grant.current_fmv - exercisePrice) * shares;
    const capitalGain = (exitPrice - grant.current_fmv) * shares;
    const isLongTerm = isLongTermHolding(
      taxSettings.exerciseDate,
      taxSettings.saleDate
    );

    // Calculate federal tax
    result.federal.ordinaryIncome = 0; // ISOs don't create ordinary income at exercise
    result.federal.shortTermGains = isLongTerm ? 0 : capitalGain;
    result.federal.longTermGains = isLongTerm ? capitalGain : 0;

    // Calculate federal tax (simplified)
    const federalCapitalGainsTax = calculateCapitalGainsTax(
      result.federal,
      taxSettings
    );
    result.federal.federalTax = federalCapitalGainsTax;

    // Calculate AMT
    const amtResult = calculateAMT({
      income: taxSettings.otherIncome || 0,
      amtIncome: spread,
      amtCredits: taxSettings.priorAMTCredits || 0,
      year: new Date(taxSettings.exerciseDate).getFullYear(),
    });

    result.amt = amtResult;

    // Calculate state tax with multi-state allocation
    if (taxSettings.isMultiState) {
      result.state = calculateMultiStateTax({
        income: spread + capitalGain,
        stateData: taxSettings.stateData,
        grantDates: {
          grantDate: grant.grant_date,
          vestingStartDate: grant.vesting_start_date,
          vestingEndDate: grant.vesting_end_date,
        },
      });
    } else {
      // Simple state tax calculation
      result.state.stateTax =
        (spread + capitalGain) * (taxSettings.stateRate || 0.05);
    }
  } else if (grant.grant_type === "NSO") {
    // NSO calculations
    const spread = (grant.current_fmv - exercisePrice) * shares;
    const capitalGain = (exitPrice - grant.current_fmv) * shares;
    const isLongTerm = isLongTermHolding(
      taxSettings.exerciseDate,
      taxSettings.saleDate
    );

    // NSOs create ordinary income at exercise
    result.federal.ordinaryIncome = spread;
    result.federal.shortTermGains = isLongTerm ? 0 : capitalGain;
    result.federal.longTermGains = isLongTerm ? capitalGain : 0;

    // Calculate federal tax
    const federalOrdinaryTax = calculateOrdinaryIncomeTax(spread, taxSettings);
    const federalCapitalGainsTax = calculateCapitalGainsTax(
      result.federal,
      taxSettings
    );
    result.federal.federalTax = federalOrdinaryTax + federalCapitalGainsTax;

    // NSOs don't typically create AMT implications

    // Calculate state tax
    if (taxSettings.isMultiState) {
      result.state = calculateMultiStateTax({
        income: spread + capitalGain,
        stateData: taxSettings.stateData,
        grantDates: {
          grantDate: grant.grant_date,
          vestingStartDate: grant.vesting_start_date,
          vestingEndDate: grant.vesting_end_date,
        },
      });
    } else {
      result.state.stateTax =
        (spread + capitalGain) * (taxSettings.stateRate || 0.05);
    }
  } else if (grant.grant_type === "RSU") {
    // RSU calculations - taxed as ordinary income at vesting
    const vestValue = grant.current_fmv * shares;
    const capitalGain = (exitPrice - grant.current_fmv) * shares;
    const isLongTerm = isLongTermHolding(
      taxSettings.vestingDate,
      taxSettings.saleDate
    );

    result.federal.ordinaryIncome = vestValue;
    result.federal.shortTermGains = isLongTerm ? 0 : capitalGain;
    result.federal.longTermGains = isLongTerm ? capitalGain : 0;

    // Calculate federal tax
    const federalOrdinaryTax = calculateOrdinaryIncomeTax(
      vestValue,
      taxSettings
    );
    const federalCapitalGainsTax = calculateCapitalGainsTax(
      result.federal,
      taxSettings
    );
    result.federal.federalTax = federalOrdinaryTax + federalCapitalGainsTax;

    // RSUs don't typically create AMT implications

    // Calculate state tax
    if (taxSettings.isMultiState) {
      result.state = calculateMultiStateTax({
        income: vestValue + capitalGain,
        stateData: taxSettings.stateData,
        grantDates: {
          grantDate: grant.grant_date,
          vestingStartDate: grant.vesting_start_date,
          vestingEndDate: grant.vesting_end_date,
        },
      });
    } else {
      result.state.stateTax =
        (vestValue + capitalGain) * (taxSettings.stateRate || 0.05);
    }
  }

  // Calculate totals
  result.totals.totalTax =
    result.federal.federalTax + result.amt.netAMTDue + result.state.stateTax;

  // Calculate effective tax rate
  const totalIncome =
    result.federal.ordinaryIncome +
    result.federal.shortTermGains +
    result.federal.longTermGains;
  result.totals.effectiveRate =
    totalIncome > 0 ? result.totals.totalTax / totalIncome : 0;

  return result;
}

// Helper functions (would be implemented in full version)
function getAMTParams(year) {
  // Return AMT parameters for the specific tax year
  return {
    exemptionAmount: 73600, // Example for 2021 for single filers
    phaseoutThreshold: 523600,
    phaseoutRate: 0.25,
    rate: 0.26, // Simplified - actual AMT has two rates
  };
}

function calculateRegularTax(income, year) {
  // Simplified calculation
  return income * 0.24;
}

function calculateWorkdayAllocation(stateData, grantDates) {
  // Implementation would allocate workdays across states
  return {
    CA: { percentage: 0.6, days: 180 },
    NY: { percentage: 0.4, days: 120 },
  };
}

function getStateRate(stateCode) {
  // Return state tax rate for the given state code
  const stateRates = {
    CA: 0.13,
    NY: 0.107,
    TX: 0,
    FL: 0,
    // Add more states as needed
  };

  return stateRates[stateCode] || 0.05;
}

function isLongTermHolding(acquireDate, saleDate) {
  // Check if holding period is more than 1 year
  const acquire = new Date(acquireDate);
  const sale = new Date(saleDate);
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  return sale - acquire > oneYear;
}

function calculateOrdinaryIncomeTax(income, taxSettings) {
  // More complex implementation would use tax brackets
  return income * (taxSettings.federalRate || 0.24);
}

function calculateCapitalGainsTax(federal, taxSettings) {
  // Calculate capital gains tax
  const shortTermRate = taxSettings.federalRate || 0.24;
  const longTermRate = taxSettings.capitalGainsRate || 0.15;

  return (
    federal.shortTermGains * shortTermRate +
    federal.longTermGains * longTermRate
  );
}
