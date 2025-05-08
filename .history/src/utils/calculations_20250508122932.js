/**
 * Enhanced calculations.js utility file
 * Provides comprehensive calculations for equity scenarios, tax implications, and decision support
 */

// Constants for tax calculations
/**
 * Calculate the total number of vested shares
 * @param {Object} grant - The equity grant object
 * @returns {number} - The number of vested shares
 */
export function calculateVestedShares(grant) {
  if (!grant) return 0;

  const now = new Date();
  const vestingStart = grant.vesting_start_date
    ? new Date(grant.vesting_start_date)
    : null;
  const totalShares = grant.shares ? Number(grant.shares) : 0;

  // Data validation: If no valid vesting start date or no shares, return 0
  if (!vestingStart || !totalShares || totalShares <= 0) return 0;

  // Get vesting end date (with fallback to 4 years from start if missing)
  const vestingEndInput = grant.vesting_end_date || null;
  const vestingEnd = vestingEndInput
    ? new Date(vestingEndInput)
    : new Date(
        vestingStart.getFullYear() + 4,
        vestingStart.getMonth(),
        vestingStart.getDate()
      );

  // Get cliff date (with fallback to 1 year from start if missing)
  const cliffDateInput = grant.vesting_cliff_date || null;
  const cliffDate = cliffDateInput
    ? new Date(cliffDateInput)
    : new Date(
        vestingStart.getFullYear() + 1,
        vestingStart.getMonth(),
        vestingStart.getDate()
      );

  // Calculate months since vesting start
  const monthsSinceStart =
    (now.getFullYear() - vestingStart.getFullYear()) * 12 +
    (now.getMonth() - vestingStart.getMonth());

  // If vesting hasn't started yet, return 0
  if (monthsSinceStart <= 0) return 0;

  // If the vesting end date has passed, return total shares (fully vested)
  if (now >= vestingEnd) return totalShares;

  // Handle cliff vesting
  if (now < cliffDate) {
    return 0; // Before cliff date, nothing is vested
  }

  // Calculate vested percentage based on vesting schedule
  let vestedPercentage = 0;
  const vestingSchedule = grant.vesting_schedule || "monthly";

  // Calculate total vesting period in months
  const totalVestingMonths =
    (vestingEnd.getFullYear() - vestingStart.getFullYear()) * 12 +
    (vestingEnd.getMonth() - vestingStart.getMonth());

  if (totalVestingMonths <= 0) return totalShares; // Safety check

  if (vestingSchedule === "monthly") {
    // Simple monthly vesting after cliff
    if (now >= cliffDate) {
      // Calculate cliff percentage (usually 25% for 1-year cliff)
      const cliffMonths =
        (cliffDate.getFullYear() - vestingStart.getFullYear()) * 12 +
        (cliffDate.getMonth() - vestingStart.getMonth());

      const cliffPercentage = cliffMonths / totalVestingMonths;

      // Calculate additional vesting after cliff
      const monthsAfterCliff = monthsSinceStart - cliffMonths;
      const remainingPercentage = 1 - cliffPercentage;
      const monthlyRate =
        remainingPercentage / (totalVestingMonths - cliffMonths);

      vestedPercentage = Math.min(
        cliffPercentage + monthsAfterCliff * monthlyRate,
        1
      );
    }
  } else if (vestingSchedule === "quarterly") {
    // Quarterly vesting
    const quartersSinceStart = Math.floor(monthsSinceStart / 3);
    const totalQuarters = Math.ceil(totalVestingMonths / 3);
    vestedPercentage = Math.min(quartersSinceStart / totalQuarters, 1);
  } else if (vestingSchedule === "yearly") {
    // Annual vesting
    const yearsSinceStart = Math.floor(monthsSinceStart / 12);
    const totalYears = Math.ceil(totalVestingMonths / 12);
    vestedPercentage = Math.min(yearsSinceStart / totalYears, 1);
  } else {
    // Default to simple linear vesting
    vestedPercentage = Math.min(monthsSinceStart / totalVestingMonths, 1);
  }

  // RSUs may require liquidity event
  if (grant.grant_type === "RSU" && grant.liquidity_event_only === true) {
    return 0; // Double-trigger RSUs don't vest until liquidity event
  }

  // Calculate and return vested shares (ensuring it's a valid number)
  const vestedShares = Math.floor(totalShares * vestedPercentage);
  return isNaN(vestedShares) ? 0 : vestedShares;
}

/**
 * Calculate exercise cost for options
 * @param {number} shares - Number of shares to exercise
 * @param {number} strikePrice - Strike price per share
 * @returns {number} - Total exercise cost
 */
export function calculateExerciseCost(shares, strikePrice) {
  const numShares = Number(shares) || 0;
  const numStrikePrice = Number(strikePrice) || 0;
  return numShares * numStrikePrice;
}

/**
 * Calculate current value of shares
 * @param {number} shares - Number of shares
 * @param {number} currentFMV - Current fair market value per share
 * @returns {number} - Total value of shares
 */
export function calculateCurrentValue(shares, currentFMV) {
  const numShares = Number(shares) || 0;
  const numFMV = Number(currentFMV) || 0;
  return numShares * numFMV;
}

/**
 * Calculate vesting percentage
 * @param {number} vestedShares - Number of vested shares
 * @param {number} totalShares - Total number of shares
 * @returns {number} - Vesting percentage (0-100)
 */
export function calculateVestingPercentage(vestedShares, totalShares) {
  const numVestedShares = Number(vestedShares) || 0;
  const numTotalShares = Number(totalShares) || 1; // Avoid division by zero
  return (numVestedShares / numTotalShares) * 100;
}

/**
 * Calculate potential return percentage
 * @param {number} currentFMV - Current fair market value
 * @param {number} strikePrice - Strike price
 * @returns {number} - Return percentage (0-100)
 */
