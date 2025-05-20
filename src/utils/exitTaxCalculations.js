// src/utils/exitTaxCalculations.js
import { getTaxConfig } from './taxConfig';
import { calculateComprehensiveTax, calculateAMT, calculateCapitalGainsTax, calculateNIIT } from './enhancedTaxCalculations';

/**
 * Exit strategy tax calculation utility
 * Specialized tax calculations for different exit scenarios: IPO, Acquisition, Secondary Sale
 */

/**
 * Calculate tax impact for IPO exit scenario
 * @param {Object} params - IPO tax calculation parameters 
 * @param {Array} params.grants - Array of equity grants
 * @param {string} params.exerciseStrategy - Strategy for exercising options (early, waitUntilExit, staggered)
 * @param {Object} params.exerciseParams - Exercise strategy parameters
 * @param {Object} params.exitParams - Exit scenario parameters
 * @param {Object} params.taxParams - Tax settings
 * @returns {Object} Comprehensive tax calculation for IPO scenario
 */
export function calculateIPOTaxImpact({ 
  grants, 
  exerciseStrategy,
  exerciseParams = {}, 
  exitParams = {}, 
  taxParams = {}
}) {
  const results = {
    earlyExercise: { totalTax: 0, netProceeds: 0, details: [] },
    exerciseAtExit: { totalTax: 0, netProceeds: 0, details: [] },
    staggeredExercise: { totalTax: 0, netProceeds: 0, details: [] },
    optimal: { strategy: "", taxSavings: 0, netProceeds: 0 },
    lockupConsiderations: {
      earlyExerciseBeforeLockup: { taxRate: 0, taxAmount: 0 },
      exerciseDuringLockup: { taxRate: 0, taxAmount: 0 },
      taxSavings: 0
    }
  };

  // If no grants, return empty results
  if (!grants || grants.length === 0) return results;

  // Set default parameters
  const exitPrice = exitParams.exitPrice || grants[0].current_fmv * 10; // Default to 10x current FMV
  const lockupPeriod = exitParams.lockupPeriod || 180; // Default lockup: 180 days
  const ipoDate = exitParams.ipoDate ? new Date(exitParams.ipoDate) : new Date();
  
  // Calculate lockup end date
  const lockupEndDate = new Date(ipoDate);
  lockupEndDate.setDate(lockupEndDate.getDate() + lockupPeriod);

  // Get user's tax settings
  const baseTaxSettings = {
    filingStatus: taxParams.filingStatus || "single",
    stateOfResidence: taxParams.stateOfResidence || "California",
    otherIncome: taxParams.otherIncome || 150000,
    includeAMT: taxParams.includeAMT !== undefined ? taxParams.includeAMT : true,
    includeNIIT: taxParams.includeNIIT !== undefined ? taxParams.includeNIIT : true,
    stateRate: (taxParams.stateTaxRate || 10) / 100,
  };

  // Process each grant
  grants.forEach(grant => {
    // Skip if not options (ISOs/NSOs)
    if (grant.grant_type !== 'ISO' && grant.grant_type !== 'NSO') return;
    
    const vestedShares = grant.vested_shares || 0;
    if (vestedShares <= 0) return;
    
    // Calculate different exercise strategies
    
    // Strategy 1: Exercise early (before IPO)
    const earlyExerciseDate = new Date();
    earlyExerciseDate.setMonth(earlyExerciseDate.getMonth() - 12); // Assume exercised 12 months ago

    const earlyExerciseSettings = {
      ...baseTaxSettings,
      exerciseDate: earlyExerciseDate,
      saleDate: lockupEndDate, // Sell after lockup ends
    };

    const earlyExerciseResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      vestedShares,
      earlyExerciseSettings
    );

    // Strategy 2: Exercise at IPO
    const ipoExerciseSettings = {
      ...baseTaxSettings,
      exerciseDate: ipoDate,
      saleDate: lockupEndDate,
    };

    const ipoExerciseResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      vestedShares,
      ipoExerciseSettings
    );

    // Strategy 3: Staggered exercise
    // For staggered exercise, we'll simulate exercising in 3 batches
    const staggeredShares = vestedShares;
    const batch1Date = new Date();
    batch1Date.setMonth(batch1Date.getMonth() - 12); // 12 months ago
    const batch2Date = new Date();
    batch2Date.setMonth(batch2Date.getMonth() - 6); // 6 months ago
    const batch3Date = new Date();
    batch3Date.setMonth(batch3Date.getMonth() - 2); // 2 months ago

    const batch1Shares = Math.floor(staggeredShares * 0.3);
    const batch2Shares = Math.floor(staggeredShares * 0.3);
    const batch3Shares = staggeredShares - batch1Shares - batch2Shares;

    const batch1Result = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      batch1Shares,
      { ...baseTaxSettings, exerciseDate: batch1Date, saleDate: lockupEndDate }
    );

    const batch2Result = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      batch2Shares,
      { ...baseTaxSettings, exerciseDate: batch2Date, saleDate: lockupEndDate }
    );

    const batch3Result = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      batch3Shares,
      { ...baseTaxSettings, exerciseDate: batch3Date, saleDate: lockupEndDate }
    );

    const staggeredResult = {
      totals: {
        totalTax: batch1Result.totals.totalTax + batch2Result.totals.totalTax + batch3Result.totals.totalTax,
        netProceeds: batch1Result.totals.netProceeds + batch2Result.totals.netProceeds + batch3Result.totals.netProceeds,
      },
      batches: [
        { date: batch1Date, shares: batch1Shares, result: batch1Result },
        { date: batch2Date, shares: batch2Shares, result: batch2Result },
        { date: batch3Date, shares: batch3Shares, result: batch3Result },
      ]
    };

    // Special tax considerations for IPO lockups
    
    // Early exercise more than 1 year before selling after lockup (long-term capital gains)
    const earlyExerciseLockupSettings = {
      ...baseTaxSettings,
      exerciseDate: earlyExerciseDate,
      saleDate: lockupEndDate, 
    };

    const earlyExerciseLockupTax = calculateCapitalGainsTax(
      0, // No short-term gains
      (exitPrice - grant.current_fmv) * vestedShares, // All long-term gains
      baseTaxSettings.otherIncome,
      new Date().getFullYear(),
      baseTaxSettings.filingStatus
    );

    // Exercise at IPO and sell immediately after lockup (short-term capital gains)
    const exerciseAtIPOLockupTax = calculateCapitalGainsTax(
      (exitPrice - grant.current_fmv) * vestedShares, // All short-term gains
      0, // No long-term gains
      baseTaxSettings.otherIncome,
      new Date().getFullYear(),
      baseTaxSettings.filingStatus
    );

    // Add results to grant array
    results.earlyExercise.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      exitDate: ipoDate.toISOString(),
      saleDate: lockupEndDate.toISOString(),
      result: earlyExerciseResult
    });

    results.exerciseAtExit.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      exerciseDate: ipoDate.toISOString(),
      exitDate: ipoDate.toISOString(),
      saleDate: lockupEndDate.toISOString(),
      result: ipoExerciseResult
    });

    results.staggeredExercise.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      batches: staggeredResult.batches,
      result: staggeredResult
    });

    // Add to totals
    results.earlyExercise.totalTax += earlyExerciseResult.totals.totalTax;
    results.earlyExercise.netProceeds += earlyExerciseResult.totals.netProceeds;
    
    results.exerciseAtExit.totalTax += ipoExerciseResult.totals.totalTax;
    results.exerciseAtExit.netProceeds += ipoExerciseResult.totals.netProceeds;
    
    results.staggeredExercise.totalTax += staggeredResult.totals.totalTax;
    results.staggeredExercise.netProceeds += staggeredResult.totals.netProceeds;

    // Lockup considerations
    results.lockupConsiderations.earlyExerciseBeforeLockup.taxAmount += earlyExerciseLockupTax.totalCapitalGainsTax;
    results.lockupConsiderations.earlyExerciseBeforeLockup.taxRate = earlyExerciseLockupTax.effectiveRate;
    
    results.lockupConsiderations.exerciseDuringLockup.taxAmount += exerciseAtIPOLockupTax.totalCapitalGainsTax;
    results.lockupConsiderations.exerciseDuringLockup.taxRate = exerciseAtIPOLockupTax.effectiveRate;
  });

  // Determine optimal strategy
  const strategies = [
    { name: "earlyExercise", netProceeds: results.earlyExercise.netProceeds },
    { name: "exerciseAtExit", netProceeds: results.exerciseAtExit.netProceeds },
    { name: "staggeredExercise", netProceeds: results.staggeredExercise.netProceeds }
  ];

  strategies.sort((a, b) => b.netProceeds - a.netProceeds);
  
  results.optimal.strategy = strategies[0].name;
  results.optimal.netProceeds = strategies[0].netProceeds;
  results.optimal.taxSavings = strategies[0].netProceeds - strategies[1].netProceeds;

  // Calculate lockup tax savings
  results.lockupConsiderations.taxSavings = 
    results.lockupConsiderations.exerciseDuringLockup.taxAmount - 
    results.lockupConsiderations.earlyExerciseBeforeLockup.taxAmount;

  return results;
}

