/**
 * Calculate comprehensive tax impact for a scenario
 * @param {Object} grant - The equity grant
 * @param {number} exercisePrice - Price per share at exercise
 * @param {number} exitPrice - Price per share at exit
 * @param {number} shares - Number of shares
 * @param {boolean} isLongTerm - Whether holding period is long-term
 * @param {Object} taxSettings - Tax settings
 * @returns {Object} - Comprehensive tax analysis
 */

export function calculateComprehensiveTax(
  grant,
  exercisePrice,
  exitPrice,
  shares,
  isLongTerm = false,
  taxSettings = {}
) {
  // Default tax settings
  const settings = {
    federalRate: 0.35,
    stateRate: 0.1,
    filingStatus: "single",
    income: 150000,
    ...taxSettings,
  };

  // Calculate spread at exercise (for options)
  const spread =
    grant.grant_type !== "RSU"
      ? Math.max(0, (grant.current_fmv - grant.strike_price) * shares)
      : 0;

  // Calculate profit at sale
  const exerciseCost =
    grant.grant_type !== "RSU" ? grant.strike_price * shares : 0;
  const saleProceeds = exitPrice * shares;
  const totalIncome = saleProceeds - exerciseCost;

  // Initialize result structure
  const result = {
    federal: {
      ordinaryIncome: 0,
      shortTermGains: 0,
      longTermGains: 0,
      federalTax: 0,
      capitalGainsTax: 0,
    },
    amt: null,
    state: {
      stateTax: 0,
      stateBreakdown: [],
    },
    totals: {
      exerciseCost,
      totalIncome,
      totalTax: 0,
      effectiveRate: 0,
      netProceeds: 0,
    },
    assumptions: settings,
  };

  // Comprehensive tax calculation based on grant type
  if (grant.grant_type === "ISO") {
    // For ISOs
    if (isLongTerm) {
      // Qualifying disposition - all gain is LTCG
      result.federal.longTermGains = totalIncome;
      result.federal.capitalGainsTax = calculateCapitalGainsTax(
        totalIncome,
        settings.income,
        isLongTerm
      );
      result.federal.federalTax = result.federal.capitalGainsTax;

      // Calculate AMT at exercise
      if (spread > 0) {
        result.amt = {
          amtIncome: spread,
          exemption: calculateAMTExemption(
            settings.income + spread,
            settings.filingStatus
          ),
          netAMTDue: calculateAMT(
            spread,
            settings.income,
            settings.filingStatus
          ),
          amtCredit: 0,
        };
      }
    } else {
      // Disqualifying disposition - spread is ordinary income, remainder is CG
      result.federal.ordinaryIncome = spread;
      result.federal.federalTax = calculateOrdinaryIncomeTax(
        spread,
        settings.income,
        settings.federalRate
      );

      const remainingGain = totalIncome - spread;
      if (remainingGain > 0) {
        if (isLongTerm) {
          result.federal.longTermGains = remainingGain;
          result.federal.capitalGainsTax = calculateCapitalGainsTax(
            remainingGain,
            settings.income + spread,
            true
          );
        } else {
          result.federal.shortTermGains = remainingGain;
          result.federal.capitalGainsTax = calculateOrdinaryIncomeTax(
            remainingGain,
            settings.income + spread,
            settings.federalRate
          );
        }
        result.federal.federalTax += result.federal.capitalGainsTax;
      }

      // No AMT in disqualifying disposition
      result.amt = null;
    }

    // State taxes
    result.state.stateTax = totalIncome * settings.stateRate;
    result.state.stateBreakdown = [
      {
        stateCode: settings.stateOfResidence || "California",
        allocation: 1.0,
        stateTax: result.state.stateTax,
      },
    ];
  } else if (grant.grant_type === "NSO") {
    // For NSOs
    // 1. Spread at exercise is ordinary income
    result.federal.ordinaryIncome = spread;
    result.federal.federalTax = calculateOrdinaryIncomeTax(
      spread,
      settings.income,
      settings.federalRate
    );

    // 2. Gain from exercise to sale is capital gain
    const postExerciseGain = saleProceeds - grant.current_fmv * shares;

    if (postExerciseGain > 0) {
      if (isLongTerm) {
        result.federal.longTermGains = postExerciseGain;
        result.federal.capitalGainsTax = calculateCapitalGainsTax(
          postExerciseGain,
          settings.income + spread,
          true
        );
      } else {
        result.federal.shortTermGains = postExerciseGain;
        result.federal.capitalGainsTax = calculateOrdinaryIncomeTax(
          postExerciseGain,
          settings.income + spread,
          settings.federalRate
        );
      }
      result.federal.federalTax += result.federal.capitalGainsTax;
    }

    // State taxes
    result.state.stateTax = totalIncome * settings.stateRate;
    result.state.stateBreakdown = [
      {
        stateCode: settings.stateOfResidence || "California",
        allocation: 1.0,
        stateTax: result.state.stateTax,
      },
    ];
  } else if (grant.grant_type === "RSU") {
    // For RSUs
    // Value at vesting is ordinary income
    const vestingValue = grant.current_fmv * shares;
    result.federal.ordinaryIncome = vestingValue;
    result.federal.federalTax = calculateOrdinaryIncomeTax(
      vestingValue,
      settings.income,
      settings.federalRate
    );

    // Gain from vesting to sale is capital gain
    const postVestingGain = saleProceeds - vestingValue;

    if (postVestingGain > 0) {
      if (isLongTerm) {
        result.federal.longTermGains = postVestingGain;
        result.federal.capitalGainsTax = calculateCapitalGainsTax(
          postVestingGain,
          settings.income + vestingValue,
          true
        );
      } else {
        result.federal.shortTermGains = postVestingGain;
        result.federal.capitalGainsTax = calculateOrdinaryIncomeTax(
          postVestingGain,
          settings.income + vestingValue,
          settings.federalRate
        );
      }
      result.federal.federalTax += result.federal.capitalGainsTax;
    }

    // State taxes
    result.state.stateTax = totalIncome * settings.stateRate;
    result.state.stateBreakdown = [
      {
        stateCode: settings.stateOfResidence || "California",
        allocation: 1.0,
        stateTax: result.state.stateTax,
      },
    ];
  }

  // Calculate AMT credit if applicable
  if (result.amt) {
    result.amt.amtCredit = result.amt.netAMTDue;
  }

  // Calculate total tax
  result.totals.totalTax =
    result.federal.federalTax +
    result.state.stateTax +
    (result.amt ? result.amt.netAMTDue : 0);

  // Calculate effective tax rate
  result.totals.effectiveRate =
    totalIncome > 0 ? result.totals.totalTax / totalIncome : 0;

  // Calculate net proceeds
  result.totals.netProceeds = totalIncome - result.totals.totalTax;

  // Return comprehensive tax analysis
  return result;
}