export function calculateReturnPercentage(currentFMV, strikePrice) {
  const numFMV = Number(currentFMV) || 0;
  const numStrikePrice = Number(strikePrice) || 1; // Avoid division by zero

  // Calculate how much the share price has increased
  const increase = numFMV - numStrikePrice;

  // Calculate the percentage increase
  const returnPercentage = (increase / numStrikePrice) * 100;

  return returnPercentage;
}
const TAX_CONSTANTS = {
  FEDERAL_BRACKETS: {
    2024: {
      single: [
        { min: 0, max: 11000, rate: 0.1 },
        { min: 11000, max: 44725, rate: 0.12 },
        { min: 44725, max: 95375, rate: 0.22 },
        { min: 95375, max: 182100, rate: 0.24 },
        { min: 182100, max: 231250, rate: 0.32 },
        { min: 231250, max: 578125, rate: 0.35 },
        { min: 578125, max: Infinity, rate: 0.37 },
      ],
      married_joint: [
        { min: 0, max: 22000, rate: 0.1 },
        { min: 22000, max: 89450, rate: 0.12 },
        { min: 89450, max: 190750, rate: 0.22 },
        { min: 190750, max: 364200, rate: 0.24 },
        { min: 364200, max: 462500, rate: 0.32 },
        { min: 462500, max: 693750, rate: 0.35 },
        { min: 693750, max: Infinity, rate: 0.37 },
      ],
      married_separate: [
        { min: 0, max: 11000, rate: 0.1 },
        { min: 11000, max: 44725, rate: 0.12 },
        { min: 44725, max: 95375, rate: 0.22 },
        { min: 95375, max: 182100, rate: 0.24 },
        { min: 182100, max: 231250, rate: 0.32 },
        { min: 231250, max: 346875, rate: 0.35 },
        { min: 346875, max: Infinity, rate: 0.37 },
      ],
      head_household: [
        { min: 0, max: 15700, rate: 0.1 },
        { min: 15700, max: 59850, rate: 0.12 },
        { min: 59850, max: 95350, rate: 0.22 },
        { min: 95350, max: 182100, rate: 0.24 },
        { min: 182100, max: 231250, rate: 0.32 },
        { min: 231250, max: 578100, rate: 0.35 },
        { min: 578100, max: Infinity, rate: 0.37 },
      ],
    },
    2025: {
      // Projections for 2025 (adjust as needed)
      single: [
        { min: 0, max: 11400, rate: 0.1 },
        { min: 11400, max: 46200, rate: 0.12 },
        { min: 46200, max: 98500, rate: 0.22 },
        { min: 98500, max: 187900, rate: 0.24 },
        { min: 187900, max: 238500, rate: 0.32 },
        { min: 238500, max: 596700, rate: 0.35 },
        { min: 596700, max: Infinity, rate: 0.37 },
      ],
      // Additional brackets for other filing statuses...
    },
  },

  CAPITAL_GAINS_BRACKETS: {
    2024: {
      single: [
        { min: 0, max: 44625, rate: 0.0 },
        { min: 44625, max: 492300, rate: 0.15 },
        { min: 492300, max: Infinity, rate: 0.2 },
      ],
      married_joint: [
        { min: 0, max: 89250, rate: 0.0 },
        { min: 89250, max: 553850, rate: 0.15 },
        { min: 553850, max: Infinity, rate: 0.2 },
      ],
      // Additional brackets for other filing statuses...
    },
  },

  AMT: {
    2024: {
      exemption: {
        single: 81300,
        married_joint: 126500,
        married_separate: 63250,
      },
      exemption_phaseout: {
        single: 578150,
        married_joint: 1156300,
        married_separate: 578150,
      },
      rates: [
        { min: 0, max: 220700, rate: 0.26 },
        { min: 220700, max: Infinity, rate: 0.28 },
      ],
    },
  },

  STATE_TAX_RATES: {
    California: 0.133,
    "New York": 0.107,
    Texas: 0,
    Florida: 0,
    Washington: 0,
    Massachusetts: 0.09,
    Illinois: 0.0495,
    // Add more states as needed...
  },

  MEDICARE_SURTAX_THRESHOLD: {
    single: 200000,
    married_joint: 250000,
    married_separate: 125000,
    head_household: 200000,
  },

  MEDICARE_SURTAX_RATE: 0.038,

  MEDICARE_BASE_RATE: 0.0145,

  SOCIAL_SECURITY_RATE: 0.062,

  SOCIAL_SECURITY_WAGE_BASE: {
    2024: 168600,
    2025: 175500, // Projected
  },
};

/**
 * Calculate the total value of vested shares
 * @param {Object} grant - The equity grant object
 * @returns {number} - The number of vested shares
 */
export function calculateVestedShares(grant) {
  if (!grant) return 0;

  const now = new Date();
  const vestingStart = new Date(grant.vesting_start_date);
  const totalShares = grant.shares || 0;

  // If no vesting start date or no shares, return 0
  if (!vestingStart || totalShares <= 0) return 0;

  // Calculate months since vesting start
  const monthsSinceStart =
    (now.getFullYear() - vestingStart.getFullYear()) * 12 +
    (now.getMonth() - vestingStart.getMonth());

  // If vesting hasn't started yet, return 0
  if (monthsSinceStart <= 0) return 0;

  // Handle cliff vesting
  if (grant.cliff_months && monthsSinceStart < grant.cliff_months) {
    return 0;
  }

  // Calculate vested percentage based on vesting schedule
  let vestedPercentage = 0;

  if (grant.vesting_schedule === "monthly") {
    // Simple monthly vesting
    vestedPercentage = Math.min(monthsSinceStart / grant.vesting_months, 1);
  } else if (grant.vesting_schedule === "annual") {
    // Annual vesting
    const yearsSinceStart = monthsSinceStart / 12;
    vestedPercentage = Math.min(
      Math.floor(yearsSinceStart) / grant.vesting_years,
      1
    );
  } else if (grant.vesting_schedule === "cliff_monthly") {
    // Cliff then monthly vesting
    if (monthsSinceStart >= grant.cliff_months) {
      // Calculate percentage vested at cliff
      const cliffPercentage =
        grant.cliff_percent || grant.cliff_months / grant.vesting_months;

      // Calculate additional vesting after cliff
      const monthsAfterCliff = monthsSinceStart - grant.cliff_months;
      const remainingPercentage = 1 - cliffPercentage;
      const monthlyRate =
        remainingPercentage / (grant.vesting_months - grant.cliff_months);

      vestedPercentage = Math.min(
        cliffPercentage + monthsAfterCliff * monthlyRate,
        1
      );
    }
  } else {
    // Default to simple proportion of vesting period
    vestedPercentage = Math.min(
      monthsSinceStart / (grant.vesting_months || 48),
      1
    );
  }

  // Calculate vested shares
  const vestedShares = Math.floor(totalShares * vestedPercentage);

  return vestedShares;
}

/**
 * Calculate exercise cost for options
 * @param {number} shares - Number of shares to exercise
 * @param {number} strikePrice - Strike price per share
 * @returns {number} - Total exercise cost
 */
export function calculateExerciseCost(shares, strikePrice) {
  return shares * strikePrice;
}

