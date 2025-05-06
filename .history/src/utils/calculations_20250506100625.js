import { TAX_RATES } from "./constants";
// Add to src/utils/calculations.js

/**
 * Enhanced AMT calculation with proper phase-outs and exemptions
 * @param {Object} income - Income details including regular income and AMT items
 * @param {number} year - Tax year
 * @returns {Object} AMT calculation details
 */
export function calculateAMT(income, year = new Date().getFullYear()) {
  // Get AMT parameters for the specified tax year
  const amtParams = getAMTParameters(year);

  // Calculate AMT income
  const amtIncome = calculateAMTIncome(income);

  // Apply exemption with phase-out
  let exemption = amtParams.exemption;
  if (amtIncome > amtParams.phaseoutStart) {
    exemption -=
      amtParams.phaseoutRate * Math.max(0, amtIncome - amtParams.phaseoutStart);
    exemption = Math.max(0, exemption); // Ensure exemption doesn't go negative
  }

  // Calculate AMT tax base
  const amtTaxBase = Math.max(0, amtIncome - exemption);

  // Apply AMT rates
  const amtTax = calculateAMTTax(amtTaxBase, amtParams.rates);

  // Calculate AMT credit for future years (for tracking purposes)
  const amtCredit = calculateAMTCredit(income, amtTax);

  return {
    amtIncome,
    exemption,
    amtTaxBase,
    amtTax,
    amtCredit,
    effectiveRate: amtIncome > 0 ? amtTax / amtIncome : 0,
  };
}

/**
 * Multi-state tax calculation with workday allocation
 * @param {Object} income - Income details
 * @param {Array} stateResidence - Array of state residence periods
 * @returns {Object} State tax calculation by state
 */
export function calculateMultiStateTax(income, stateResidence) {
  const stateTaxes = {};
  let totalStateTax = 0;

  // Calculate workday allocation by state
  const workdayAllocation = calculateWorkdayAllocation(stateResidence);

  // Calculate tax for each state
  for (const state in workdayAllocation) {
    const allocation = workdayAllocation[state];
    const stateIncome = income.amount * allocation;
    const stateTaxRate = getStateTaxRate(state, income.type);
    const stateTax = stateIncome * stateTaxRate;

    stateTaxes[state] = {
      allocation,
      income: stateIncome,
      rate: stateTaxRate,
      tax: stateTax,
    };

    totalStateTax += stateTax;
  }

  return { stateTaxes, totalStateTax };
}

/**
 * QSBS (Qualified Small Business Stock) exemption calculator
 * @param {Object} stockInfo - Stock information
 * @param {Object} saleInfo - Sale information
 * @returns {Object} QSBS exemption details
 */
export function calculateQSBSExemption(stockInfo, saleInfo) {
  // Check if stock qualifies for QSBS treatment
  const qualifies = checkQSBSQualification(stockInfo);

  if (!qualifies.eligible) {
    return { eligible: false, reason: qualifies.reason, exemptionAmount: 0 };
  }

  // Calculate the exemption percentage based on acquisition date
  const exemptionPercentage = getQSBSExemptionPercentage(
    stockInfo.acquisitionDate
  );

  // Calculate gain and exemption amount
  const gain =
    saleInfo.salePrice - stockInfo.basisPerShare * saleInfo.sharesSold;
  const maxExemption = Math.min(
    10000000,
    stockInfo.basisPerShare * saleInfo.sharesSold * 10
  );
  const exemptionAmount = Math.min(gain * exemptionPercentage, maxExemption);

  return {
    eligible: true,
    exemptionPercentage,
    gain,
    maxExemption,
    exemptionAmount,
    taxableGain: gain - exemptionAmount,
  };
}

/**
 * Calculate the number of vested shares as of a specific date
 * @param {Object} grant - The equity grant object
 * @param {Date} asOfDate - The date to calculate vesting as of (defaults to current date)
 * @returns {number} The number of vested shares
 */