/**
 * Generate exercise recommendation
 * @param {Object} decisionFactors - Decision factor scores
 * @param {Object} taxResult - Tax calculation results
 * @param {Object} grantInfo - Grant information
 * @returns {Object} - Exercise recommendation
 */
export function generateRecommendation(decisionFactors, taxResult, grantInfo) {
  // Calculate overall score (weighted average)
  const overallScore =
    decisionFactors.financialCapacity * 0.3 +
    decisionFactors.companyOutlook * 0.3 +
    decisionFactors.taxEfficiency * 0.2 +
    decisionFactors.timing * 0.2;

  // Base recommendation
  let recommendation = {
    action: "wait",
    confidence: "low",
    details: [],
    reasons: [],
  };

  // Determine action based on overall score
  if (overallScore >= 0.7) {
    recommendation.action = "exercise";
    recommendation.confidence = "high";
  } else if (overallScore >= 0.5) {
    recommendation.action = "partial_exercise";
    recommendation.confidence = "medium";
  } else {
    recommendation.action = "wait";
    recommendation.confidence = "medium";
  }

  // Add specific details based on factors
  if (decisionFactors.financialCapacity < 0.4) {
    recommendation.details.push({
      factor: "financial_capacity",
      impact: "negative",
      message:
        "Your financial capacity is limited relative to the exercise cost.",
    });

    if (recommendation.action === "exercise") {
      recommendation.action = "partial_exercise";
    }
  }

  if (decisionFactors.taxEfficiency < 0.4) {
    recommendation.details.push({
      factor: "tax_efficiency",
      impact: "negative",
      message:
        grantInfo.grant_type === "ISO"
          ? "The AMT impact of exercising may be significant. Consider exercising in multiple tax years."
          : "The immediate tax impact will be substantial.",
    });
  }

  if (decisionFactors.companyOutlook > 0.7) {
    recommendation.details.push({
      factor: "company_outlook",
      impact: "positive",
      message:
        "The company's growth trajectory appears strong, suggesting potential for significant upside.",
    });
  } else if (decisionFactors.companyOutlook < 0.4) {
    recommendation.details.push({
      factor: "company_outlook",
      impact: "negative",
      message:
        "The company's outlook has uncertainty. Consider waiting for more positive signals.",
    });

    if (recommendation.action === "exercise") {
      recommendation.action = "partial_exercise";
      recommendation.confidence = "medium";
    }
  }

  if (decisionFactors.timing > 0.7) {
    recommendation.details.push({
      factor: "timing",
      impact: "positive",
      message: "Current timing appears favorable for exercise.",
    });
  } else if (decisionFactors.timing < 0.3) {
    recommendation.details.push({
      factor: "timing",
      impact: "negative",
      message: "Timing factors suggest waiting may be prudent.",
    });
  }

  // Add tax-specific details
  if (taxResult.amt && taxResult.amt.netAMTDue > 10000) {
    recommendation.details.push({
      factor: "amt_impact",
      impact: "negative",
      message: `The AMT impact is substantial at ${formatCurrency(
        taxResult.amt.netAMTDue
      )}.`,
    });

    if (recommendation.action === "exercise") {
      recommendation.action = "partial_exercise";
    }
  }

  // Generate summary reasons based on action
  if (recommendation.action === "exercise") {
    recommendation.reasons = [
      "Strong company outlook with significant upside potential",
      "Your financial capacity can support the exercise cost",
      "Tax implications appear manageable given the potential upside",
    ];
  } else if (recommendation.action === "partial_exercise") {
    recommendation.reasons = [
      "Exercising a portion balances risk with potential upside",
      "Reduces immediate financial and tax impact",
      "Allows you to benefit from potential growth while managing exposure",
    ];
  } else {
    recommendation.reasons = [
      "Current financial or tax implications may be substantial",
      "Company outlook has uncertainty that may resolve over time",
      "Waiting allows for more information before committing capital",
    ];
  }

  return recommendation;
}