/**
 * Calculate tax liability for option exercise
 * @param {Object} grant - The equity grant object
 * @param {number} strikePrice - Strike price per share
 * @param {number} fairMarketValue - Current FMV per share
 * @param {number} shares - Number of shares to exercise
 * @param {boolean} isLongTerm - Whether capital gains are long-term
 * @param {Object} taxSettings - Additional tax settings
 * @returns {Object} - Tax calculation results
 */
export function calculateTaxes(
  grant,
  strikePrice,
  fairMarketValue,
  shares,
  isLongTerm = false,
  taxSettings = {}
) {
  // Default tax settings
  const settings = {
    filingStatus: "single",
    stateOfResidence: "California",
    income: 150000,
    useAMT: true,
    ...taxSettings,
  };

  const spread = (fairMarketValue - strikePrice) * shares;
  let federalTax = 0;
  let stateTax = 0;
  let amtTax = 0;

  // Different tax treatment based on grant type
  if (grant.grant_type === "ISO") {
    // ISOs not subject to ordinary income tax at exercise
    // But subject to AMT on the spread
    if (settings.useAMT) {
      amtTax = calculateAMT(spread, settings.income, settings.filingStatus);
    }

    // Some states tax ISO exercise
    const stateRate =
      TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0;
    stateTax = spread * stateRate * 0.5; // Simplified state tax for ISOs
  } else if (grant.grant_type === "NSO") {
    // NSOs subject to ordinary income tax on spread
    federalTax = calculateFederalIncomeTax(
      spread,
      settings.income,
      settings.filingStatus
    );

    // State tax
    const stateRate =
      TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0;
    stateTax = spread * stateRate;

    // Medicare taxes
    const medicareTax = calculateMedicareTax(
      spread,
      settings.income,
      settings.filingStatus
    );
    federalTax += medicareTax;
  } else if (grant.grant_type === "RSU") {
    // RSUs taxed as ordinary income at vesting
    federalTax = calculateFederalIncomeTax(
      fairMarketValue * shares,
      settings.income,
      settings.filingStatus
    );

    // State tax
    const stateRate =
      TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0;
    stateTax = fairMarketValue * shares * stateRate;

    // Medicare taxes
    const medicareTax = calculateMedicareTax(
      fairMarketValue * shares,
      settings.income,
      settings.filingStatus
    );
    federalTax += medicareTax;
  }

  // Total tax liability
  const totalTax = federalTax + stateTax + amtTax;

  return {
    federal_tax: federalTax,
    state_tax: stateTax,
    amt_liability: amtTax,
    total_tax: totalTax,
    effective_rate: spread > 0 ? totalTax / spread : 0,
  };
}

/**
 * Calculate scenario result combining all aspects
 * @param {Object} grant - The equity grant object
 * @param {number} exitValue - Exit price per share
 * @param {number} sharesToExercise - Number of shares to exercise
 * @param {string} scenarioName - Name for the scenario
 * @param {Object} additionalSettings - Additional calculation settings
 * @returns {Object} - Scenario calculation results
 */
export function calculateScenarioResult(
  grant,
  exitValue,
  sharesToExercise,
  scenarioName,
  additionalSettings = {}
) {
  if (!grant || !exitValue || !sharesToExercise) {
    return {
      scenario_name: scenarioName || "Unnamed Scenario",
      exit_value: exitValue || 0,
      shares_exercised: sharesToExercise || 0,
      exercise_cost: 0,
      gross_proceeds: 0,
      tax_liability: 0,
      net_proceeds: 0,
      roi_percentage: 0,
      effective_tax_rate: 0,
    };
  }

  // Calculate exercise cost
  const exerciseCost = calculateExerciseCost(
    sharesToExercise,
    grant.strike_price
  );

  // Calculate gross proceeds
  const grossProceeds = sharesToExercise * exitValue;

  // Calculate tax liability (simplified version)
  const isLongTerm = additionalSettings.isLongTerm || false;
  const taxes = calculateTaxes(
    grant,
    grant.strike_price,
    exitValue,
    sharesToExercise,
    isLongTerm,
    additionalSettings
  );

  // Calculate net proceeds
  const netProceeds = grossProceeds - exerciseCost - taxes.total_tax;

  // Calculate ROI
  const roiPercentage =
    exerciseCost > 0 ? ((netProceeds - exerciseCost) / exerciseCost) * 100 : 0;

  // Return the complete scenario result
  return {
    scenario_name: scenarioName || "Unnamed Scenario",
    exit_value: exitValue,
    shares_exercised: sharesToExercise,
    exercise_cost: exerciseCost,
    gross_proceeds: grossProceeds,
    tax_liability: taxes.total_tax,
    net_proceeds: netProceeds,
    roi_percentage: roiPercentage,
    effective_tax_rate: grossProceeds > 0 ? taxes.total_tax / grossProceeds : 0,
    tax_details: {
      federal_tax: taxes.federal_tax,
      state_tax: taxes.state_tax,
      amt_liability: taxes.amt_liability,
    },
  };
}

/**
 * Calculate federal income tax using progressive tax brackets
 * @param {number} amount - Taxable amount
 * @param {number} baseIncome - Base income before the additional amount
 * @param {string} filingStatus - Tax filing status
 * @param {number} year - Tax year for calculations
 * @returns {number} - Federal income tax amount
 */
export function calculateFederalIncomeTax(
  amount,
  baseIncome = 0,
  filingStatus = "single",
  year = 2024
) {
  // Get the appropriate tax brackets
  const brackets =
    TAX_CONSTANTS.FEDERAL_BRACKETS[year]?.[filingStatus] ||
    TAX_CONSTANTS.FEDERAL_BRACKETS[2024][filingStatus];

  if (!brackets) return 0;

  // Calculate tax on the additional amount
  const totalIncome = baseIncome + amount;
  let taxOnTotalIncome = 0;
  let taxOnBaseIncome = 0;

  // Calculate tax on total income
  let remainingIncome = totalIncome;
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const incomeInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );

    if (incomeInBracket > 0) {
      taxOnTotalIncome += incomeInBracket * bracket.rate;
      remainingIncome -= incomeInBracket;
    }

    if (remainingIncome <= 0) break;
  }

  // Calculate tax on base income
  remainingIncome = baseIncome;
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const incomeInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );

    if (incomeInBracket > 0) {
      taxOnBaseIncome += incomeInBracket * bracket.rate;
      remainingIncome -= incomeInBracket;
    }

    if (remainingIncome <= 0) break;
  }

  // Return the difference, which is the tax on the additional amount
  return taxOnTotalIncome - taxOnBaseIncome;
}