export function calculateVestedShares(grant, asOfDate = new Date()) {
  // Handle string date inputs
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = new Date(grant.vesting_cliff_date);

  // Return 0 if before cliff date
  if (asOfDate < cliffDate) return 0;

  // Return all shares if after vesting end date
  if (asOfDate >= vestingEnd) return grant.shares;

  // Calculate vesting based on schedule type
  const vestingSchedule = grant.vesting_schedule || "monthly";
  const totalVestingDays =
    (vestingEnd.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24);
  const vestedDays =
    (asOfDate.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24);
  const vestedPercentage = vestedDays / totalVestingDays;

  // For cliff vesting
  if (asOfDate >= cliffDate && vestingSchedule === "cliff") {
    return grant.shares;
  }

  // For RSUs that vest only at liquidity events
  if (grant.grant_type === "RSU" && grant.liquidity_event_only) {
    return 0; // No vesting until liquidity event
  }

  // For typical vesting schedules
  let vestedShares;

  switch (vestingSchedule) {
    case "yearly":
      // Calculate full years vested
      const yearsVested = Math.floor(vestedDays / 365);
      vestedShares = Math.floor(
        (yearsVested / (totalVestingDays / 365)) * grant.shares
      );
      break;

    case "quarterly":
      // Calculate full quarters vested
      const quartersVested = Math.floor(vestedDays / 91.25);
      vestedShares = Math.floor(
        (quartersVested / (totalVestingDays / 91.25)) * grant.shares
      );
      break;

    case "monthly":
    default:
      // Monthly vesting (default) - calculate based on months
      vestedShares = Math.floor(vestedPercentage * grant.shares);
      break;
  }

  return vestedShares;
}

/**
 * Calculate the cost to exercise a specific number of shares
 * @param {number} shares - Number of shares to exercise
 * @param {number} strikePrice - Strike price per share
 * @returns {number} Total exercise cost
 */
export function calculateExerciseCost(shares, strikePrice) {
  return shares * strikePrice;
}

/**
 * Calculate the gross proceeds from selling shares
 * @param {number} shares - Number of shares to sell
 * @param {number} exitPrice - Price per share at exit
 * @returns {number} Total gross proceeds
 */
export function calculateGrossProceeds(shares, exitPrice) {
  return shares * exitPrice;
}

/**
 * Calculate tax implications of exercising and selling options
 * @param {Object} grant - The equity grant object
 * @param {number} exercisePrice - Strike price per share
 * @param {number} exitPrice - Price per share at exit
 * @param {number} shares - Number of shares to exercise/sell
 * @param {boolean} isLongTerm - Whether the holding period qualifies for long-term capital gains
 * @returns {Object} Tax calculation details
 */