/**
 * Calculate and recommend optimal exercise strategy
 * @param {Object} grant - The equity grant
 * @param {Object} financialData - User financial data
 * @param {Object} companyData - Company outlook data
 * @param {Object} taxSettings - Tax settings
 * @returns {Object} - Comprehensive strategy recommendation
 */
export function generateExerciseStrategy(
  grant,
  financialData,
  companyData,
  taxSettings = {}
) {
  // Calculate decision factors
  const decisionInputs = {
    strikePrice: grant.strike_price,
    currentFMV: grant.current_fmv,
    vestedShares: calculateVestedShares(grant),
    availableCash: financialData.availableCash,
    currentIncome: financialData.income,
    riskTolerance: financialData.riskTolerance || "medium",
    optionType: grant.grant_type,
    stateOfResidence: taxSettings.stateOfResidence || "California",
    timeToExpiration: calculateTimeToExpiration(grant),
    companyStage: companyData.stage,
    growthRate: companyData.growthRate,
    financingHistory: companyData.financingHistory,
  };

  const decisionFactors = calculateDecisionFactors(decisionInputs);

  // Calculate tax implications
  const taxResult = calculateComprehensiveTax(
    grant,
    grant.strike_price,
    grant.current_fmv * 3, // Assume 3x growth for calculations
    decisionInputs.vestedShares,
    false, // Assume short-term for conservative analysis
    taxSettings
  );

  // Get general recommendation
  const recommendation = generateRecommendation(
    decisionFactors,
    taxResult,
    grant
  );

  // Calculate optimal exercise amount
  const optimalAmount = calculateOptimalExerciseAmount(grant, financialData, {
    ...taxSettings,
    income: financialData.income,
  });

  // Check for special situations
  let specialSituations = [];

  // ISO limit check
  if (grant.grant_type === "ISO") {
    const isoLimitResult = calculateISOLimit(grant);
    if (isoLimitResult.isLimitExceeded) {
      specialSituations.push({
        type: "iso_limit_exceeded",
        description: `ISO limit exceeded. ${isoLimitResult.nsoShares} shares will convert to NSOs.`,
        impact:
          "Some shares will be taxed as NSOs, potentially increasing immediate tax burden.",
      });
    }
  }

  // Early exercise opportunity
  if (grant.allows_early_exercise) {
    const earlyExerciseResult = analyzeEarlyExercise(grant, true, taxSettings);
    if (
      earlyExerciseResult.applicable &&
      earlyExerciseResult.recommendation === "early_exercise"
    ) {
      specialSituations.push({
        type: "early_exercise_beneficial",
        description: "Early exercise with 83(b) election may be advantageous.",
        impact: `Potential tax savings of approximately ${formatCurrency(
          earlyExerciseResult.taxSavings
        )}.`,
      });
    }
  }

  // Double-trigger RSUs
  if (grant.grant_type === "RSU" && grant.liquidity_event_only) {
    specialSituations.push({
      type: "double_trigger_rsu",
      description:
        "RSUs require both time-based vesting and a liquidity event to vest.",
      impact: "No tax implications until both triggers are met.",
    });
  }

  // Generate final comprehensive strategy
  return {
    recommendation,
    optimalExercise: optimalAmount,
    taxImplications: {
      exerciseTax: taxResult.federal.federalTax + taxResult.state.stateTax,
      amtImpact: taxResult.amt?.netAMTDue || 0,
      effectiveTaxRate: taxResult.totals.effectiveRate,
    },
    decisionFactors,
    specialSituations,
    scenarioComparison: compareScenarios(
      grant,
      [
        {
          name: "Conservative",
          exitPrice: grant.current_fmv * 2,
          isLongTerm: true,
        },
        {
          name: "Moderate",
          exitPrice: grant.current_fmv * 5,
          isLongTerm: true,
        },
        {
          name: "Optimistic",
          exitPrice: grant.current_fmv * 10,
          isLongTerm: true,
        },
      ],
      taxSettings
    ),
  };
}