/**
 * Calculate capital gains tax
 * @param {number} amount - Capital gain amount
 * @param {number} baseIncome - Base income before the capital gain
 * @param {boolean} isLongTerm - Whether the capital gain is long-term
 * @param {string} filingStatus - Tax filing status
 * @param {number} year - Tax year for calculations
 * @returns {number} - Capital gains tax amount
 */
export function calculateCapitalGainsTax(
  amount,
  baseIncome = 0,
  isLongTerm = true,
  filingStatus = "single",
  year = 2024
) {
  if (!isLongTerm) {
    // Short-term capital gains are taxed as ordinary income
    return calculateFederalIncomeTax(amount, baseIncome, filingStatus, year);
  }

  // Long-term capital gains use special tax brackets
  const brackets =
    TAX_CONSTANTS.CAPITAL_GAINS_BRACKETS[year]?.[filingStatus] ||
    TAX_CONSTANTS.CAPITAL_GAINS_BRACKETS[2024][filingStatus];

  if (!brackets) return 0;

  // For long-term capital gains, base income affects which bracket applies
  const totalIncome = baseIncome + amount;
  let tax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];

    // Only calculate tax on the portion of capital gains in this bracket
    if (baseIncome >= bracket.max) {
      // Base income already exceeds this bracket, move to next
      continue;
    }

    const bracketStart = Math.max(baseIncome, bracket.min);
    const bracketEnd = Math.min(totalIncome, bracket.max);
    const gainInBracket = Math.max(0, bracketEnd - bracketStart);

    tax += gainInBracket * bracket.rate;

    if (totalIncome <= bracket.max) break;
  }

  return tax;
}

/**
 * Calculate Alternative Minimum Tax (AMT)
 * @param {number} amtIncome - AMT income (like ISO spread)
 * @param {number} regularIncome - Regular income
 * @param {string} filingStatus - Tax filing status
 * @param {number} year - Tax year for calculations
 * @returns {number} - AMT liability
 */
export function calculateAMT(
  amtIncome,
  regularIncome = 0,
  filingStatus = "single",
  year = 2024
) {
  // Get AMT parameters for the tax year
  const amtParams = TAX_CONSTANTS.AMT[year] || TAX_CONSTANTS.AMT[2024];

  if (!amtParams) return 0;

  // Calculate AMT income
  const totalAMTIncome = regularIncome + amtIncome;

  // Calculate exemption with phase-out
  const baseExemption =
    amtParams.exemption[filingStatus] || amtParams.exemption.single;
  const phaseoutStart =
    amtParams.exemption_phaseout[filingStatus] ||
    amtParams.exemption_phaseout.single;

  let exemption = baseExemption;
  if (totalAMTIncome > phaseoutStart) {
    // Exemption phases out by 25 cents for each dollar above threshold
    const phaseoutAmount = Math.min(
      baseExemption,
      (totalAMTIncome - phaseoutStart) * 0.25
    );
    exemption -= phaseoutAmount;
  }

  // Calculate taxable AMT income
  const taxableAMTIncome = Math.max(0, totalAMTIncome - exemption);

  // Calculate AMT using the rates
  let amtTax = 0;
  let remainingIncome = taxableAMTIncome;

  for (const bracket of amtParams.rates) {
    const incomeInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );

    if (incomeInBracket > 0) {
      amtTax += incomeInBracket * bracket.rate;
      remainingIncome -= incomeInBracket;
    }

    if (remainingIncome <= 0) break;
  }

  // Calculate regular tax (simplified for comparison)
  const regularTax = calculateFederalIncomeTax(
    regularIncome,
    0,
    filingStatus,
    year
  );

  // Only pay AMT if it exceeds regular tax
  const amtLiability = Math.max(0, amtTax - regularTax);

  return amtLiability;
}

/**
 * Calculate Medicare tax including additional Medicare tax
 * @param {number} amount - Taxable amount
 * @param {number} baseIncome - Base income before the additional amount
 * @param {string} filingStatus - Tax filing status
 * @returns {number} - Medicare tax amount
 */
export function calculateMedicareTax(
  amount,
  baseIncome = 0,
  filingStatus = "single"
) {
  // Get Medicare tax parameters
  const baseRate = TAX_CONSTANTS.MEDICARE_BASE_RATE;
  const surtaxRate = TAX_CONSTANTS.MEDICARE_SURTAX_RATE;
  const surtaxThreshold =
    TAX_CONSTANTS.MEDICARE_SURTAX_THRESHOLD[filingStatus] ||
    TAX_CONSTANTS.MEDICARE_SURTAX_THRESHOLD.single;

  // Calculate base Medicare tax
  const baseMedicareTax = amount * baseRate;

  // Calculate additional Medicare tax if applicable
  let additionalMedicareTax = 0;
  const totalIncome = baseIncome + amount;

  if (totalIncome > surtaxThreshold) {
    // Only apply surtax to income above threshold
    const baseIncomeAboveThreshold = Math.max(0, baseIncome - surtaxThreshold);
    const amountSubjectToSurtax = Math.min(
      amount,
      totalIncome - surtaxThreshold - baseIncomeAboveThreshold
    );

    if (amountSubjectToSurtax > 0) {
      additionalMedicareTax = amountSubjectToSurtax * surtaxRate;
    }
  }

  return baseMedicareTax + additionalMedicareTax;
}

/**
 * Calculate state tax with multi-state allocation
 * @param {number} amount - Taxable amount
 * @param {Object} stateAllocation - Allocation percentages by state
 * @returns {Object} - State tax details
 */
export function calculateMultiStateTax(amount, stateAllocation = {}) {
  // If no state allocation provided, default to California
  if (Object.keys(stateAllocation).length === 0) {
    stateAllocation = { California: 1.0 };
  }

  // Calculate tax for each state
  const stateBreakdown = [];
  let totalStateTax = 0;

  for (const [state, allocation] of Object.entries(stateAllocation)) {
    const stateRate = TAX_CONSTANTS.STATE_TAX_RATES[state] || 0;
    const stateTax = amount * allocation * stateRate;

    stateBreakdown.push({
      stateCode: state,
      allocation,
      stateTax,
    });

    totalStateTax += stateTax;
  }

  return {
    stateTax: totalStateTax,
    stateBreakdown,
  };
}

