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
  financialData,
  calculationResults
) {
  const insights = [];

  // Get user's financial profile
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
  const totalEquityValue = calculateTotalEquityValue(equityData);
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
      content: `The AMT impact of this exercise (${formatCurrency(
        amtImpact
      )}) represents a significant portion of your annual income. Consider exercising in December and spreading the exercise over multiple tax years to manage AMT exposure.`,
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

  // Sort insights by priority
  insights.sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return {
    insights,
    summary: generateSummary(insights, financialData, equityData),
    recommendedActions: generateActions(insights, financialData, equityData),
  };
}

// Helper function to generate a concise summary
function generateSummary(insights, financialData, equityData) {
  // Implementation logic here
}

// Helper function to generate specific actions
function generateActions(insights, financialData, equityData) {
  // Implementation logic here
}
