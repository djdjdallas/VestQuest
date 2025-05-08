// src/utils/advisorEngine.js

/**
 * Generate personalized advice based on financial situation and equity data
 * @param {Object} equityData - User's equity grants and scenarios
 * @param {Object} financialData - User's broader financial situation
 * @param {Object} calculationResults - Results from equity calculations
 * @returns {Object} - Personalized advice with multiple insights
 */
export function generatePersonalizedAdvice(
  equityData,
  financialData = {},
  calculationResults = {}
) {
  const insights = [];

  // Check if we have enough financial data to generate meaningful advice
  if (!financialData || Object.keys(financialData).length === 0) {
    // Return basic advice when no financial data is available
    return {
      insights: [
        {
          type: "general",
          title: "Complete your financial profile",
          content:
            "Adding your financial information will help us provide more tailored recommendations for your equity strategy.",
          priority: "medium",
        },
      ],
      summary:
        "Update your financial profile to get personalized equity advice.",
      recommendedActions: [
        "Complete your financial profile",
        "Review your vesting schedule and upcoming events",
      ],
    };
  }

  // Get user's financial profile (with defaults)
  const {
    income = 0,
    availableCash = 0,
    otherInvestments = 0,
    debt = 0,
    monthlyExpenses = 0,
    retirementSavings = 0,
    riskTolerance = "medium",
    age = 35, // Default assumption
  } = financialData;

  // 1. Diversification advice
  const totalEquityValue = Array.isArray(equityData)
    ? equityData.reduce(
        (sum, grant) =>
          sum + (grant.vested_shares || 0) * (grant.current_fmv || 0),
        0
      )
    : 0;

  const totalNetWorth =
    totalEquityValue + otherInvestments + availableCash - debt;

  const equityConcentration =
    totalNetWorth > 0 ? totalEquityValue / totalNetWorth : 0;

  if (equityConcentration > 0.3) {
    insights.push({
      type: "diversification",
      title: "Consider diversifying your investments",
      content: `Your equity makes up ${(equityConcentration * 100).toFixed(
        0
      )}% of your net worth, which is ${
        equityConcentration > 0.5 ? "significantly" : "somewhat"
      } higher than the recommended 20-30%. Consider exercising and selling a portion to diversify your investments.`,
      priority: equityConcentration > 0.5 ? "high" : "medium",
    });
  }

  // 2. Cash reserve advice
  const exerciseCost = calculationResults?.totals?.exerciseCost || 0;
  const monthlyBurn = monthlyExpenses || 5000; // Default assumption
  const monthsOfRunway = availableCash / monthlyBurn;

  if (exerciseCost > availableCash * 0.5 && monthsOfRunway < 6) {
    insights.push({
      type: "liquidity",
      title: "Maintain sufficient emergency funds",
      content: `Exercising would use ${(
        (exerciseCost / availableCash) *
        100
      ).toFixed(
        0
      )}% of your available cash, leaving you with only ${monthsOfRunway.toFixed(
        1
      )} months of expenses covered. Consider exercising fewer shares or building more cash reserves first.`,
      priority: "high",
    });
  }

  // 3. Tax optimization advice
  const amtImpact = calculationResults?.amt?.netAMTDue || 0;
  if (amtImpact > 0 && amtImpact > income * 0.1) {
    insights.push({
      type: "tax",
      title: "Consider AMT impact on your tax situation",
      content: `The AMT impact of this exercise ($${amtImpact.toLocaleString()}) represents a significant portion of your annual income. Consider exercising in December and spreading the exercise over multiple tax years to manage AMT exposure.`,
      priority: "high",
    });
  }

  // 4. Retirement integration advice
  const hasRetirementGap = retirementSavings / income < (age / 100) * 10;
  if (hasRetirementGap && calculationResults?.totals?.netProceeds > 50000) {
    insights.push({
      type: "retirement",
      title: "Balance equity with retirement savings",
      content: `Consider directing a portion of any proceeds from a future equity sale toward retirement accounts. Based on your age and income, boosting your retirement savings could provide better long-term tax advantages while diversifying your investments.`,
      priority: "medium",
    });
  }

  // 5. Debt management advice
  const hasHighInterestDebt = debt > 10000; // Simplified assumption
  if (hasHighInterestDebt && calculationResults?.totals?.netProceeds > debt) {
    insights.push({
      type: "debt",
      title: "Consider debt reduction strategy",
      content: `With your potential equity proceeds, you could eliminate your outstanding debt and still have funds remaining for other investments. This would improve your overall financial stability and reduce ongoing interest expenses.`,
      priority: "medium",
    });
  }

  // 6. Risk tolerance assessment
  if (equityConcentration > 0.4 && riskTolerance === "low") {
    insights.push({
      type: "risk",
      title: "Align equity strategy with your risk tolerance",
      content: `Your current equity concentration (${(
        equityConcentration * 100
      ).toFixed(
        0
      )}%) is high compared to your stated risk tolerance. Consider a more conservative approach by exercising and selling a portion of your equity to reduce exposure.`,
      priority: "high",
    });
  }

  // 7. Early exercise advice for ISOs (if applicable)
  const hasISOs =
    Array.isArray(equityData) &&
    equityData.some((grant) => grant.grant_type === "ISO");
  const lowFMVSpread =
    Array.isArray(equityData) &&
    equityData.some(
      (grant) =>
        grant.grant_type === "ISO" &&
        grant.current_fmv - grant.strike_price < grant.strike_price * 0.5
    );

  if (hasISOs && lowFMVSpread && availableCash > exerciseCost * 2) {
    insights.push({
      type: "earlyExercise",
      title: "Consider early exercise for favorable tax treatment",
      content:
        "Some of your ISOs have a relatively low spread between current FMV and strike price. Early exercise could minimize potential AMT impact and start your capital gains holding period sooner.",
      priority: "medium",
    });
  }

  // 8. Grant expiration warnings
  const hasNearExpirationGrants =
    Array.isArray(equityData) &&
    equityData.some((grant) => {
      if (!grant.expiration_date) return false;
      const expirationDate = new Date(grant.expiration_date);
      const today = new Date();
      const monthsUntilExpiration =
        (expirationDate - today) / (1000 * 60 * 60 * 24 * 30); // Rough calculation
      return monthsUntilExpiration < 12; // Less than a year until expiration
    });

  if (hasNearExpirationGrants) {
    insights.push({
      type: "expiration",
      title: "Address grants nearing expiration",
      content:
        "You have one or more grants that will expire within the next 12 months. Create a plan to either exercise these options or let them expire based on their current value.",
      priority: "high",
    });
  }

  // Sort insights by priority
  insights.sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // If we have no insights, provide a default one
  if (insights.length === 0) {
    insights.push({
      type: "general",
      title: "Review your equity strategy regularly",
      content:
        "As your financial situation and equity value changes, regularly reassess your equity strategy to ensure it aligns with your overall financial goals.",
      priority: "medium",
    });
  }

  return {
    insights,
    summary: generateSummary(insights, financialData, equityData),
    recommendedActions: generateActions(insights, financialData, equityData),
  };
}

