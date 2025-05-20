import {
  calculateOrdinaryIncomeTax,
  calculateCapitalGainsTax,
  calculateAMTExemption,
  calculateAMT,
  calculateDecisionFactors,
  formatCurrency
} from '@/utils/tax-calculations'

describe('calculateOrdinaryIncomeTax', () => {
  test('calculates tax amount correctly', () => {
    expect(calculateOrdinaryIncomeTax(50000, 100000, 0.35)).toBe(17500)
    expect(calculateOrdinaryIncomeTax(0, 100000, 0.35)).toBe(0)
  })
})

describe('calculateCapitalGainsTax', () => {
  test('calculates long-term capital gains tax correctly', () => {
    // Long-term capital gains are taxed at 0%, 15%, or 20% depending on income level
    expect(calculateCapitalGainsTax(10000, 30000, true)).toBe(0) // 0% bracket
    expect(calculateCapitalGainsTax(50000, 150000, true)).toBe(7500) // 15% bracket
    expect(calculateCapitalGainsTax(100000, 400000, true)).toBe(20000) // 20% bracket
  })

  test('calculates short-term capital gains tax correctly', () => {
    // Short-term gains are taxed as ordinary income (simplified in the function as 35%)
    expect(calculateCapitalGainsTax(50000, 100000, false)).toBe(17500)
  })
})

describe('calculateAMTExemption', () => {
  test('calculates exemption for single filer', () => {
    expect(calculateAMTExemption(100000, 'single')).toBe(81300) // Below phaseout threshold
    expect(calculateAMTExemption(600000, 'single')).toBeLessThan(81300) // Phaseout applies
    expect(calculateAMTExemption(1000000, 'single')).toBe(0) // Fully phased out
  })

  test('calculates exemption for married filer', () => {
    expect(calculateAMTExemption(200000, 'married')).toBe(126500) // Below phaseout threshold
    expect(calculateAMTExemption(1200000, 'married')).toBeLessThan(126500) // Phaseout applies
    expect(calculateAMTExemption(2000000, 'married')).toBe(0) // Fully phased out
  })
})

describe('calculateAMT', () => {
  test('calculates AMT when it exceeds regular tax', () => {
    // Create a scenario where AMT exceeds regular tax
    const amtIncome = 500000
    const regularIncome = 100000
    const filingStatus = 'single'
    
    const result = calculateAMT(amtIncome, regularIncome, filingStatus)
    
    // Should be positive (AMT exceeds regular tax)
    expect(result).toBeGreaterThan(0)
  })

  test('returns 0 when regular tax exceeds AMT', () => {
    // Create a scenario where regular tax exceeds AMT
    const amtIncome = 10000
    const regularIncome = 500000
    const filingStatus = 'single'
    
    const result = calculateAMT(amtIncome, regularIncome, filingStatus)
    
    // Should be 0 (regular tax exceeds AMT)
    expect(result).toBe(0)
  })
})

describe('calculateDecisionFactors', () => {
  const baseInputs = {
    strikePrice: 2.5,
    vestedShares: 1000,
    availableCash: 5000,
    currentIncome: 150000,
    companyStage: 'growth',
    growthRate: 30,
    optionType: 'ISO',
    stateOfResidence: 'California',
    timeToExpiration: 5,
  }

  test('calculates financial capacity score', () => {
    const result = calculateDecisionFactors(baseInputs)
    expect(result.financialCapacity).toBeGreaterThanOrEqual(0)
    expect(result.financialCapacity).toBeLessThanOrEqual(1)
  })

  test('calculates company outlook score', () => {
    const result = calculateDecisionFactors(baseInputs)
    expect(result.companyOutlook).toBeGreaterThanOrEqual(0)
    expect(result.companyOutlook).toBeLessThanOrEqual(1)
  })

  test('calculates tax efficiency score', () => {
    const result = calculateDecisionFactors(baseInputs)
    expect(result.taxEfficiency).toBeGreaterThanOrEqual(0)
    expect(result.taxEfficiency).toBeLessThanOrEqual(1)
  })

  test('calculates timing score', () => {
    const result = calculateDecisionFactors(baseInputs)
    expect(result.timing).toBeGreaterThanOrEqual(0)
    expect(result.timing).toBeLessThanOrEqual(1)
  })

  test('adjusts scores based on input factors', () => {
    // Test different company stages
    const earlyStage = calculateDecisionFactors({ ...baseInputs, companyStage: 'early' })
    const lateStage = calculateDecisionFactors({ ...baseInputs, companyStage: 'late' })
    
    // Later stage should have higher outlook score
    expect(lateStage.companyOutlook).toBeGreaterThan(earlyStage.companyOutlook)
    
    // Test different option types
    const isoOption = calculateDecisionFactors({ ...baseInputs, optionType: 'ISO' })
    const nsoOption = calculateDecisionFactors({ ...baseInputs, optionType: 'NSO' })
    
    // ISOs should generally have better tax efficiency
    expect(isoOption.taxEfficiency).toBeGreaterThan(nsoOption.taxEfficiency)
    
    // Test different expiration timelines
    const shortTime = calculateDecisionFactors({ ...baseInputs, timeToExpiration: 0.5 })
    const longTime = calculateDecisionFactors({ ...baseInputs, timeToExpiration: 8 })
    
    // Shorter time to expiration should have higher timing score
    expect(shortTime.timing).toBeGreaterThan(longTime.timing)
  })
})

describe('formatCurrency', () => {
  test('formats currency correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
    expect(formatCurrency(1500.50)).toBe('$1,501') // Round to nearest dollar
    expect(formatCurrency(0)).toBe('$0')
    expect(formatCurrency(-1000)).toBe('-$1,000')
  })
})