/**
 * Calculate comprehensive tax impact for a scenario
 * @param {Object} grant - The equity grant
 * @param {number} exercisePrice - Price per share at exercise
 * @param {number} exitPrice - Price per share at exit
 * @param {number} shares - Number of shares
 * @param {Object} taxSettings - Tax settings
 * @returns {Object} - Comprehensive tax analysis
 */
export function calculateComprehensiveTax(
  grant,
  exercisePrice,
  exitPrice,
  shares,
  taxSettings = {}
) {
  // Default tax settings
  const settings = {
    filingStatus: "single",
    stateOfResidence: "California",
    income: 150000,
    exerciseDate: new Date(),
    saleDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year later
    stateAllocation: null,
    ...taxSettings,
  };

  // Calculate holding period
  const holdingPeriod =
    (settings.saleDate - settings.exerciseDate) / (24 * 60 * 60 * 1000);
  const isLongTerm = holdingPeriod >= 365;

  const grantType = (grant?.grant_type || "").toUpperCase();

  // Calculate spread at exercise (for options)
  const spread =
    grantType !== "RSU" ? (exercisePrice - grant.strike_price) * shares : 0;

  // Calculate profit at sale
  const exerciseCost = grantType !== "RSU" ? grant.strike_price * shares : 0;
  const saleProceeds = exitPrice * shares;
  const profit = saleProceeds - exerciseCost;

  // Comprehensive tax calculation based on grant type
  let federalTaxes = {
    federalTax: 0,
    ordinaryIncome: 0,
    shortTermGains: 0,
    longTermGains: 0,
  };
  let stateTaxes = { stateTax: 0, stateBreakdown: [] };
  let amtTaxes = null;

  if (grantType === "ISO") {
    // For ISOs
    // 1. Calculate AMT at exercise
    amtTaxes = {
      amtIncome: spread,
      exemption: calculateAMTExemption(
        settings.income + spread,
        settings.filingStatus
      ),
      netAMTDue: calculateAMT(spread, settings.income, settings.filingStatus),
      amtCredit: 0,
    };

    // 2. Calculate capital gains at sale
    if (isLongTerm && holdingPeriod >= 730) {
      // 2 years from grant date (simplified)
      // Qualifying disposition - all gain is LTCG
      federalTaxes.longTermGains = profit;
      federalTaxes.federalTax = calculateCapitalGainsTax(
        profit,
        settings.income,
        true,
        settings.filingStatus
      );
    } else {
      // Disqualifying disposition - spread is ordinary income, remainder is CG
      federalTaxes.ordinaryIncome = spread;
      federalTaxes.federalTax = calculateFederalIncomeTax(
        spread,
        settings.income,
        settings.filingStatus
      );

      const remainingGain = profit - spread;
      if (remainingGain > 0) {
        if (isLongTerm) {
          federalTaxes.longTermGains = remainingGain;
          federalTaxes.federalTax += calculateCapitalGainsTax(
            remainingGain,
            settings.income + spread,
            true,
            settings.filingStatus
          );
        } else {
          federalTaxes.shortTermGains = remainingGain;
          federalTaxes.federalTax += calculateFederalIncomeTax(
            remainingGain,
            settings.income + spread,
            settings.filingStatus
          );
        }
      }

      // No AMT in disqualifying disposition
      amtTaxes = null;
    }

    // State taxes
    if (settings.stateAllocation) {
      stateTaxes = calculateMultiStateTax(profit, settings.stateAllocation);
    } else {
      const stateRate =
        TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0;
      stateTaxes.stateTax = profit * stateRate;
      stateTaxes.stateBreakdown = [
        {
          stateCode: settings.stateOfResidence,
          allocation: 1.0,
          stateTax: stateTaxes.stateTax,
        },
      ];
    }
  } else if (grantType === "NSO") {
    // For NSOs
    // 1. Spread at exercise is ordinary income
    federalTaxes.ordinaryIncome = spread;
    federalTaxes.federalTax = calculateFederalIncomeTax(
      spread,
      settings.income,
      settings.filingStatus
    );

    // Medicare tax on spread
    federalTaxes.federalTax += calculateMedicareTax(
      spread,
      settings.income,
      settings.filingStatus
    );

    // 2. Gain from exercise to sale is capital gain
    const postExerciseGain = saleProceeds - exitPrice * shares;

    if (postExerciseGain > 0) {
      if (isLongTerm) {
        federalTaxes.longTermGains = postExerciseGain;
        federalTaxes.federalTax += calculateCapitalGainsTax(
          postExerciseGain,
          settings.income + spread,
          true,
          settings.filingStatus
        );
      } else {
        federalTaxes.shortTermGains = postExerciseGain;
        federalTaxes.federalTax += calculateFederalIncomeTax(
          postExerciseGain,
          settings.income + spread,
          settings.filingStatus
        );
      }
    }

    // State taxes
    if (settings.stateAllocation) {
      const spreadTax = calculateMultiStateTax(
        spread,
        settings.stateAllocation
      );
      const gainTax =
        postExerciseGain > 0
          ? calculateMultiStateTax(postExerciseGain, settings.stateAllocation)
          : { stateTax: 0, stateBreakdown: [] };

      stateTaxes.stateTax = spreadTax.stateTax + gainTax.stateTax;

      // Combine state breakdowns
      const stateMap = new Map();
      [...spreadTax.stateBreakdown, ...gainTax.stateBreakdown].forEach(
        (item) => {
          if (stateMap.has(item.stateCode)) {
            const existing = stateMap.get(item.stateCode);
            stateMap.set(item.stateCode, {
              stateCode: item.stateCode,
              allocation: existing.allocation, // Keep allocation the same
              stateTax: existing.stateTax + item.stateTax,
            });
          } else {
            stateMap.set(item.stateCode, item);
          }
        }
      );

      stateTaxes.stateBreakdown = Array.from(stateMap.values());
    } else {
      const stateRate =
        TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0;
      stateTaxes.stateTax =
        (spread + (postExerciseGain > 0 ? postExerciseGain : 0)) * stateRate;
      stateTaxes.stateBreakdown = [
        {
          stateCode: settings.stateOfResidence,
          allocation: 1.0,
          stateTax: stateTaxes.stateTax,
        },
      ];
    }
  } else if (grantType === "RSU") {
    // For RSUs
    // Value at vesting is ordinary income
    const vestingValue = exercisePrice * shares;
    federalTaxes.ordinaryIncome = vestingValue;
    federalTaxes.federalTax = calculateFederalIncomeTax(
      vestingValue,
      settings.income,
      settings.filingStatus
    );

    // Medicare tax on vesting value
    federalTaxes.federalTax += calculateMedicareTax(
      vestingValue,
      settings.income,
      settings.filingStatus
    );

    // Gain from vesting to sale is capital gain
    const postVestingGain = saleProceeds - vestingValue;

    if (postVestingGain > 0) {
      if (isLongTerm) {
        federalTaxes.longTermGains = postVestingGain;
        federalTaxes.federalTax += calculateCapitalGainsTax(
          postVestingGain,
          settings.income + vestingValue,
          true,
          settings.filingStatus
        );
      } else {
        federalTaxes.shortTermGains = postVestingGain;
        federalTaxes.federalTax += calculateFederalIncomeTax(
          postVestingGain,
          settings.income + vestingValue,
          settings.filingStatus
        );
      }
    }

    // State taxes
    if (settings.stateAllocation) {
      const vestingTax = calculateMultiStateTax(
        vestingValue,
        settings.stateAllocation
      );
      const gainTax =
        postVestingGain > 0
          ? calculateMultiStateTax(postVestingGain, settings.stateAllocation)
          : { stateTax: 0, stateBreakdown: [] };

      stateTaxes.stateTax = vestingTax.stateTax + gainTax.stateTax;

      // Combine state breakdowns (same as in NSO case)
      const stateMap = new Map();
      [...vestingTax.stateBreakdown, ...gainTax.stateBreakdown].forEach(
        (item) => {
          if (stateMap.has(item.stateCode)) {
            const existing = stateMap.get(item.stateCode);
            stateMap.set(item.stateCode, {
              stateCode: item.stateCode,
              allocation: existing.allocation,
              stateTax: existing.stateTax + item.stateTax,
            });
          } else {
            stateMap.set(item.stateCode, item);
          }
        }
      );

      stateTaxes.stateBreakdown = Array.from(stateMap.values());
    } else {
      const stateRate =
        TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0;
      stateTaxes.stateTax =
        (vestingValue + (postVestingGain > 0 ? postVestingGain : 0)) *
        stateRate;
      stateTaxes.stateBreakdown = [
        {
          stateCode: settings.stateOfResidence,
          allocation: 1.0,
          stateTax: stateTaxes.stateTax,
        },
      ];
    }
  }

  // Calculate AMT credit
  if (amtTaxes) {
    amtTaxes.amtCredit = amtTaxes.netAMTDue;
  }

  // Calculate total tax
  const totalTax =
    federalTaxes.federalTax +
    stateTaxes.stateTax +
    (amtTaxes ? amtTaxes.netAMTDue : 0);

  // Calculate effective tax rate
  const effectiveRate = profit > 0 ? totalTax / profit : 0;

  // Return comprehensive tax analysis
  return {
    totals: {
      totalIncome: profit,
      totalTax,
      effectiveRate,
      netProceeds: profit - totalTax,
    },
    federal: federalTaxes,
    state: stateTaxes,
    amt: amtTaxes,
    exerciseCost,
    assumptions: {
      federalRate: getFederalMarginalRate(
        settings.income,
        settings.filingStatus
      ),
      stateRate: TAX_CONSTANTS.STATE_TAX_RATES[settings.stateOfResidence] || 0,
      capitalGainsRate: getCapitalGainsRate(
        settings.income,
        settings.filingStatus
      ),
      isLongTerm,
    },
  };
}