// Helper function to format currency (used in insights)
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// Helper function to generate a concise summary
function generateSummary(insights, financialData, equityData) {
  if (insights.length === 0) {
    return "Consider your overall financial picture when making equity decisions.";
  }

  // Prioritize the highest priority insight for the summary
  const highPriorityInsight = insights.find(
    (insight) => insight.priority === "high"
  );
  if (highPriorityInsight) {
    return highPriorityInsight.title;
  }

  // Default summary
  return "Balance your equity decisions with your broader financial goals.";
}

// Helper function to generate specific actions
function generateActions(insights, financialData, equityData) {
  const actions = [];

  // Add actions based on insights
  insights.forEach((insight) => {
    switch (insight.type) {
      case "diversification":
        actions.push(
          "Consider selling a portion of vested shares to diversify investments"
        );
        break;
      case "liquidity":
        actions.push("Build up emergency funds before exercising more options");
        break;
      case "tax":
        actions.push(
          "Consult with a tax professional to optimize your exercise strategy"
        );
        actions.push(
          "Consider exercising in December to maximize time for tax planning"
        );
        break;
      case "retirement":
        actions.push(
          "Allocate a portion of equity proceeds to retirement accounts"
        );
        break;
      case "debt":
        actions.push(
          "Consider using some equity proceeds to reduce high-interest debt"
        );
        break;
      case "risk":
        actions.push(
          "Adjust your equity concentration to better match your risk tolerance"
        );
        break;
      case "earlyExercise":
        actions.push(
          "Evaluate early exercise opportunities for ISOs with low current spreads"
        );
        break;
      case "expiration":
        actions.push(
          "Create a plan for options expiring within the next 12 months"
        );
        break;
      default:
        actions.push("Review your equity and financial situation regularly");
    }
  });

  // Add general actions if we don't have many specific ones
  if (actions.length < 2) {
    actions.push("Review your vesting schedule and upcoming events");
    actions.push(
      "Consider consulting with a financial advisor about your equity strategy"
    );
  }

  // Return unique actions (no duplicates)
  return [...new Set(actions)];
}