export function calculateTaxes(
  grant,
  exercisePrice,
  exitPrice,
  shares,
  isLongTerm = true
) {
  // Calculate different based on grant type
  const grantType = grant.grant_type;
  let exerciseIncome = 0;
  let capitalGain = 0;
  let exerciseTaxRate = 0;
  let capitalGainsTaxRate = 0;

  // For RSUs
  if (grantType === "RSU") {
    // RSUs are taxed as ordinary income at vesting/settlement
    exerciseIncome = shares * exitPrice;
    exerciseTaxRate = TAX_RATES.FEDERAL_SHORT_TERM + TAX_RATES.STATE_CA;
    capitalGain = 0; // No capital gains for RSUs unless held after settlement
  }
  // For NSOs
  else if (grantType === "NSO") {
    // NSOs are taxed as ordinary income on the spread at exercise
    const spreadAtExercise = (grant.current_fmv - exercisePrice) * shares;
    exerciseIncome = Math.max(0, spreadAtExercise);
    exerciseTaxRate = TAX_RATES.FEDERAL_SHORT_TERM + TAX_RATES.STATE_CA;

    // Capital gains on appreciation after exercise
    capitalGain =
      (exitPrice - Math.max(grant.current_fmv, exercisePrice)) * shares;
    capitalGainsTaxRate = isLongTerm
      ? TAX_RATES.FEDERAL_LONG_TERM + TAX_RATES.STATE_CA
      : TAX_RATES.FEDERAL_SHORT_TERM + TAX_RATES.STATE_CA;
  }
  // For ISOs
  else {
    // No ordinary income at exercise (unless AMT applies, which we simplify here)
    exerciseIncome = 0;

    // All gain is capital gain
    capitalGain = (exitPrice - exercisePrice) * shares;
    capitalGainsTaxRate = isLongTerm
      ? TAX_RATES.FEDERAL_LONG_TERM + TAX_RATES.STATE_CA
      : TAX_RATES.FEDERAL_SHORT_TERM + TAX_RATES.STATE_CA;

    // Simplified AMT calculation
    const amtIncome = Math.max(0, (grant.current_fmv - exercisePrice) * shares);
    const amtRate = 0.26; // Simplified AMT rate
    const amtExemption = 72900; // 2021 exemption for single filers
    const amtLiability = Math.max(0, amtIncome * amtRate - amtExemption);

    // We'll return AMT separately
    return {
      exercise_income: exerciseIncome,
      exercise_tax: exerciseIncome * exerciseTaxRate,
      capital_gain: capitalGain,
      capital_gains_tax: capitalGain * capitalGainsTaxRate,
      amt_income: amtIncome,
      amt_liability: amtLiability,
      federal_tax:
        capitalGain *
          (isLongTerm
            ? TAX_RATES.FEDERAL_LONG_TERM
            : TAX_RATES.FEDERAL_SHORT_TERM) +
        exerciseIncome * TAX_RATES.FEDERAL_SHORT_TERM +
        amtLiability,
      state_tax: (capitalGain + exerciseIncome) * TAX_RATES.STATE_CA,
      total_tax:
        capitalGain * capitalGainsTaxRate +
        exerciseIncome * exerciseTaxRate +
        amtLiability,
      effective_tax_rate:
        capitalGain + exerciseIncome > 0
          ? (capitalGain * capitalGainsTaxRate +
              exerciseIncome * exerciseTaxRate +
              amtLiability) /
            (capitalGain + exerciseIncome)
          : 0,
    };
  }

  // Calculate tax amounts
  const exerciseTax = exerciseIncome * exerciseTaxRate;
  const capitalGainsTax = capitalGain * capitalGainsTaxRate;
  const total_tax = exerciseTax + capitalGainsTax;
  const effective_tax_rate =
    exerciseIncome + capitalGain > 0
      ? total_tax / (exerciseIncome + capitalGain)
      : 0;

  return {
    exercise_income: exerciseIncome,
    exercise_tax: exerciseTax,
    capital_gain: capitalGain,
    capital_gains_tax: capitalGainsTax,
    amt_liability: 0, // Simplified for NSOs and RSUs
    federal_tax:
      capitalGain *
        (isLongTerm
          ? TAX_RATES.FEDERAL_LONG_TERM
          : TAX_RATES.FEDERAL_SHORT_TERM) +
      exerciseIncome * TAX_RATES.FEDERAL_SHORT_TERM,
    state_tax: (capitalGain + exerciseIncome) * TAX_RATES.STATE_CA,
    total_tax,
    effective_tax_rate,
  };
}

/**
 * Calculate the result of a specific scenario
 * @param {Object} grant - The equity grant object
 * @param {number} exitPrice - Price per share at exit
 * @param {number} sharesToExercise - Number of shares to exercise
 * @param {string} scenarioName - Name of the scenario
 * @param {boolean} isLongTerm - Whether the holding period qualifies for long-term capital gains
 * @returns {Object} Complete scenario results
 */
