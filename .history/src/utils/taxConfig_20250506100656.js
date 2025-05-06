// Create src/utils/taxConfig.js

/**
 * Tax configuration by tax year
 * This allows for easy updates when tax laws change
 */
export const taxConfig = {
  2024: {
    federal: {
      brackets: [
        { rate: 0.1, singleThreshold: 11000, jointThreshold: 22000 },
        { rate: 0.12, singleThreshold: 44725, jointThreshold: 89450 },
        { rate: 0.22, singleThreshold: 95375, jointThreshold: 190750 },
        { rate: 0.24, singleThreshold: 182100, jointThreshold: 364200 },
        { rate: 0.32, singleThreshold: 231250, jointThreshold: 462500 },
        { rate: 0.35, singleThreshold: 578125, jointThreshold: 693750 },
        { rate: 0.37, singleThreshold: Infinity, jointThreshold: Infinity },
      ],
      capitalGains: {
        longTerm: [
          { rate: 0.0, singleThreshold: 44625, jointThreshold: 89250 },
          { rate: 0.15, singleThreshold: 492300, jointThreshold: 553850 },
          { rate: 0.2, singleThreshold: Infinity, jointThreshold: Infinity },
        ],
        shortTerm: "ordinary", // Use ordinary income rates
        netInvestmentIncomeTax: 0.038, // 3.8% NIIT threshold
        niitThreshold: { single: 200000, joint: 250000 },
      },
      amt: {
        exemption: { single: 81300, joint: 126500 },
        phaseoutStart: { single: 578150, joint: 1156300 },
        phaseoutRate: 0.25,
        rates: [
          { rate: 0.26, threshold: 220700 },
          { rate: 0.28, threshold: Infinity },
        ],
      },
    },
    states: {
      CA: {
        maxRate: 0.133,
        brackets: [
          // CA tax brackets
        ],
        specialProvisions: {
          techEquity: true, // CA has special rules for tech equity
        },
      },
      // Add other states
    },
  },
  // Previous tax years...
  2023: {
    // 2023 tax configuration
  },
};

/**
 * Get tax configuration for a specific year
 * @param {number} year - Tax year
 * @returns {Object} Tax configuration for the specified year
 */
export function getTaxConfig(year) {
  return (
    taxConfig[year] || taxConfig[Object.keys(taxConfig).sort().reverse()[0]]
  );
}