/**
 * Calculate time until option expiration
 * @param {Object} grant - The equity grant
 * @returns {number} - Years until expiration
 */
function calculateTimeToExpiration(grant) {
  if (!grant.expiration_date) {
    return 10; // Default to 10 years if no expiration date provided
  }

  const today = new Date();
  const expirationDate = new Date(grant.expiration_date);
  const yearDiff = (expirationDate - today) / (1000 * 60 * 60 * 24 * 365);

  return Math.max(0, yearDiff);
}

/**
 * Calculate vested shares
 * For simplicity, this is a placeholder - actual implementation would be more complex
 * @param {Object} grant - The equity grant
 * @returns {number} - Number of vested shares
 */
function calculateVestedShares(grant) {
  // This would call the actual implementation elsewhere
  return grant.vested_shares || 0;
}

/**
 * Compare different exit scenarios for equity grants
 * @param {Object} grant - The equity grant
 * @param {Array} scenarios - Array of scenarios to compare
 * @param {Object} taxSettings - Tax settings
 * @returns {Array} - Comparison of scenarios
 */
export function compareScenarios(grant, scenarios = [], taxSettings = {}) {
  if (!grant || !scenarios || !scenarios.length) {
    return [];
  }

  // Calculate vested shares to use in scenarios
  const vestedShares = calculateVestedShares(grant);

  // Process each scenario
  return scenarios.map((scenario) => {
    const { name, exitPrice, isLongTerm = false } = scenario;

    // Calculate tax impact
    const taxResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      vestedShares,
      isLongTerm,
      taxSettings
    );

    // Create scenario result
    return {
      name,
      exitPrice,
      isLongTerm,
      exerciseCost: taxResult.totals.exerciseCost,
      grossProceeds:
        taxResult.totals.totalIncome + taxResult.totals.exerciseCost,
      netProceeds: taxResult.totals.netProceeds,
      taxAmount: taxResult.totals.totalTax,
      effectiveTaxRate: taxResult.totals.effectiveRate,
      roi:
        taxResult.totals.exerciseCost > 0
          ? (taxResult.totals.netProceeds / taxResult.totals.exerciseCost) * 100
          : 0,
    };
  });
}