/**
 * Calculate tax impact for acquisition exit scenario
 * @param {Object} params - Acquisition tax calculation parameters
 * @param {Array} params.grants - Array of equity grants
 * @param {Object} params.exerciseParams - Exercise strategy parameters
 * @param {Object} params.acquisitionParams - Acquisition specific parameters
 * @param {Object} params.taxParams - Tax settings
 * @returns {Object} Comprehensive tax calculation for acquisition scenario
 */
export function calculateAcquisitionTaxImpact({
  grants,
  exerciseParams = {},
  acquisitionParams = {},
  taxParams = {}
}) {
  const results = {
    cashDeal: { totalTax: 0, netProceeds: 0, details: [] },
    stockDeal: { totalTax: 0, netProceeds: 0, details: [] },
    mixedDeal: { totalTax: 0, netProceeds: 0, details: [] },
    optimal: { dealType: "", taxSavings: 0, netProceeds: 0 },
    structuringOptions: {
      section1202Eligible: false,
      qualifyingSmallBusiness: false,
      estimatedSection1202Savings: 0,
      earnoutImplications: {
        immediateVs3Year: {
          immediateTax: 0,
          deferredTax: 0,
          savings: 0
        }
      }
    }
  };

  // If no grants, return empty results
  if (!grants || grants.length === 0) return results;

  // Set default parameters
  const exitPrice = acquisitionParams.exitPrice || grants[0].current_fmv * 10; // Default to 10x current FMV
  const cashPercentage = acquisitionParams.cashPercentage || 100; // Default: 100% cash deal
  const stockPercentage = 100 - cashPercentage;
  const hasEarnout = acquisitionParams.hasEarnout || false;
  const earnoutPercentage = acquisitionParams.earnoutPercentage || 0;
  const acquisitionDate = acquisitionParams.acquisitionDate ? new Date(acquisitionParams.acquisitionDate) : new Date();
  
  // Early exercise date (assuming 1 year before acquisition)
  const earlyExerciseDate = new Date(acquisitionDate);
  earlyExerciseDate.setFullYear(earlyExerciseDate.getFullYear() - 1);

  // Get user's tax settings
  const baseTaxSettings = {
    filingStatus: taxParams.filingStatus || "single",
    stateOfResidence: taxParams.stateOfResidence || "California",
    otherIncome: taxParams.otherIncome || 150000,
    includeAMT: taxParams.includeAMT !== undefined ? taxParams.includeAMT : true,
    includeNIIT: taxParams.includeNIIT !== undefined ? taxParams.includeNIIT : true,
    stateRate: (taxParams.stateTaxRate || 10) / 100,
  };

  // Process each grant
  grants.forEach(grant => {
    const vestedShares = grant.vested_shares || 0;
    if (vestedShares <= 0) return;
    
    // Calculate different deal structures
    
    // 1. Cash Deal
    const cashDealSettings = {
      ...baseTaxSettings,
      exerciseDate: earlyExerciseDate,
      saleDate: acquisitionDate,
      dealType: 'cash'
    };

    const cashDealResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      vestedShares,
      cashDealSettings
    );

    // 2. Stock Deal
    const stockDealSettings = {
      ...baseTaxSettings,
      exerciseDate: earlyExerciseDate,
      saleDate: acquisitionDate,
      dealType: 'stock'
    };

    const stockDealResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      vestedShares,
      stockDealSettings
    );

    // 3. Mixed Deal
    const mixedDealCashShares = Math.floor(vestedShares * (cashPercentage / 100));
    const mixedDealStockShares = vestedShares - mixedDealCashShares;

    const mixedDealCashResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      mixedDealCashShares,
      { ...cashDealSettings, dealType: 'mixed' }
    );

    const mixedDealStockResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      mixedDealStockShares,
      { ...stockDealSettings, dealType: 'mixed' }
    );

    const mixedDealResult = {
      totals: {
        totalTax: mixedDealCashResult.totals.totalTax + mixedDealStockResult.totals.totalTax,
        netProceeds: mixedDealCashResult.totals.netProceeds + mixedDealStockResult.totals.netProceeds,
      },
      components: {
        cash: mixedDealCashResult,
        stock: mixedDealStockResult
      }
    };

    // Calculate Section 1202 eligibility (simplified)
    const companyAge = 5; // Placeholder, would need actual company formation date
    const isQualifyingSmallBusiness = grant.current_fmv * grant.shares < 50000000; // Simplified check
    const section1202Eligible = isQualifyingSmallBusiness && companyAge >= 5; // 5 year holding period
    
    let section1202Savings = 0;
    if (section1202Eligible && stockPercentage > 0) {
      // If eligible, potential exclusion of eligible gain (up to $10M or 10x basis)
      const eligibleGain = Math.min(10000000, 10 * (grant.strike_price * vestedShares));
      const normalTaxAmount = eligibleGain * (taxParams.federalTaxRate || 35) / 100;
      section1202Savings = normalTaxAmount; // Full exclusion for simplification
    }

    // Calculate earnout implications
    let earnoutImplications = {
      immediateVs3Year: { immediateTax: 0, deferredTax: 0, savings: 0 }
    };

    if (hasEarnout && earnoutPercentage > 0) {
      const earnoutAmount = exitPrice * vestedShares * (earnoutPercentage / 100);
      
      // Immediate recognition
      const immediateTax = earnoutAmount * ((taxParams.federalTaxRate || 35) + (taxParams.stateTaxRate || 10)) / 100;
      
      // 3-year deferral (estimated present value with 5% discount rate)
      const discountRate = 0.05;
      const presentValueFactor = 1 / Math.pow(1 + discountRate, 3);
      const deferredTax = immediateTax * presentValueFactor;
      
      earnoutImplications.immediateVs3Year = {
        immediateTax,
        deferredTax,
        savings: immediateTax - deferredTax
      };
    }

    // Add results
    results.cashDeal.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      exitDate: acquisitionDate.toISOString(),
      result: cashDealResult
    });

    results.stockDeal.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      exitDate: acquisitionDate.toISOString(),
      result: stockDealResult
    });

    results.mixedDeal.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      exitDate: acquisitionDate.toISOString(),
      cashPercentage,
      stockPercentage,
      cashShares: mixedDealCashShares,
      stockShares: mixedDealStockShares,
      result: mixedDealResult
    });

    // Add to totals
    results.cashDeal.totalTax += cashDealResult.totals.totalTax;
    results.cashDeal.netProceeds += cashDealResult.totals.netProceeds;
    
    results.stockDeal.totalTax += stockDealResult.totals.totalTax;
    results.stockDeal.netProceeds += stockDealResult.totals.netProceeds;
    
    results.mixedDeal.totalTax += mixedDealResult.totals.totalTax;
    results.mixedDeal.netProceeds += mixedDealResult.totals.netProceeds;

    // Update structuring options
    results.structuringOptions.section1202Eligible = section1202Eligible;
    results.structuringOptions.qualifyingSmallBusiness = isQualifyingSmallBusiness;
    results.structuringOptions.estimatedSection1202Savings += section1202Savings;
    
    if (hasEarnout) {
      results.structuringOptions.earnoutImplications.immediateVs3Year.immediateTax += earnoutImplications.immediateVs3Year.immediateTax;
      results.structuringOptions.earnoutImplications.immediateVs3Year.deferredTax += earnoutImplications.immediateVs3Year.deferredTax;
      results.structuringOptions.earnoutImplications.immediateVs3Year.savings += earnoutImplications.immediateVs3Year.savings;
    }
  });

  // Determine optimal deal structure
  const dealTypes = [
    { name: "cashDeal", netProceeds: results.cashDeal.netProceeds },
    { name: "stockDeal", netProceeds: results.stockDeal.netProceeds },
    { name: "mixedDeal", netProceeds: results.mixedDeal.netProceeds }
  ];

  dealTypes.sort((a, b) => b.netProceeds - a.netProceeds);
  
  results.optimal.dealType = dealTypes[0].name;
  results.optimal.netProceeds = dealTypes[0].netProceeds;
  results.optimal.taxSavings = dealTypes[0].netProceeds - dealTypes[1].netProceeds;

  return results;
}

