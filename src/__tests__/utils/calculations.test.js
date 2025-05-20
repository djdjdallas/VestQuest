import {
  calculateVestedShares,
  calculateExerciseCost,
  calculateScenarioResult,
  calculateCurrentValue,
  calculateVestingPercentage,
  calculateReturnPercentage,
} from '../../utils/calculations'

describe('calculateVestedShares', () => {
  const baseGrant = {
    shares: 1000,
    vesting_start_date: '2023-01-01',
    vesting_end_date: '2027-01-01',
    vesting_cliff_date: '2024-01-01',
  }

  test('returns 0 if grant is null', () => {
    expect(calculateVestedShares(null)).toBe(0)
  })

  test('returns vested_shares if already calculated', () => {
    const grant = { ...baseGrant, vested_shares: 250 }
    expect(calculateVestedShares(grant)).toBe(250)
  })

  test('returns 0 if before vesting start date', () => {
    const asOfDate = new Date('2022-12-31')
    expect(calculateVestedShares(baseGrant, asOfDate)).toBe(0)
  })

  test('returns 0 if before cliff date', () => {
    const asOfDate = new Date('2023-06-01') // After start but before cliff
    expect(calculateVestedShares(baseGrant, asOfDate)).toBe(0)
  })

  test('returns cliff amount after cliff date', () => {
    const asOfDate = new Date('2024-01-02') // Just after cliff
    expect(calculateVestedShares(baseGrant, asOfDate)).toBe(250) // 25% of 1000
  })

  test('returns total shares if after vesting end date', () => {
    const asOfDate = new Date('2027-01-02') // After vesting end
    expect(calculateVestedShares(baseGrant, asOfDate)).toBe(1000)
  })

  test('calculates partial vesting between cliff and end date', () => {
    // 50% through the vesting period after cliff
    const asOfDate = new Date('2025-07-01')
    const result = calculateVestedShares(baseGrant, asOfDate)
    
    // Should be around 625 shares (25% cliff + ~37.5% of remaining 75%)
    expect(result).toBeGreaterThan(600)
    expect(result).toBeLessThan(650)
  })
})

describe('calculateExerciseCost', () => {
  test('returns 0 if shares or strikePrice is falsy', () => {
    expect(calculateExerciseCost(0, 10)).toBe(0)
    expect(calculateExerciseCost(100, 0)).toBe(0)
    expect(calculateExerciseCost(null, 10)).toBe(0)
    expect(calculateExerciseCost(100, null)).toBe(0)
  })

  test('calculates exercise cost correctly', () => {
    expect(calculateExerciseCost(100, 2.5)).toBe(250)
    expect(calculateExerciseCost('200', '1.5')).toBe(300) // String inputs
  })
})

describe('calculateScenarioResult', () => {
  const grant = {
    grant_type: 'ISO',
    strike_price: 2.5,
    current_fmv: 10,
  }

  test('handles invalid inputs', () => {
    const result = calculateScenarioResult(null, 0, 0, 'Test')
    expect(result.scenario_name).toBe('Test')
    expect(result.exit_value).toBe(0)
    expect(result.shares_exercised).toBe(0)
    expect(result.exercise_cost).toBe(0)
    expect(result.gross_proceeds).toBe(0)
    expect(result.net_proceeds).toBe(0)
  })

  test('calculates ISO scenario correctly', () => {
    const result = calculateScenarioResult(grant, 15, 500, 'ISO Test')
    
    expect(result.scenario_name).toBe('ISO Test')
    expect(result.exit_value).toBe(15)
    expect(result.shares_exercised).toBe(500)
    expect(result.exercise_cost).toBe(1250) // 500 * 2.5
    expect(result.gross_proceeds).toBe(7500) // 500 * 15
    
    // Tax calculation will vary, so just make sure it's not negative
    expect(result.tax_liability).toBeGreaterThanOrEqual(0)
    expect(result.net_proceeds).toBe(result.gross_proceeds - result.exercise_cost - result.tax_liability)
  })

  test('calculates NSO scenario correctly', () => {
    const nsoGrant = { ...grant, grant_type: 'NSO' }
    const result = calculateScenarioResult(nsoGrant, 15, 500, 'NSO Test')
    
    expect(result.exercise_cost).toBe(1250)
    expect(result.gross_proceeds).toBe(7500)
    
    // NSO tax is typically higher than ISO tax
    expect(result.tax_liability).toBeGreaterThan(0)
  })

  test('calculates RSU scenario correctly', () => {
    const rsuGrant = { ...grant, grant_type: 'RSU' }
    const result = calculateScenarioResult(rsuGrant, 15, 500, 'RSU Test')
    
    // RSUs don't have an exercise cost
    expect(result.exercise_cost).toBe(1250) // Still calculates it but not applicable
    expect(result.gross_proceeds).toBe(7500)
    
    // RSU tax is calculated on the full value
    expect(result.tax_liability).toBeGreaterThan(0)
  })
})

describe('calculateCurrentValue', () => {
  test('handles valid inputs', () => {
    expect(calculateCurrentValue(100, 10)).toBe(1000)
    expect(calculateCurrentValue('200', '15')).toBe(3000) // String inputs
  })

  test('handles invalid inputs', () => {
    expect(calculateCurrentValue(null, 10)).toBe(0)
    expect(calculateCurrentValue(100, null)).toBe(0)
    expect(calculateCurrentValue('invalid', 10)).toBe(0)
    expect(calculateCurrentValue(100, 'invalid')).toBe(0)
  })
})

describe('calculateVestingPercentage', () => {
  test('calculates percentage correctly', () => {
    expect(calculateVestingPercentage(250, 1000)).toBe(25)
    expect(calculateVestingPercentage(750, 1000)).toBe(75)
  })

  test('handles division by zero', () => {
    expect(calculateVestingPercentage(100, 0)).toBe(100) // Should use 1 as denominator
  })

  test('handles invalid inputs', () => {
    expect(calculateVestingPercentage(null, 1000)).toBe(0)
    expect(calculateVestingPercentage('invalid', 1000)).toBe(0)
  })
})

describe('calculateReturnPercentage', () => {
  test('calculates positive return percentage', () => {
    expect(calculateReturnPercentage(10, 5)).toBe(100) // 100% return
    expect(calculateReturnPercentage(15, 5)).toBe(200) // 200% return
  })

  test('calculates negative return percentage', () => {
    expect(calculateReturnPercentage(3, 5)).toBe(-40) // -40% return
  })

  test('handles division by zero', () => {
    expect(calculateReturnPercentage(10, 0)).toBe(1000) // Should use 1 as denominator
  })

  test('handles invalid inputs', () => {
    expect(calculateReturnPercentage(null, 5)).toBe(0)
    expect(calculateReturnPercentage('invalid', 5)).toBe(0)
  })
})