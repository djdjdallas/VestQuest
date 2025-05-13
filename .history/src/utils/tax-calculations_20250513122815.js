/**
 * Calculate ordinary income tax
 * @param {number} amount - Amount of ordinary income
 * @param {number} baseIncome - Base income amount
 * @param {number} rate - Marginal tax rate
 * @returns {number} - Calculated tax amount
 */
export function calculateOrdinaryIncomeTax(amount, baseIncome, rate) {
  // Simplified calculation assuming flat marginal rate
  return amount * rate;
}

/**
 * Calculate capital gains tax
 * @param {number} amount - Amount of capital gains
 * @param {number} baseIncome - Base income amount
 * @param {boolean} isLongTerm - Whether gain is long-term
 * @returns {number} - Calculated capital gains tax
 */
export function calculateCapitalGainsTax(amount, baseIncome, isLongTerm) {
  // Simplified capital gains tax calculation
  if (isLongTerm) {
    // Long-term capital gains rates (simplified)
    if (baseIncome + amount <= 40000) {
      return amount * 0;
    } else if (baseIncome + amount <= 441450) {
      return amount * 0.15;
    } else {
      return amount * 0.2;
    }
  } else {
    // Short-term gains taxed as ordinary income (simplified)
    return amount * 0.35; // Using default rate
  }
}

/**
 * Calculate AMT exemption
 * @param {number} income - Total income
 * @param {string} filingStatus - Filing status
 * @returns {number} - AMT exemption amount
 */
export function calculateAMTExemption(income, filingStatus) {
  // Default AMT exemption amounts (2024 estimates)
  const baseExemption = filingStatus === "married" ? 126500 : 81300;
  const phaseoutThreshold = filingStatus === "married" ? 1156300 : 578150;

  // Exemption phases out by 25 cents per dollar over threshold
  if (income <= phaseoutThreshold) {
    return baseExemption;
  } else {
    const phaseout = (income - phaseoutThreshold) * 0.25;
    return Math.max(0, baseExemption - phaseout);
  }
}

/**
 * Calculate AMT tax
 * @param {number} amtIncome - Income subject to AMT
 * @param {number} regularIncome - Regular income
 * @param {string} filingStatus - Filing status
 * @returns {number} - AMT tax amount
 */
export function calculateAMT(amtIncome, regularIncome, filingStatus) {
  // Calculate AMT exemption
  const exemption = calculateAMTExemption(
    regularIncome + amtIncome,
    filingStatus
  );

  // Calculate AMT taxable income
  const amtTaxableIncome = Math.max(0, amtIncome - exemption);

  // Calculate AMT (simplified with flat 26% and 28% brackets)
  let amtTax = 0;
  if (amtTaxableIncome > 0) {
    const lowerBracket = filingStatus === "married" ? 220700 : 110350;
    if (amtTaxableIncome <= lowerBracket) {
      amtTax = amtTaxableIncome * 0.26;
    } else {
      amtTax = lowerBracket * 0.26 + (amtTaxableIncome - lowerBracket) * 0.28;
    }
  }

  // Calculate regular tax (simplified)
  const regularTax = regularIncome * 0.35;

  // AMT is only due if it exceeds regular tax
  return Math.max(0, amtTax - regularTax);
}

/**
 * Calculate decision factors for exercise recommendations
 * @param {Object} inputs - Decision inputs
 * @returns {Object} - Decision factor scores
 */
export function calculateDecisionFactors(inputs) {
  // Initialize scores
  const factors = {
    financialCapacity: 0,
    companyOutlook: 0,
    taxEfficiency: 0,
    timing: 0,
  };

  // Financial capacity score (0-1)
  const exerciseCost = inputs.strikePrice * inputs.vestedShares;
  factors.financialCapacity = Math.min(
    1,
    inputs.availableCash / (exerciseCost * 1.5)
  );

  // Company outlook score (0-1)
  let outlookScore = 0;
  // Based on company stage
  switch (inputs.companyStage) {
    case "early":
      outlookScore += 0.4;
      break;
    case "growth":
      outlookScore += 0.6;
      break;
    case "late":
      outlookScore += 0.8;
      break;
    case "pre-ipo":
      outlookScore += 0.9;
      break;
    default:
      outlookScore += 0.5;
  }

  // Based on growth rate
  outlookScore += Math.min(0.5, inputs.growthRate / 200);

  // Normalize to 0-1
  factors.companyOutlook = Math.min(1, outlookScore);

  // Tax efficiency score (0-1)
  let taxScore = 0.5; // Neutral starting point

  // ISO vs NSO adjustment
  if (inputs.optionType === "ISO") {
    taxScore += 0.2;
  } else if (inputs.optionType === "NSO") {
    taxScore -= 0.1;
  }

  // State tax adjustment
  const highTaxStates = ["California", "New York", "New Jersey"];
  if (highTaxStates.includes(inputs.stateOfResidence)) {
    taxScore -= 0.1;
  }

  // Income level adjustment
  if (inputs.currentIncome > 400000) {
    taxScore -= 0.1;
  } else if (inputs.currentIncome < 150000) {
    taxScore += 0.1;
  }

  // Normalize to 0-1
  factors.taxEfficiency = Math.max(0, Math.min(1, taxScore));

  // Timing score (0-1)
  let timingScore = 0.5; // Neutral starting point

  // Based on time to expiration
  if (inputs.timeToExpiration < 1) {
    timingScore += 0.4; // Urgent to exercise
  } else if (inputs.timeToExpiration < 3) {
    timingScore += 0.2; // Should start considering
  } else if (inputs.timeToExpiration > 8) {
    timingScore -= 0.2; // Plenty of time
  }

  // Normalize to 0-1
  factors.timing = Math.max(0, Math.min(1, timingScore));

  return factors;
}