/**
 * Calculate tax impact for secondary sale exit scenario
 * @param {Object} params - Secondary sale tax calculation parameters
 * @param {Array} params.grants - Array of equity grants
 * @param {Object} params.exerciseParams - Exercise strategy parameters
 * @param {Object} params.secondaryParams - Secondary sale specific parameters
 * @param {Object} params.taxParams - Tax settings
 * @returns {Object} Comprehensive tax calculation for secondary sale scenario
 */
export function calculateSecondaryTaxImpact({
  grants,
  exerciseParams = {},
  secondaryParams = {},
  taxParams = {}
}) {
  const results = {
    sellAll: { totalTax: 0, netProceeds: 0, details: [] },
    sellPartial: { totalTax: 0, netProceeds: 0, details: [] },
    staggeredSales: { totalTax: 0, netProceeds: 0, details: [] },
    optimal: { strategy: "", taxSavings: 0, netProceeds: 0 },
    specialConsiderations: {
      discountImpact: {
        discountPercentage: 0,
        valueLoss: 0
      },
      rightOfFirstRefusal: {
        applicable: false,
        notes: ""
      },
      transferRestrictions: {
        applicable: false,
        notes: ""
      }
    }
  };

  // If no grants, return empty results
  if (!grants || grants.length === 0) return results;

  // Set default parameters
  const secondarySaleDiscount = secondaryParams.discount || 20; // Default 20% discount to primary valuation
  const exitPrice = secondaryParams.exitPrice || 
    (grants[0].current_fmv * (1 - secondarySaleDiscount / 100)); // Apply the discount
  const salePercentage = secondaryParams.salePercentage || 25; // Default sell 25% of vested shares
  const saleDate = secondaryParams.saleDate ? new Date(secondaryParams.saleDate) : new Date();
  const hasROFR = secondaryParams.hasRightOfFirstRefusal !== undefined ? 
    secondaryParams.hasRightOfFirstRefusal : true;
  const hasTransferRestrictions = secondaryParams.hasTransferRestrictions !== undefined ? 
    secondaryParams.hasTransferRestrictions : true;
  
  // Early exercise date (assuming 1 year before secondary)
  const earlyExerciseDate = new Date(saleDate);
  earlyExerciseDate.setFullYear(earlyExerciseDate.getFullYear() - 1);

  // Get user's tax settings
  const baseTaxSettings = {
    filingStatus: taxParams.filingStatus || "single",
    stateOfResidence: taxParams.stateOfResidence || "California",
    otherIncome: taxParams.otherIncome || 150000,
    includeAMT: taxParams.includeAMT !== undefined ? taxParams.includeAMT : true,
    includeNIIT: taxParams.includeNIIT !== undefined ? taxParams.includeNIIT : true,
    stateRate: (taxParams.stateTaxRate || 10) / 100,
  };

  // Track total value impact of the discount
  let totalPrimaryValue = 0;
  let totalSecondaryValue = 0;

  // Process each grant
  grants.forEach(grant => {
    const vestedShares = grant.vested_shares || 0;
    if (vestedShares <= 0) return;
    
    // Calculate different selling strategies
    
    // 1. Sell All Shares
    const sellAllSettings = {
      ...baseTaxSettings,
      exerciseDate: earlyExerciseDate,
      saleDate: saleDate,
    };

    const sellAllResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      vestedShares,
      sellAllSettings
    );

    // 2. Sell Partial Shares
    const partialShares = Math.floor(vestedShares * (salePercentage / 100));
    
    const sellPartialResult = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      exitPrice,
      partialShares,
      sellAllSettings // Same settings, different share count
    );

    // 3. Staggered Sales (multiple batches over time)
    // For staggered sales, we'll simulate selling in 3 batches over a year
    const staggeredTotalShares = vestedShares;
    
    const batch1Date = new Date(saleDate);
    const batch2Date = new Date(saleDate);
    batch2Date.setMonth(batch2Date.getMonth() + 4);
    const batch3Date = new Date(saleDate);
    batch3Date.setMonth(batch3Date.getMonth() + 8);

    const batch1Shares = Math.floor(staggeredTotalShares * 0.4);
    const batch2Shares = Math.floor(staggeredTotalShares * 0.3);
    const batch3Shares = Math.floor(staggeredTotalShares * 0.3);

    // Assume prices might change between batches
    const batch1Price = exitPrice;
    const batch2Price = exitPrice * 1.05; // 5% increase
    const batch3Price = exitPrice * 1.1;  // 10% increase from original

    const batch1Result = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      batch1Price,
      batch1Shares,
      { ...baseTaxSettings, exerciseDate: earlyExerciseDate, saleDate: batch1Date }
    );

    const batch2Result = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      batch2Price,
      batch2Shares,
      { ...baseTaxSettings, exerciseDate: earlyExerciseDate, saleDate: batch2Date }
    );

    const batch3Result = calculateComprehensiveTax(
      grant,
      grant.strike_price,
      batch3Price,
      batch3Shares,
      { ...baseTaxSettings, exerciseDate: earlyExerciseDate, saleDate: batch3Date }
    );

    const staggeredResult = {
      totals: {
        totalTax: batch1Result.totals.totalTax + batch2Result.totals.totalTax + batch3Result.totals.totalTax,
        netProceeds: batch1Result.totals.netProceeds + batch2Result.totals.netProceeds + batch3Result.totals.netProceeds,
      },
      batches: [
        { date: batch1Date, shares: batch1Shares, price: batch1Price, result: batch1Result },
        { date: batch2Date, shares: batch2Shares, price: batch2Price, result: batch2Result },
        { date: batch3Date, shares: batch3Shares, price: batch3Price, result: batch3Result },
      ]
    };

    // Calculate discount impact
    const primaryValuation = grant.current_fmv * vestedShares;
    const secondaryValuation = exitPrice * vestedShares;
    
    totalPrimaryValue += primaryValuation;
    totalSecondaryValue += secondaryValuation;

    // Add results
    results.sellAll.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      shares: vestedShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      saleDate: saleDate.toISOString(),
      result: sellAllResult
    });

    results.sellPartial.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      totalShares: vestedShares,
      sharesToSell: partialShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      saleDate: saleDate.toISOString(),
      result: sellPartialResult
    });

    results.staggeredSales.details.push({
      grantId: grant.id,
      grantType: grant.grant_type,
      totalShares: vestedShares,
      exerciseDate: earlyExerciseDate.toISOString(),
      batches: staggeredResult.batches,
      result: staggeredResult
    });

    // Add to totals
    results.sellAll.totalTax += sellAllResult.totals.totalTax;
    results.sellAll.netProceeds += sellAllResult.totals.netProceeds;
    
    results.sellPartial.totalTax += sellPartialResult.totals.totalTax;
    results.sellPartial.netProceeds += sellPartialResult.totals.netProceeds;
    
    results.staggeredSales.totalTax += staggeredResult.totals.totalTax;
    results.staggeredSales.netProceeds += staggeredResult.totals.netProceeds;
  });

  // Calculate discount impact
  results.specialConsiderations.discountImpact = {
    discountPercentage: secondarySaleDiscount,
    valueLoss: totalPrimaryValue - totalSecondaryValue
  };

  // Add ROFR and transfer restriction considerations
  results.specialConsiderations.rightOfFirstRefusal = {
    applicable: hasROFR,
    notes: hasROFR ? 
      "Company/existing shareholders may have right to match any offer" : 
      "No right of first refusal applies to this transaction"
  };

  results.specialConsiderations.transferRestrictions = {
    applicable: hasTransferRestrictions,
    notes: hasTransferRestrictions ?
      "Shares may have transfer restrictions requiring company approval" :
      "No transfer restrictions apply to this transaction"
  };

  // Determine optimal strategy
  const strategies = [
    { name: "sellAll", netProceeds: results.sellAll.netProceeds },
    { name: "sellPartial", netProceeds: results.sellPartial.netProceeds },
    { name: "staggeredSales", netProceeds: results.staggeredSales.netProceeds }
  ];

  strategies.sort((a, b) => b.netProceeds - a.netProceeds);
  
  results.optimal.strategy = strategies[0].name;
  results.optimal.netProceeds = strategies[0].netProceeds;
  results.optimal.taxSavings = strategies[0].netProceeds - strategies[1].netProceeds;

  return results;
}

