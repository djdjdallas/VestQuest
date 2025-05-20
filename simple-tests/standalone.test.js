// Standalone test with no dependencies

function calculateExerciseCost(shares, strikePrice) {
  if (!shares || !strikePrice) return 0;
  
  const numShares = typeof shares === "number" ? shares : parseInt(shares) || 0;
  const numStrikePrice = typeof strikePrice === "number" 
    ? strikePrice 
    : parseFloat(strikePrice) || 0;
  
  return numShares * numStrikePrice;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

describe('Standalone calculation tests', () => {
  test('calculateExerciseCost handles various inputs', () => {
    expect(calculateExerciseCost(100, 2.5)).toBe(250);
    expect(calculateExerciseCost(0, 10)).toBe(0);
    expect(calculateExerciseCost(100, 0)).toBe(0);
    expect(calculateExerciseCost('200', '1.5')).toBe(300);
  });
  
  test('formatCurrency formats properly', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(0)).toBe('$0');
  });
});