/**
 * Calculate optimal exercise amount based on financial capacity
 * @param {Object} grant - The equity grant
 * @param {Object} financialData - User financial data
 * @param {Object} taxSettings - Tax settings
 * @returns {Object} - Optimal exercise recommendation
 */
export function calculateOptimalExerciseAmount(
  grant,
  financialData,
  taxSettings
) {
  const vestedShares = calculateVestedShares(grant);
  const exerciseCost = grant.strike_price * vestedShares;

  // Calculate immediate tax impact for a single share
  const singleShareTax = calculateComprehensiveTax(
    grant,
    grant.strike_price,
    grant.current_fmv,
    1,
    false,
    taxSettings
  ).totals.totalTax;

  // Estimate total cost including taxes
  const totalCostPerShare = grant.strike_price + singleShareTax;
  const estimatedTotalCost = totalCostPerShare * vestedShares;

  // Calculate how many shares can be exercised based on available cash
  // Using a safety margin of 10%
  const safeAvailableCash = financialData.availableCash * 0.9;
  const maxSharesBasedOnCash = Math.floor(
    safeAvailableCash / totalCostPerShare
  );

  // Calculate recommended percentage based on risk tolerance
  let recommendedPercentage = 0.5; // Default to 50%

  switch (financialData.riskTolerance) {
    case "low":
      recommendedPercentage = 0.3;
      break;
    case "medium":
      recommendedPercentage = 0.5;
      break;
    case "high":
      recommendedPercentage = 0.8;
      break;
  }

  // Calculate recommended shares
  const recommendedShares = Math.min(
    Math.floor(vestedShares * recommendedPercentage),
    maxSharesBasedOnCash
  );

  return {
    vestedShares,
    maxSharesBasedOnCash,
    recommendedShares,
    exerciseCostOnly: grant.strike_price * recommendedShares,
    estimatedTaxImpact: singleShareTax * recommendedShares,
    totalEstimatedCost: totalCostPerShare * recommendedShares,
  };
}

/**
 * Calculate ISO limit
 * @param {Object} grant - The equity grant
 * @returns {Object} - ISO limit analysis
 */
export function calculateISOLimit(grant) {
  // ISO limit is $100,000 of aggregate fair market value that first becomes exercisable in a calendar year
  const isoLimit = 100000;

  // For simplicity, assume all vested shares became exercisable this year
  const fmvAtGrant = grant.grant_date_fmv || grant.strike_price;
  const potentialIsoValue = fmvAtGrant * calculateVestedShares(grant);

  const isLimitExceeded = potentialIsoValue > isoLimit;

  let isoShares = calculateVestedShares(grant);
  let nsoShares = 0;

  if (isLimitExceeded) {
    isoShares = Math.floor(isoLimit / fmvAtGrant);
    nsoShares = calculateVestedShares(grant) - isoShares;
  }

  return {
    isoLimit,
    potentialIsoValue,
    isLimitExceeded,
    isoShares,
    nsoShares,
  };
}

/**
 * Analyze early exercise opportunity
 * @param {Object} grant - The equity grant
 * @param {boolean} with83b - Whether 83(b) election is filed
 * @param {Object} taxSettings - Tax settings
 * @returns {Object} - Early exercise analysis
 */
export function analyzeEarlyExercise(grant, with83b, taxSettings) {
  // Only applicable for unvested shares with early exercise allowed
  if (!grant.allows_early_exercise || grant.unvested_shares <= 0) {
    return {
      applicable: false,
      recommendation: "not_applicable",
      taxSavings: 0,
    };
  }

  // Calculate potential tax impact with and without early exercise
  const currentFMV = grant.current_fmv;
  const projectedFMV = currentFMV * 3; // Assuming 3x growth at full vesting

  // Tax impact with early exercise + 83(b)
  const earlyExerciseTax =
    (grant.current_fmv - grant.strike_price) *
    grant.unvested_shares *
    taxSettings.federalRate;

  // Tax impact with regular exercise after vesting
  const regularExerciseTax =
    (projectedFMV - grant.strike_price) *
    grant.unvested_shares *
    taxSettings.federalRate;

  // Calculate potential tax savings
  const taxSavings = regularExerciseTax - earlyExerciseTax;

  // Make recommendation
  let recommendation = "wait";

  if (with83b && taxSavings > 5000) {
    recommendation = "early_exercise";
  }

  return {
    applicable: true,
    recommendation,
    taxSavings,
    earlyExerciseTax,
    regularExerciseTax,
    assumedGrowth: "3x",
  };
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