/**
 * Analyze different exit strategies (IPO, Acquisition, Secondary) and recommend optimal approach
 * @param {Object} params - Exit analysis parameters
 * @param {Array} params.grants - Array of equity grants
 * @param {Object} params.financialProfile - User's financial profile
 * @param {Object} params.exitParams - Exit scenario parameters
 * @param {Object} params.taxParams - Tax settings
 * @returns {Object} Comprehensive analysis of exit strategies
 */
export function analyzeExitStrategies({
  grants,
  financialProfile = {},
  exitParams = {},
  taxParams = {}
}) {
  const results = {
    ipoAnalysis: null,
    acquisitionAnalysis: null,
    secondaryAnalysis: null,
    recommendedStrategy: {
      exitType: "",
      exerciseStrategy: "",
      netProceeds: 0,
      taxSavings: 0
    },
    multiStateConsiderations: {
      applicable: false,
      savings: 0,
      optimalState: ""
    },
    riskFactors: {
      timing: {
        score: 0,
        notes: ""
      },
      concentration: {
        score: 0,
        notes: ""
      },
      marketConditions: {
        score: 0,
        notes: ""
      }
    }
  };

  // If no grants, return empty results
  if (!grants || grants.length === 0) return results;

  // Calculate multi-state tax impact if applicable
  if (taxParams.isMultiState && taxParams.stateAllocation) {
    // Simplified for example - would need more complex logic in a real implementation
    const stateRates = {
      "California": 0.133,
      "Washington": 0,
      "Texas": 0,
      "New York": 0.107
    };
    
    const stateNames = Object.keys(taxParams.stateAllocation);
    let totalRate = 0;
    let bestState = "";
    let lowestRate = 1; // Start with 100%
    
    stateNames.forEach(state => {
      const allocation = taxParams.stateAllocation[state];
      const rate = stateRates[state] || 0.05;
      totalRate += rate * (allocation / 100);
      
      if (rate < lowestRate) {
        lowestRate = rate;
        bestState = state;
      }
    });
    
    const worstCaseRate = stateRates["California"]; // Typically highest state tax
    const potentialSavings = (worstCaseRate - lowestRate) * calculateTotalEquityValue(grants, exitParams.ipoMultiplier || 10);
    
    results.multiStateConsiderations = {
      applicable: true,
      savings: potentialSavings,
      optimalState: bestState,
      currentBlendedRate: totalRate,
      lowestRate
    };
  }
  
  // Calculate risk factors
  const liquidity = financialProfile.liquidCash || 100000;
  const netWorth = financialProfile.netWorth || 500000;
  const equityValue = calculateTotalEquityValue(grants, exitParams.ipoMultiplier || 10);
  
  // Concentration risk
  const equityToNetWorthRatio = equityValue / netWorth;
  let concentrationScore = 0;
  let concentrationNotes = "";
  
  if (equityToNetWorthRatio > 0.8) {
    concentrationScore = 3; // High risk
    concentrationNotes = "Your equity represents over 80% of your net worth, indicating high concentration risk.";
  } else if (equityToNetWorthRatio > 0.5) {
    concentrationScore = 2; // Medium risk
    concentrationNotes = "Your equity represents over 50% of your net worth, suggesting moderate concentration risk.";
  } else {
    concentrationScore = 1; // Low risk
    concentrationNotes = "Your equity represents less than 50% of your net worth, indicating lower concentration risk.";
  }
  
  // Timing risk (simplified)
  const vestedPercentage = calculateVestedPercentage(grants);
  let timingScore = 0;
  let timingNotes = "";
  
  if (vestedPercentage < 0.5) {
    timingScore = 3; // High risk
    timingNotes = "Less than 50% of your equity is vested, creating significant timing risk for an exit.";
  } else if (vestedPercentage < 0.75) {
    timingScore = 2; // Medium risk
    timingNotes = "Between 50-75% of your equity is vested, presenting moderate timing risk.";
  } else {
    timingScore = 1; // Low risk
    timingNotes = "Over 75% of your equity is vested, minimizing timing risk for an exit.";
  }
  
  // Market conditions (simplified)
  const marketConditions = exitParams.marketConditions || "neutral";
  let marketScore = 0;
  let marketNotes = "";
  
  switch (marketConditions) {
    case "favorable":
      marketScore = 1;
      marketNotes = "Current market conditions are favorable for exits, reducing market risk.";
      break;
    case "neutral":
      marketScore = 2;
      marketNotes = "Current market conditions are neutral, presenting moderate market risk.";
      break;
    case "unfavorable":
      marketScore = 3;
      marketNotes = "Current market conditions are challenging for exits, increasing market risk.";
      break;
  }
  
  // Add risk factors to results
  results.riskFactors = {
    timing: {
      score: timingScore,
      notes: timingNotes
    },
    concentration: {
      score: concentrationScore,
      notes: concentrationNotes
    },
    marketConditions: {
      score: marketScore,
      notes: marketNotes
    },
    overallScore: (timingScore + concentrationScore + marketScore) / 3
  };
  
  // Calculate IPO, Acquisition, and Secondary analyses
  results.ipoAnalysis = calculateIPOTaxImpact({ 
    grants, 
    exitParams: {
      exitPrice: calculateExitPrice(grants[0].current_fmv, exitParams.ipoMultiplier || 10),
      lockupPeriod: exitParams.lockupPeriod || 180,
      ipoDate: exitParams.expectedExitDate
    },
    taxParams
  });
  
  results.acquisitionAnalysis = calculateAcquisitionTaxImpact({
    grants,
    acquisitionParams: {
      exitPrice: calculateExitPrice(grants[0].current_fmv, exitParams.acquisitionMultiplier || 8),
      cashPercentage: exitParams.cashPercentage || 70,
      hasEarnout: exitParams.hasEarnout || false,
      earnoutPercentage: exitParams.earnoutPercentage || 0,
      acquisitionDate: exitParams.expectedExitDate
    },
    taxParams
  });
  
  results.secondaryAnalysis = calculateSecondaryTaxImpact({
    grants,
    secondaryParams: {
      exitPrice: calculateExitPrice(grants[0].current_fmv, exitParams.secondaryMultiplier || 5),
      discount: exitParams.secondaryDiscount || 20,
      salePercentage: exitParams.secondarySalePercentage || 25,
      saleDate: exitParams.expectedExitDate,
      hasRightOfFirstRefusal: exitParams.hasROFR || true,
      hasTransferRestrictions: exitParams.hasTransferRestrictions || true
    },
    taxParams
  });
  
  // Determine recommended strategy
  const ipoProceeds = results.ipoAnalysis.optimal.netProceeds;
  const acquisitionProceeds = results.acquisitionAnalysis.optimal.netProceeds;
  const secondaryProceeds = results.secondaryAnalysis.optimal.netProceeds;
  
  let recommendedExitType = "";
  let recommendedStrategy = "";
  let maxProceeds = 0;
  let taxSavings = 0;
  
  if (ipoProceeds >= acquisitionProceeds && ipoProceeds >= secondaryProceeds) {
    recommendedExitType = "IPO";
    recommendedStrategy = results.ipoAnalysis.optimal.strategy;
    maxProceeds = ipoProceeds;
    taxSavings = results.ipoAnalysis.optimal.taxSavings;
  } else if (acquisitionProceeds >= ipoProceeds && acquisitionProceeds >= secondaryProceeds) {
    recommendedExitType = "Acquisition";
    recommendedStrategy = results.acquisitionAnalysis.optimal.dealType;
    maxProceeds = acquisitionProceeds;
    taxSavings = results.acquisitionAnalysis.optimal.taxSavings;
  } else {
    recommendedExitType = "Secondary";
    recommendedStrategy = results.secondaryAnalysis.optimal.strategy;
    maxProceeds = secondaryProceeds;
    taxSavings = results.secondaryAnalysis.optimal.taxSavings;
  }
  
  results.recommendedStrategy = {
    exitType: recommendedExitType,
    exerciseStrategy: recommendedStrategy,
    netProceeds: maxProceeds,
    taxSavings: taxSavings
  };
  
  return results;
}

