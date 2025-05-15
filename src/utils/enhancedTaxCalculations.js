// src/utils/enhancedTaxCalculations.js
import { getTaxConfig } from './taxConfig';

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
 * @param {string} params.filingStatus - Filing status (single, married_joint, etc.)
 * @returns {Object} AMT calculation results with detailed breakdown
 */
export function calculateAMT({
  income,
  amtIncome,
  amtCredits = 0,
  year = new Date().getFullYear(),
  filingStatus = "single",
}) {
  // Get AMT parameters for the specific tax year
  const { exemptionAmount, phaseoutThreshold, phaseoutRate, rates } =
    getAMTParams(year, filingStatus);

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

  // Calculate AMT tax - using tiered rates
  const amtTaxableIncome = Math.max(0, totalAMTIncome - exemption);
  let amtTax = 0;
  
  if (amtTaxableIncome <= rates[0].threshold) {
    amtTax = amtTaxableIncome * rates[0].rate;
  } else {
    amtTax = rates[0].threshold * rates[0].rate;
    amtTax += (amtTaxableIncome - rates[0].threshold) * rates[1].rate;
  }

  // Calculate regular tax (simplified for the example)
  const regularTax = calculateRegularTax(income, year, filingStatus);

  // AMT is the excess of AMT calculation over regular tax
  const amtExcess = Math.max(0, amtTax - regularTax);

  // Apply available AMT credits
  const amtCreditUsed = Math.min(amtCredits, amtExcess);
  const remainingAMTCredit = amtCredits - amtCreditUsed;
  const netAMTDue = amtExcess - amtCreditUsed;

  // New AMT credit generated this year (for future years)
  const newAMTCredit = netAMTDue;

  return {
    amtIncome: totalAMTIncome,
    amtTaxableIncome,
    exemption,
    amtTax,
    regularTax,
    amtExcess,
    amtCreditUsed,
    remainingAMTCredit,
    netAMTDue,
    amtCredit: newAMTCredit,
    effectiveTaxRate: income > 0 ? (regularTax + netAMTDue) / income : 0,
    breakdown: {
      exemptionAmount,
      phaseoutThreshold,
      phaseoutAmount: exemptionAmount - exemption,
      rates,
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
    stateTax: 0,
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

    result.stateTax += stateTax;
  });

  return result;
}

/**
 * Calculate Net Investment Income Tax (NIIT)
 * @param {Object} params - Tax calculation parameters
 * @param {number} params.investmentIncome - Income subject to NIIT
 * @param {number} params.otherIncome - Other income (to determine threshold)
 * @param {string} params.filingStatus - Filing status
 * @returns {Object} NIIT calculation results
 */
export function calculateNIIT({ investmentIncome, otherIncome, filingStatus = "single" }) {
  const niitRate = 0.038; // 3.8%
  
  // NIIT thresholds by filing status
  const niitThresholds = {
    single: 200000,
    married_joint: 250000,
    married_separate: 125000,
    head_household: 200000,
  };
  
  const threshold = niitThresholds[filingStatus] || niitThresholds.single;
  const totalIncome = investmentIncome + otherIncome;
  
  // NIIT applies to investment income or excess of threshold, whichever is less
  const niitExcess = Math.max(0, totalIncome - threshold);
  const niitAmount = Math.min(investmentIncome, niitExcess);
  const niitTax = niitAmount * niitRate;
  
  return {
    niitTax,
    investmentIncome,
    threshold,
    excess: niitExcess,
    effectiveRate: investmentIncome > 0 ? niitTax / investmentIncome : 0,
  };
}

/**
 * Calculate federal income tax based on brackets
 * @param {number} income - Taxable income
 * @param {number} year - Tax year
 * @param {string} filingStatus - Filing status
 * @returns {number} Federal income tax
 */
export function calculateFederalIncomeTax(income, year, filingStatus = "single") {
  const config = getTaxConfig(year);
  const brackets = config.federal.brackets;
  const thresholdKey = filingStatus === "married_joint" ? "jointThreshold" : "singleThreshold";
  
  let tax = 0;
  let remainingIncome = income;
  
  for (let i = 0; i < brackets.length; i++) {
    const currentBracket = brackets[i];
    const nextBracket = brackets[i + 1];
    
    const bracketIncome = nextBracket 
      ? Math.min(remainingIncome, nextBracket[thresholdKey] - currentBracket[thresholdKey])
      : remainingIncome;
    
    if (bracketIncome <= 0) break;
    
    tax += bracketIncome * currentBracket.rate;
    remainingIncome -= bracketIncome;
  }
  
  return tax;
}