/**
 * Generate scenario-specific advice based on a planned exit scenario
 * @param {Object} scenario - The exit scenario being evaluated
 * @param {Array} grants - User's equity grants
 * @param {Object} financialData - User's financial situation
 * @returns {Object} - Scenario-specific advice
 */
export function generateScenarioAdvice(scenario, grants, financialData = {}) {
  // Exit type (IPO, acquisition, secondary)
  const exitType = scenario.exit_type || "IPO";

  // Share price multiples
  const currentFMV = grants.length > 0 ? grants[0].current_fmv : 0;
  const exitPrice = scenario.share_price || 0;
  const multiple = currentFMV > 0 ? exitPrice / currentFMV : 0;

  // Tax rate assumptions
  const federalLTCG = 0.2; // Long-term capital gains rate
  const federalSTCG = 0.37; // Short-term capital gains rate
  const stateRate = 0.1; // Simplified state tax rate

  // Risk assessment
  let riskLevel = "moderate";
  if (multiple < 2) riskLevel = "conservative";
  if (multiple > 10) riskLevel = "aggressive";

  const insights = [];

  // 1. Tax optimization insight
  if (exitType === "IPO" || exitType === "Acquisition") {
    insights.push({
      title: "Tax planning is critical",
      content: `With a potential ${formatPercentage(
        multiple
      )}x return, consider holding exercised shares for at least 1 year after IPO to qualify for long-term capital gains treatment, potentially saving up to ${formatPercentage(
        federalSTCG - federalLTCG
      )} in federal taxes.`,
      priority: "high",
    });
  }

  // 2. Risk assessment
  insights.push({
    title: `${capitalizeFirstLetter(riskLevel)} valuation assumptions`,
    content: `This scenario assumes a ${formatPercentage(
      multiple
    )}x increase from current 409A valuation, which is considered ${riskLevel} for this stage. Consider creating additional scenarios with different multiples.`,
    priority: multiple > 15 ? "high" : "medium",
  });

  // 3. Liquidity considerations
  if (exitType === "IPO") {
    insights.push({
      title: "Plan for lockup periods",
      content:
        "Typically, IPOs include a 180-day lockup period during which you cannot sell shares. Ensure you have sufficient liquidity to cover taxes and living expenses during this period.",
      priority: "medium",
    });
  }

  return {
    insights,
    summary: `This ${exitType} scenario at $${exitPrice} per share represents a ${formatPercentage(
      multiple
    )}x return on current valuation.`,
    recommendations: generateScenarioRecommendations(
      scenario,
      riskLevel,
      exitType
    ),
  };
}

/**
 * Generate recommendations for a specific scenario
 */
function generateScenarioRecommendations(scenario, riskLevel, exitType) {
  const recommendations = [];

  // Common recommendations
  recommendations.push(
    "Consider consulting with a financial advisor and tax professional"
  );

  // Exit-type specific recommendations
  if (exitType === "IPO") {
    recommendations.push(
      "Plan for lockup periods and potential post-IPO volatility"
    );
    recommendations.push(
      "Create a systematic selling strategy to diversify after lockup expiration"
    );
  } else if (exitType === "Acquisition") {
    recommendations.push(
      "Review acquisition terms for vesting acceleration provisions"
    );
    recommendations.push(
      "Understand the tax implications of cash vs. stock consideration"
    );
  } else if (exitType === "Secondary") {
    recommendations.push(
      "Consider negotiating for partial rather than full sales to maintain upside"
    );
    recommendations.push(
      "Verify if company approval is required for secondary transactions"
    );
  }

  // Risk-level specific recommendations
  if (riskLevel === "aggressive") {
    recommendations.push(
      "Create additional scenarios with more conservative assumptions"
    );
  } else if (riskLevel === "conservative") {
    recommendations.push(
      "Even with conservative outcomes, review diversification strategy"
    );
  }

  return recommendations;
}

/**
 * Format a value as a percentage
 */
function formatPercentage(value) {
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