/**
 * Helper function to calculate total equity value
 * @param {Array} grants - Array of equity grants
 * @param {number} multiplier - Value multiplier
 * @returns {number} Total equity value
 */
function calculateTotalEquityValue(grants, multiplier = 1) {
  if (!grants || grants.length === 0) return 0;
  
  return grants.reduce((sum, grant) => {
    const totalShares = grant.shares || 0;
    return sum + (totalShares * grant.current_fmv * multiplier);
  }, 0);
}

/**
 * Helper function to calculate exit price
 * @param {number} currentFMV - Current FMV
 * @param {number} multiplier - Exit multiplier
 * @returns {number} Exit price per share
 */
function calculateExitPrice(currentFMV, multiplier) {
  return currentFMV * multiplier;
}

/**
 * Helper function to calculate percentage of vested equity
 * @param {Array} grants - Array of equity grants
 * @returns {number} Percentage of vested equity (0-1)
 */
function calculateVestedPercentage(grants) {
  if (!grants || grants.length === 0) return 0;
  
  let totalShares = 0;
  let vestedShares = 0;
  
  grants.forEach(grant => {
    totalShares += grant.shares || 0;
    vestedShares += grant.vested_shares || 0;
  });
  
  return totalShares > 0 ? vestedShares / totalShares : 0;
}