/**
 * Calculate capital gains tax based on income brackets
 * @param {number} shortTermGains - Short-term capital gains
 * @param {number} longTermGains - Long-term capital gains
 * @param {number} otherIncome - Other income
 * @param {number} year - Tax year
 * @param {string} filingStatus - Filing status
 * @returns {Object} Capital gains tax breakdown
 */
export function calculateCapitalGainsTax(
  shortTermGains,
  longTermGains,
  otherIncome,
  year,
  filingStatus = "single"
) {
  const config = getTaxConfig(year);
  const brackets = config.federal.capitalGains.longTerm;
  const thresholdKey = filingStatus === "married_joint" ? "jointThreshold" : "singleThreshold";
  
  // Short-term gains are taxed as ordinary income
  const shortTermTax = calculateFederalIncomeTax(shortTermGains + otherIncome, year, filingStatus) -
                       calculateFederalIncomeTax(otherIncome, year, filingStatus);
  
  // Long-term gains are taxed at capital gains rates
  let longTermTax = 0;
  let remainingGains = longTermGains;
  const totalIncome = otherIncome + shortTermGains;  // Income that "fills up" brackets before long-term gains
  
  for (let i = 0; i < brackets.length; i++) {
    const currentBracket = brackets[i];
    const nextBracket = brackets[i + 1];
    
    // Calculate how much of this bracket is already filled by other income
    const filledAmount = Math.max(0, totalIncome - currentBracket[thresholdKey]);
    const availableBracketSpace = nextBracket 
      ? Math.max(0, nextBracket[thresholdKey] - Math.max(totalIncome, currentBracket[thresholdKey]))
      : remainingGains;
    
    const gainsInBracket = Math.min(remainingGains, availableBracketSpace);
    
    if (gainsInBracket <= 0) break;
    
    longTermTax += gainsInBracket * currentBracket.rate;
    remainingGains -= gainsInBracket;
  }
  
  return {
    shortTermTax,
    longTermTax,
    totalCapitalGainsTax: shortTermTax + longTermTax,
    effectiveRate: (shortTermGains + longTermGains) > 0 
                   ? (shortTermTax + longTermTax) / (shortTermGains + longTermGains) 
                   : 0,
  };
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
  // Tax year from exercise date
  const exerciseYear = taxSettings.exerciseDate 
    ? new Date(taxSettings.exerciseDate).getFullYear() 
    : new Date().getFullYear();
  
  // Sale year from sale date
  const saleYear = taxSettings.saleDate
    ? new Date(taxSettings.saleDate).getFullYear()
    : exerciseYear + 1;

  // Initialize result structure with more comprehensive details
  const result = {
    // Grant details
    grant_type: grant.grant_type,
    currentFMV: grant.current_fmv,
    sharesToExercise: shares,
    exerciseCost: exercisePrice * shares,
    
    // Federal tax components
    federal: {
      ordinaryIncome: 0,
      ordinaryTax: 0,
      shortTermGains: 0,
      longTermGains: 0,
      shortTermTax: 0,
      longTermTax: 0,
      federalTax: 0,
      niitTax: 0,
    },
    
    // AMT components
    amt: {
      amtIncome: 0,
      exemption: 0,
      amtTax: 0,
      amtCredit: 0,
      netAMTDue: 0,
    },
    
    // State tax components
    state: {
      stateTax: 0,
      stateBreakdown: [],
    },
    
    // Totals
    totals: {
      totalIncome: 0,
      totalTax: 0,
      effectiveRate: 0,
      netProceeds: 0,
    },
    
    // Storing assumptions used
    assumptions: {
      ...taxSettings,
      exerciseYear,
      saleYear,
    },
    
    // Timing analysis
    timing: {
      isLongTerm: isLongTermHolding(taxSettings.exerciseDate, taxSettings.saleDate),
      holdingPeriod: calculateHoldingPeriod(taxSettings.exerciseDate, taxSettings.saleDate),
    },
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

    // For ISOs, the spread is not regular income, but is AMT income
    result.federal.ordinaryIncome = 0;
    
    // If the ISO is not held long enough, disqualifying disposition - taxed as NSO
    if (!isLongTerm) {
      result.federal.ordinaryIncome = spread;
      result.federal.shortTermGains = capitalGain;
    } else {
      // Qualifying disposition - all treated as capital gains
      result.federal.longTermGains = capitalGain + spread;
    }

    // Calculate federal ordinary income tax
    if (result.federal.ordinaryIncome > 0) {
      result.federal.ordinaryTax = calculateFederalIncomeTax(
        result.federal.ordinaryIncome + (taxSettings.otherIncome || 0),
        exerciseYear,
        taxSettings.filingStatus
      ) - calculateFederalIncomeTax(
        taxSettings.otherIncome || 0,
        exerciseYear,
        taxSettings.filingStatus
      );
    }
    
    // Calculate capital gains tax
    const capitalGainsTax = calculateCapitalGainsTax(
      result.federal.shortTermGains,
      result.federal.longTermGains,
      taxSettings.otherIncome + result.federal.ordinaryIncome,
      saleYear,
      taxSettings.filingStatus
    );
    
    result.federal.shortTermTax = capitalGainsTax.shortTermTax;
    result.federal.longTermTax = capitalGainsTax.longTermTax;
    
    // Total federal tax
    result.federal.federalTax = result.federal.ordinaryTax + 
                                result.federal.shortTermTax + 
                                result.federal.longTermTax;

    // Calculate AMT if enabled
    if (taxSettings.includeAMT) {
      const amtResult = calculateAMT({
        income: taxSettings.otherIncome || 0,
        amtIncome: spread,
        amtCredits: taxSettings.priorAMTCredits || 0,
        year: exerciseYear,
        filingStatus: taxSettings.filingStatus,
      });

      result.amt = {
        amtIncome: amtResult.amtIncome,
        exemption: amtResult.exemption,
        amtTax: amtResult.amtTax,
        regularTax: amtResult.regularTax,
        amtExcess: amtResult.amtExcess,
        amtCreditUsed: amtResult.amtCreditUsed,
        amtCredit: amtResult.amtCredit,
        netAMTDue: amtResult.netAMTDue,
      };
    }

    // Calculate NIIT if enabled
    if (taxSettings.includeNIIT) {
      const niitResult = calculateNIIT({
        investmentIncome: capitalGain,
        otherIncome: taxSettings.otherIncome || 0,
        filingStatus: taxSettings.filingStatus,
      });
      
      result.federal.niitTax = niitResult.niitTax;
    }

    // Calculate state tax with multi-state allocation if enabled
    if (taxSettings.isMultiState && taxSettings.stateAllocation) {
      result.state = calculateMultiStateTax({
        income: spread + capitalGain,
        stateData: taxSettings.stateAllocation,
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

    // Calculate federal ordinary income tax
    result.federal.ordinaryTax = calculateFederalIncomeTax(
      result.federal.ordinaryIncome + (taxSettings.otherIncome || 0),
      exerciseYear,
      taxSettings.filingStatus
    ) - calculateFederalIncomeTax(
      taxSettings.otherIncome || 0,
      exerciseYear,
      taxSettings.filingStatus
    );
    
    // Calculate capital gains tax
    const capitalGainsTax = calculateCapitalGainsTax(
      result.federal.shortTermGains,
      result.federal.longTermGains,
      taxSettings.otherIncome + result.federal.ordinaryIncome,
      saleYear,
      taxSettings.filingStatus
    );
    
    result.federal.shortTermTax = capitalGainsTax.shortTermTax;
    result.federal.longTermTax = capitalGainsTax.longTermTax;
    
    // Total federal tax
    result.federal.federalTax = result.federal.ordinaryTax + 
                                result.federal.shortTermTax + 
                                result.federal.longTermTax;

    // Calculate NIIT if enabled
    if (taxSettings.includeNIIT) {
      const niitResult = calculateNIIT({
        investmentIncome: capitalGain,
        otherIncome: taxSettings.otherIncome || 0,
        filingStatus: taxSettings.filingStatus,
      });
      
      result.federal.niitTax = niitResult.niitTax;
    }

    // Calculate state tax
    if (taxSettings.isMultiState && taxSettings.stateAllocation) {
      result.state = calculateMultiStateTax({
        income: spread + capitalGain,
        stateData: taxSettings.stateAllocation,
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
      taxSettings.vestingDate || taxSettings.exerciseDate,
      taxSettings.saleDate
    );

    result.federal.ordinaryIncome = vestValue;
    result.federal.shortTermGains = isLongTerm ? 0 : capitalGain;
    result.federal.longTermGains = isLongTerm ? capitalGain : 0;

    // Calculate federal ordinary income tax
    result.federal.ordinaryTax = calculateFederalIncomeTax(
      result.federal.ordinaryIncome + (taxSettings.otherIncome || 0),
      exerciseYear,
      taxSettings.filingStatus
    ) - calculateFederalIncomeTax(
      taxSettings.otherIncome || 0,
      exerciseYear,
      taxSettings.filingStatus
    );
    
    // Calculate capital gains tax
    const capitalGainsTax = calculateCapitalGainsTax(
      result.federal.shortTermGains,
      result.federal.longTermGains,
      taxSettings.otherIncome + result.federal.ordinaryIncome,
      saleYear,
      taxSettings.filingStatus
    );
    
    result.federal.shortTermTax = capitalGainsTax.shortTermTax;
    result.federal.longTermTax = capitalGainsTax.longTermTax;
    
    // Total federal tax
    result.federal.federalTax = result.federal.ordinaryTax + 
                                result.federal.shortTermTax + 
                                result.federal.longTermTax;

    // Calculate NIIT if enabled
    if (taxSettings.includeNIIT) {
      const niitResult = calculateNIIT({
        investmentIncome: capitalGain,
        otherIncome: taxSettings.otherIncome || 0,
        filingStatus: taxSettings.filingStatus,
      });
      
      result.federal.niitTax = niitResult.niitTax;
    }

    // Calculate state tax
    if (taxSettings.isMultiState && taxSettings.stateAllocation) {
      result.state = calculateMultiStateTax({
        income: vestValue + capitalGain,
        stateData: taxSettings.stateAllocation,
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
  // Total income includes all types of income
  result.totals.totalIncome = result.federal.ordinaryIncome + 
                             result.federal.shortTermGains + 
                             result.federal.longTermGains;
  
  // Total tax includes federal, AMT, NIIT, and state taxes
  result.totals.totalTax = result.federal.federalTax + 
                          (result.amt?.netAMTDue || 0) + 
                          (result.federal.niitTax || 0) + 
                          result.state.stateTax;
  
  // Effective tax rate is total tax divided by total income
  result.totals.effectiveRate = result.totals.totalIncome > 0 
    ? result.totals.totalTax / result.totals.totalIncome
    : 0;
  
  // Net proceeds is gross proceeds minus taxes and costs
  result.totals.netProceeds = (exitPrice * shares) - 
                             result.exerciseCost - 
                             result.totals.totalTax;

  return result;
}

// Helper functions

/**
 * Get AMT parameters for a specific tax year and filing status
 * @param {number} year - Tax year
 * @param {string} filingStatus - Filing status
 * @returns {Object} AMT parameters
 */
function getAMTParams(year, filingStatus = "single") {
  const config = getTaxConfig(year);
  const amt = config.federal.amt;
  
  return {
    exemptionAmount: filingStatus === "married_joint" ? amt.exemption.joint : amt.exemption.single,
    phaseoutThreshold: filingStatus === "married_joint" ? amt.phaseoutStart.joint : amt.phaseoutStart.single,
    phaseoutRate: amt.phaseoutRate,
    rates: amt.rates,
  };
}

/**
 * Calculate regular tax (simplified)
 * @param {number} income - Taxable income
 * @param {number} year - Tax year
 * @param {string} filingStatus - Filing status
 * @returns {number} Regular tax amount
 */
function calculateRegularTax(income, year, filingStatus = "single") {
  return calculateFederalIncomeTax(income, year, filingStatus);
}

/**
 * Calculate workday allocation across states
 * @param {Object} stateData - State allocation data
 * @param {Object} grantDates - Grant and vesting dates
 * @returns {Object} Workday allocation
 */
function calculateWorkdayAllocation(stateData, grantDates) {
  // In a real implementation, this would calculate precise allocation
  // For the example, we'll just use the provided allocation
  const result = {};
  
  // If stateData is an object with state->percentage mapping
  if (typeof stateData === 'object' && !Array.isArray(stateData)) {
    Object.entries(stateData).forEach(([state, percentage]) => {
      result[state] = { percentage, days: Math.floor(percentage * 365) };
    });
  } 
  // If stateData is not provided, default to California
  else {
    result["California"] = { percentage: 1.0, days: 365 };
  }
  
  return result;
}

/**
 * Get state tax rate for given state code
 * @param {string} stateCode - State code
 * @returns {number} State tax rate
 */
function getStateRate(stateCode) {
  // Return state tax rate for the given state code
  const stateRates = {
    "California": 0.133,
    "New York": 0.107,
    "Texas": 0,
    "Florida": 0,
    "Washington": 0,
    "Massachusetts": 0.05,
    "Illinois": 0.0495,
    // Add more states as needed
  };

  return stateRates[stateCode] || 0.05;
}

/**
 * Check if holding period is long-term (more than 1 year)
 * @param {string} acquireDate - Acquisition date
 * @param {string} saleDate - Sale date
 * @returns {boolean} True if long-term
 */
function isLongTermHolding(acquireDate, saleDate) {
  // Check if holding period is more than 1 year
  return calculateHoldingPeriod(acquireDate, saleDate) >= 365;
}

/**
 * Calculate holding period in days
 * @param {string} acquireDate - Acquisition date
 * @param {string} saleDate - Sale date
 * @returns {number} Holding period in days
 */
function calculateHoldingPeriod(acquireDate, saleDate) {
  if (!acquireDate || !saleDate) return 0;
  
  const acquire = new Date(acquireDate);
  const sale = new Date(saleDate);
  const daysDiff = Math.floor((sale - acquire) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysDiff);
}

/**
 * Calculate decision factors for equity exercise
 * @param {Object} params - Decision parameters
 * @returns {Object} Decision factors and scores
 */
export function calculateDecisionFactors(params) {
  const {
    strikePrice,
    currentFMV,
    vestedShares,
    companyStage,
    growthRate,
    financingHistory,
    availableCash,
    currentIncome,
    riskTolerance,
    stateOfResidence,
    optionType,
    timeToExpiration,
  } = params;

  // Initialize factors
  const factors = {
    financialCapacity: 0,
    companyOutlook: 0,
    taxEfficiency: 0,
    timing: 0,
  };

  // Calculate financial capacity (0-1 score)
  const exerciseCost = strikePrice * vestedShares;
  const amtImpact = optionType === "iso" ? (currentFMV - strikePrice) * vestedShares * 0.28 : 0;
  const totalCost = exerciseCost + amtImpact;
  
  factors.financialCapacity = Math.min(1, availableCash / (totalCost * 1.5));
  
  // Adjust for risk tolerance
  const riskMultiplier = {
    "very_low": 0.5,
    "low": 0.75,
    "medium": 1.0,
    "high": 1.25,
    "very_high": 1.5,
  }[riskTolerance] || 1.0;
  
  factors.financialCapacity *= riskMultiplier;
  
  // Calculate company outlook (0-1 score)
  const stageMultiplier = {
    "seed": 0.4,
    "early": 0.6,
    "growth": 0.8,
    "late": 0.9,
    "pre_ipo": 1.0,
    "public": 1.0,
  }[companyStage] || 0.7;
  
  const growthMultiplier = Math.min(1, growthRate / 50);
  
  const financingMultiplier = {
    "strong": 1.0,
    "moderate": 0.8,
    "weak": 0.5,
  }[financingHistory] || 0.8;
  
  factors.companyOutlook = (stageMultiplier * 0.4) + 
                          (growthMultiplier * 0.3) + 
                          (financingMultiplier * 0.3);
  
  // Calculate tax efficiency (0-1 score)
  const spreadPct = (currentFMV - strikePrice) / strikePrice;
  const isoBonus = optionType === "iso" ? 0.2 : 0;
  const stateTaxPenalty = ["California", "New York"].includes(stateOfResidence) ? -0.2 : 0;
  
  factors.taxEfficiency = Math.min(1, 0.5 + (isoBonus + stateTaxPenalty) + (1 - Math.min(1, spreadPct)));
  
  // Calculate timing (0-1 score)
  const expirationUrgency = Math.max(0, 1 - (timeToExpiration / 10)); // 10 years as max
  const marketTiming = 0.7; // This would be a more complex market assessment
  
  factors.timing = (expirationUrgency * 0.7) + (marketTiming * 0.3);
  
  // Ensure all factors are between 0 and 1
  Object.keys(factors).forEach(key => {
    factors[key] = Math.max(0, Math.min(1, factors[key]));
  });
  
  return factors;
}