/**
 * Calculate AMT exemption amount with phase-out
 * @param {number} income - AMT income
 * @param {string} filingStatus - Tax filing status
 * @param {number} year - Tax year
 * @returns {number} - AMT exemption amount
 */
function calculateAMTExemption(income, filingStatus = "single", year = 2024) {
  const amtParams = TAX_CONSTANTS.AMT[year] || TAX_CONSTANTS.AMT[2024];

  if (!amtParams) return 0;

  const baseExemption =
    amtParams.exemption[filingStatus] || amtParams.exemption.single;
  const phaseoutStart =
    amtParams.exemption_phaseout[filingStatus] ||
    amtParams.exemption_phaseout.single;

  let exemption = baseExemption;
  if (income > phaseoutStart) {
    // Exemption phases out by 25 cents for each dollar above threshold
    const phaseoutAmount = Math.min(
      baseExemption,
      (income - phaseoutStart) * 0.25
    );
    exemption -= phaseoutAmount;
  }

  return Math.max(0, exemption);
}

/**
 * Get federal marginal tax rate
 * @param {number} income - Taxable income
 * @param {string} filingStatus - Tax filing status
 * @param {number} year - Tax year
 * @returns {number} - Federal marginal rate
 */
function getFederalMarginalRate(income, filingStatus = "single", year = 2024) {
  const brackets =
    TAX_CONSTANTS.FEDERAL_BRACKETS[year]?.[filingStatus] ||
    TAX_CONSTANTS.FEDERAL_BRACKETS[2024][filingStatus];

  if (!brackets) return 0;

  // Find the bracket for the income
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income > brackets[i].min) {
      return brackets[i].rate;
    }
  }

  return brackets[0].rate;
}

/**
 * Get capital gains tax rate
 * @param {number} income - Taxable income
 * @param {string} filingStatus - Tax filing status
 * @param {number} year - Tax year
 * @returns {number} - Capital gains rate
 */
function getCapitalGainsRate(income, filingStatus = "single", year = 2024) {
  const brackets =
    TAX_CONSTANTS.CAPITAL_GAINS_BRACKETS[year]?.[filingStatus] ||
    TAX_CONSTANTS.CAPITAL_GAINS_BRACKETS[2024][filingStatus];

  if (!brackets) return 0;

  // Find the bracket for the income
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income > brackets[i].min) {
      return brackets[i].rate;
    }
  }

  return brackets[0].rate;
}

/**
 * Calculate decision factor scores for exercise decisions
 * @param {Object} data - Decision input data
 * @returns {Object} - Calculated scores for decision factors
 */
export function calculateDecisionFactors(data) {
  return {
    financialCapacity: calculateFinancialCapacityScore(data),
    companyOutlook: calculateCompanyOutlookScore(data),
    taxEfficiency: calculateTaxEfficiencyScore(data),
    timing: calculateTimingScore(data),
  };
}

/**
 * Calculate financial capacity score
 * @param {Object} data - Decision input data
 * @returns {number} - Financial capacity score (0-1)
 */
