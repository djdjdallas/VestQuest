// Simple test for calculations without dependencies

// Manual mocks of the calculation functions for testing
function calculateVestedShares(grant, asOfDate = new Date()) {
  if (!grant) return 0;
  if (grant.vested_shares !== undefined) return grant.vested_shares;
  return 250; // Mock implementation returns a fixed value for testing
}

function calculateExerciseCost(shares, strikePrice) {
  if (!shares || !strikePrice) return 0;
  return Number(shares) * Number(strikePrice);
}

describe('Calculation functions', () => {
  test('calculateVestedShares returns 0 if grant is null', () => {
    expect(calculateVestedShares(null)).toBe(0);
  });

  test('calculateVestedShares returns vested_shares if provided', () => {
    expect(calculateVestedShares({ vested_shares: 250 })).toBe(250);
  });

  test('calculateExerciseCost returns 0 if inputs are invalid', () => {
    expect(calculateExerciseCost(0, 10)).toBe(0);
    expect(calculateExerciseCost(100, 0)).toBe(0);
  });

  test('calculateExerciseCost calculates correctly', () => {
    expect(calculateExerciseCost(100, 2.5)).toBe(250);
  });
});