export function calculateScenarioResult(
  grant,
  exitPrice,
  sharesToExercise,
  scenarioName,
  isLongTerm = true
) {
  const exercise_cost = calculateExerciseCost(
    sharesToExercise,
    grant.strike_price
  );
  const gross_proceeds = calculateGrossProceeds(sharesToExercise, exitPrice);
  const tax_calculation = calculateTaxes(
    grant,
    grant.strike_price,
    exitPrice,
    sharesToExercise,
    isLongTerm
  );
  const net_proceeds =
    gross_proceeds - exercise_cost - tax_calculation.total_tax;

  // Avoid division by zero
  const roi_percentage =
    exercise_cost > 0 ? (net_proceeds / exercise_cost) * 100 : 0;

  return {
    scenario_name: scenarioName,
    exit_value: exitPrice,
    shares_exercised: sharesToExercise,
    exercise_cost,
    gross_proceeds,
    exercise_income: tax_calculation.exercise_income,
    capital_gain: tax_calculation.capital_gain,
    amt_liability: tax_calculation.amt_liability,
    federal_tax: tax_calculation.federal_tax,
    state_tax: tax_calculation.state_tax,
    tax_liability: tax_calculation.total_tax,
    effective_tax_rate: tax_calculation.effective_tax_rate,
    net_proceeds,
    roi_percentage,
    // Add additional metrics
    multiple_on_investment:
      exercise_cost > 0 ? gross_proceeds / exercise_cost : 0,
    annual_return: calculateAnnualReturn(exercise_cost, net_proceeds, grant),
    break_even_price: calculateBreakEvenPrice(
      grant.strike_price,
      tax_calculation.effective_tax_rate
    ),
  };
}

/**
 * Calculate the annual return (simplified)
 * @param {number} investment - Initial investment amount
 * @param {number} finalValue - Final value after investment
 * @param {Object} grant - The equity grant object (for time calculation)
 * @returns {number} Annualized return percentage
 */
function calculateAnnualReturn(investment, finalValue, grant) {
  if (investment <= 0) return 0;

  // Calculate years between grant date and vest end
  const grantDate = new Date(grant.grant_date);
  const vestEnd = new Date(grant.vesting_end_date);
  const yearsToVest = (vestEnd - grantDate) / (365 * 24 * 60 * 60 * 1000);

  // Calculate annual return (simplified formula)
  // (Final/Initial)^(1/years) - 1
  const totalReturn = finalValue / investment;
  const annualReturn = Math.pow(totalReturn, 1 / Math.max(1, yearsToVest)) - 1;

  return annualReturn * 100; // Return as percentage
}

/**
 * Calculate break-even price considering taxes
 * @param {number} strikePrice - Strike price per share
 * @param {number} taxRate - Effective tax rate
 * @returns {number} Break-even price per share
 */
function calculateBreakEvenPrice(strikePrice, taxRate) {
  // Break-even is when net proceeds equal exercise cost
  // strikePrice * (1 + taxRate/(1-taxRate))
  return strikePrice / (1 - taxRate);
}

/**
 * Calculate dilution impact (simplified)
 * @param {number} currentShares - Current number of shares
 * @param {number} newInvestment - New investment amount in dollars
 * @param {number} preMoney - Pre-money valuation
 * @returns {Object} Dilution details
 */
export function calculateDilution(currentShares, newInvestment, preMoney) {
  const postMoney = preMoney + newInvestment;
  const newShares =
    (newInvestment / postMoney) *
    (currentShares / (1 - newInvestment / postMoney));
  const totalShares = currentShares + newShares;
  const dilutionPercentage = (newShares / totalShares) * 100;

  return {
    new_shares: newShares,
    total_shares: totalShares,
    dilution_percentage: dilutionPercentage,
    ownership_percentage_before: 100 / currentShares,
    ownership_percentage_after: 100 / totalShares,
  };
}

/**
 * Format currency for display
 * @param {number} value - Numeric value to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