function calculateFinancialCapacityScore(data) {
  // Calculate exercise cost
  const exerciseCost = (data.strikePrice || 0) * (data.vestedShares || 0);

  // Calculate total liquid assets
  const liquidAssets =
    (data.availableCash || 0) + (data.otherLiquidAssets || 0);

  // Calculate financial capacity ratio (assets / cost)
  const capacityRatio = exerciseCost > 0 ? liquidAssets / exerciseCost : 0;

  // Calculate debt-to-income ratio
  const monthlyIncome = (data.currentIncome || 0) / 12;
  const debtRatio =
    monthlyIncome > 0 ? (data.monthlyExpenses || 0) / monthlyIncome : 1;

  // Factor in risk tolerance (higher tolerance improves score)
  const riskFactor =
    data.riskTolerance === "very_low"
      ? 0.6
      : data.riskTolerance === "low"
      ? 0.8
      : data.riskTolerance === "medium"
      ? 1.0
      : data.riskTolerance === "high"
      ? 1.2
      : 1.4; // very_high

  // Calculate base score from capacity ratio
  let baseScore = 0;
  if (capacityRatio >= 3) baseScore = 1.0;
  else if (capacityRatio >= 2) baseScore = 0.9;
  else if (capacityRatio >= 1.5) baseScore = 0.8;
  else if (capacityRatio >= 1.2) baseScore = 0.7;
  else if (capacityRatio >= 1.0) baseScore = 0.6;
  else if (capacityRatio >= 0.8) baseScore = 0.5;
  else if (capacityRatio >= 0.6) baseScore = 0.4;
  else if (capacityRatio >= 0.4) baseScore = 0.3;
  else if (capacityRatio >= 0.2) baseScore = 0.2;
  else baseScore = 0.1;

  // Adjust for debt ratio (lower debt improves score)
  const debtAdjustment =
    debtRatio <= 0.2
      ? 0.1
      : debtRatio <= 0.3
      ? 0.05
      : debtRatio <= 0.4
      ? 0
      : debtRatio <= 0.5
      ? -0.05
      : -0.1;

  // Apply risk tolerance factor and debt adjustment
  let finalScore = baseScore * riskFactor + debtAdjustment;

  // Ensure score stays in 0-1 range
  return Math.max(0, Math.min(1, finalScore));
}

/**
 * Calculate company outlook score
 * @param {Object} data - Decision input data
 * @returns {number} - Company outlook score (0-1)
 */
function calculateCompanyOutlookScore(data) {
  // Base score based on company stage
  const stageScore =
    data.companyStage === "seed"
      ? 0.4
      : data.companyStage === "early"
      ? 0.5
      : data.companyStage === "growth"
      ? 0.7
      : data.companyStage === "late"
      ? 0.8
      : data.companyStage === "pre_ipo"
      ? 0.9
      : 1.0; // public

  // Growth rate score
  const growthRate = data.growthRate || 0;
  const growthScore =
    growthRate <= 0
      ? 0.3
      : growthRate <= 10
      ? 0.5
      : growthRate <= 20
      ? 0.6
      : growthRate <= 30
      ? 0.7
      : growthRate <= 50
      ? 0.8
      : growthRate <= 75
      ? 0.9
      : 1.0;

  // Financing history score
  const financingScore =
    data.financingHistory === "strong"
      ? 0.9
      : data.financingHistory === "moderate"
      ? 0.7
      : data.financingHistory === "weak"
      ? 0.4
      : 0.6; // unknown

  // Calculate weighted average
  return stageScore * 0.4 + growthScore * 0.3 + financingScore * 0.3;
}

/**
 * Calculate tax efficiency score
 * @param {Object} data - Decision input data
 * @returns {number} - Tax efficiency score (0-1)
 */
function calculateTaxEfficiencyScore(data) {
  // Different calculation based on option type
  const optionType = data.optionType || "iso";

  if (optionType === "iso") {
    // For ISOs, consider AMT implications
    const spread =
      ((data.currentFMV || 0) - (data.strikePrice || 0)) *
      (data.vestedShares || 0);
    const totalIncome = (data.currentIncome || 0) + spread;

    // Higher spread and income increase AMT risk, lowering score
    const amtRiskFactor =
      totalIncome <= 100000
        ? 0.9
        : totalIncome <= 200000
        ? 0.8
        : totalIncome <= 400000
        ? 0.6
        : totalIncome <= 600000
        ? 0.4
        : 0.2;

    // State tax impact
    const stateImpact =
      data.stateOfResidence === "California"
        ? 0.3
        : data.stateOfResidence === "New York"
        ? 0.3
        : data.stateOfResidence === "Texas"
        ? 0.8
        : 0.6; // Default for other states

    return amtRiskFactor * 0.7 + stateImpact * 0.3;
  } else if (optionType === "nso") {
    // For NSOs, ordinary income tax applies immediately on exercise
    // Higher spread means higher immediate tax, lowering score
    const spread =
      ((data.currentFMV || 0) - (data.strikePrice || 0)) *
      (data.vestedShares || 0);
    const taxRatio =
      (data.currentIncome || 0) > 0 ? spread / (data.currentIncome || 0) : 1;

    // Lower ratio is better for tax efficiency
    const taxEfficiency =
      taxRatio <= 0.1
        ? 0.9
        : taxRatio <= 0.2
        ? 0.8
        : taxRatio <= 0.5
        ? 0.6
        : taxRatio <= 1.0
        ? 0.4
        : taxRatio <= 2.0
        ? 0.2
        : 0.1;

    return taxEfficiency;
  } else {
    // RSUs
    // RSUs are typically taxed at vesting - tax efficiency for exercise N/A
    return 0.5; // Neutral score
  }
}

/**
 * Calculate timing score
 * @param {Object} data - Decision input data
 * @returns {number} - Timing score (0-1)
 */
function calculateTimingScore(data) {
  // Consider time to expiration
  const expirationScore =
    (data.timeToExpiration || 0) <= 0.5
      ? 0.9 // Urgent to exercise
      : (data.timeToExpiration || 0) <= 1
      ? 0.8
      : (data.timeToExpiration || 0) <= 2
      ? 0.6
      : (data.timeToExpiration || 0) <= 5
      ? 0.4
      : 0.2; // Plenty of time

  // Consider exit timeline
  const exitScore =
    data.exitTimeline === "imminent"
      ? 0.9 // Good time to exercise
      : data.exitTimeline === "1-2_years"
      ? 0.7
      : data.exitTimeline === "3-5_years"
      ? 0.5
      : data.exitTimeline === "5+_years"
      ? 0.3
      : 0.5; // unknown

  // Weight expiration more heavily if it's more urgent
  const expirationWeight = (data.timeToExpiration || 0) <= 2 ? 0.7 : 0.4;
  const exitWeight = 1 - expirationWeight;

  return expirationScore * expirationWeight + exitScore * exitWeight;
}

