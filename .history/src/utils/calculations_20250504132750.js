export function calculateVestedShares(grant, asOfDate = new Date()) {
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = new Date(grant.vesting_cliff_date);
  
  if (asOfDate < cliffDate) return 0;
  if (asOfDate >= vestingEnd) return grant.shares;
  
  const totalVestingMonths = (vestingEnd.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const vestedMonths = (asOfDate.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  return Math.floor((vestedMonths / totalVestingMonths) * grant.shares);
}

export function calculateExerciseCost(shares, strikePrice) {
  return shares * strikePrice;
}

export function calculateGrossProceeds(shares, exitPrice) {
  return shares * exitPrice;
}

export function calculateTaxes(grant, exercisePrice, exitPrice, shares) {
  // Simplified tax calculation - in production, this would be much more complex
  const gain = (exitPrice - exercisePrice) * shares;
  const isLongTerm = true; // Simplified - would check holding period
  
  const federalRate = isLongTerm ? 0.20 : 0.37; // Simplified rates
  const stateRate = 0.13; // California rate as example
  
  const federal_tax = gain * federalRate;
  const state_tax = gain * stateRate;
  const amt_liability = 0; // Simplified - would calculate AMT
  const total_tax = federal_tax + state_tax;
  const effective_tax_rate = total_tax / gain;
  
  return {
    federal_tax,
    state_tax,
    amt_liability,
    total_tax,
    effective_tax_rate
  };
}

export function calculateScenarioResult(grant, exitPrice, sharesToExercise, scenarioName) {
  const exercise_cost = calculateExerciseCost(sharesToExercise, grant.strike_price);
  const gross_proceeds = calculateGrossProceeds(sharesToExercise, exitPrice);
  const tax_calculation = calculateTaxes(grant, grant.strike_price, exitPrice, sharesToExercise);
  const net_proceeds = gross_proceeds - exercise_cost - tax_calculation.total_tax;
  const roi_percentage = (net_proceeds / exercise_cost) * 100;
  
  return {
    scenario_name: scenarioName,
    exit_value: exitPrice,
    shares_exercised: sharesToExercise,
    exercise_cost,
    gross_proceeds,
    tax_liability: tax_calculation.total_tax,
    net_proceeds,
    roi_percentage
  };
}