/**
 * Calculate gross proceeds from selling shares
 * @param {number} shares - Number of shares
 * @param {number} sellPrice - Price per share when selling
 * @returns {number} - Total gross proceeds
 */
export function calculateGrossProceeds(shares, sellPrice) {
  return shares * sellPrice;
}
/**
 * Calculate the total number of vested shares
 * @param {Object} grant - The equity grant object
 * @returns {number} - The number of vested shares
 */
export function calculateVestedShares(grant) {
  if (!grant) return 0;

  const now = new Date();
  const vestingStart = grant.vesting_start_date
    ? new Date(grant.vesting_start_date)
    : null;
  const totalShares = grant.shares ? Number(grant.shares) : 0;

  // Data validation: If no valid vesting start date or no shares, return 0
  if (!vestingStart || !totalShares || totalShares <= 0) return 0;

  // Get vesting end date (with fallback to 4 years from start if missing)
  const vestingEndInput = grant.vesting_end_date || null;
  const vestingEnd = vestingEndInput
    ? new Date(vestingEndInput)
    : new Date(
        vestingStart.getFullYear() + 4,
        vestingStart.getMonth(),
        vestingStart.getDate()
      );

  // Get cliff date (with fallback to 1 year from start if missing)
  const cliffDateInput = grant.vesting_cliff_date || null;
  const cliffDate = cliffDateInput
    ? new Date(cliffDateInput)
    : new Date(
        vestingStart.getFullYear() + 1,
        vestingStart.getMonth(),
        vestingStart.getDate()
      );

  // Calculate months since vesting start
  const monthsSinceStart =
    (now.getFullYear() - vestingStart.getFullYear()) * 12 +
    (now.getMonth() - vestingStart.getMonth());

  // If vesting hasn't started yet, return 0
  if (monthsSinceStart <= 0) return 0;

  // If the vesting end date has passed, return total shares (fully vested)
  if (now >= vestingEnd) return totalShares;

  // Handle cliff vesting
  if (now < cliffDate) {
    return 0; // Before cliff date, nothing is vested
  }

  // Calculate vested percentage based on vesting schedule
  let vestedPercentage = 0;
  const vestingSchedule = grant.vesting_schedule || "monthly";

  // Calculate total vesting period in months
  const totalVestingMonths =
    (vestingEnd.getFullYear() - vestingStart.getFullYear()) * 12 +
    (vestingEnd.getMonth() - vestingStart.getMonth());

  if (totalVestingMonths <= 0) return totalShares; // Safety check

  if (vestingSchedule === "monthly") {
    // Simple monthly vesting after cliff
    if (now >= cliffDate) {
      // Calculate cliff percentage (usually 25% for 1-year cliff)
      const cliffMonths =
        (cliffDate.getFullYear() - vestingStart.getFullYear()) * 12 +
        (cliffDate.getMonth() - vestingStart.getMonth());

      const cliffPercentage = cliffMonths / totalVestingMonths;

      // Calculate additional vesting after cliff
      const monthsAfterCliff = monthsSinceStart - cliffMonths;
      const remainingPercentage = 1 - cliffPercentage;
      const monthlyRate =
        remainingPercentage / (totalVestingMonths - cliffMonths);

      vestedPercentage = Math.min(
        cliffPercentage + monthsAfterCliff * monthlyRate,
        1
      );
    }
  } else if (vestingSchedule === "quarterly") {
    // Quarterly vesting
    const quartersSinceStart = Math.floor(monthsSinceStart / 3);
    const totalQuarters = Math.ceil(totalVestingMonths / 3);
    vestedPercentage = Math.min(quartersSinceStart / totalQuarters, 1);
  } else if (vestingSchedule === "yearly") {
    // Annual vesting
    const yearsSinceStart = Math.floor(monthsSinceStart / 12);
    const totalYears = Math.ceil(totalVestingMonths / 12);
    vestedPercentage = Math.min(yearsSinceStart / totalYears, 1);
  } else {
    // Default to simple linear vesting
    vestedPercentage = Math.min(monthsSinceStart / totalVestingMonths, 1);
  }

  // RSUs may require liquidity event
  if (grant.grant_type === "RSU" && grant.liquidity_event_only === true) {
    return 0; // Double-trigger RSUs don't vest until liquidity event
  }

  // Calculate and return vested shares (ensuring it's a valid number)
  const vestedShares = Math.floor(totalShares * vestedPercentage);
  return isNaN(vestedShares) ? 0 : vestedShares;
}

/**
 * Calculate exercise cost for options
 * @param {number} shares - Number of shares to exercise
 * @param {number} strikePrice - Strike price per share
 * @returns {number} - Total exercise cost
 */
export function calculateExerciseCost(shares, strikePrice) {
  const numShares = Number(shares) || 0;
  const numStrikePrice = Number(strikePrice) || 0;
  return numShares * numStrikePrice;
}

/**
 * Calculate current value of shares
 * @param {number} shares - Number of shares
 * @param {number} currentFMV - Current fair market value per share
 * @returns {number} - Total value of shares
 */
export function calculateCurrentValue(shares, currentFMV) {
  const numShares = Number(shares) || 0;
  const numFMV = Number(currentFMV) || 0;
  return numShares * numFMV;
}

/**
 * Calculate vesting percentage
 * @param {number} vestedShares - Number of vested shares
 * @param {number} totalShares - Total number of shares
 * @returns {number} - Vesting percentage (0-100)
 */
export function calculateVestingPercentage(vestedShares, totalShares) {
  const numVestedShares = Number(vestedShares) || 0;
  const numTotalShares = Number(totalShares) || 1; // Avoid division by zero
  return (numVestedShares / numTotalShares) * 100;
}

/**
 * Calculate potential return percentage
 * @param {number} currentFMV - Current fair market value
 * @param {number} strikePrice - Strike price
 * @returns {number} - Return percentage (0-100)
 */
export function calculateReturnPercentage(currentFMV, strikePrice) {
  const numFMV = Number(currentFMV) || 0;
  const numStrikePrice = Number(strikePrice) || 1; // Avoid division by zero

  // Calculate how much the share price has increased
  const increase = numFMV - numStrikePrice;

  // Calculate the percentage increase
  const returnPercentage = (increase / numStrikePrice) * 100;

  return returnPercentage;
}
