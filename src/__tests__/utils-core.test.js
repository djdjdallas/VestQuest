import * as calculations from '@/utils/calculations'
import * as taxCalculations from '@/utils/tax-calculations'
import * as formatUtils from '@/utils/format-utils'
import * as enhancedCalculations from '@/utils/enhanced-calculations'
import * as enhancedVestingCalculations from '@/utils/enhanced-vesting-calculations'
import * as exitTaxCalculations from '@/utils/exitTaxCalculations'

// Test that our utility modules are exporting functions properly
describe('Utility functions export check', () => {
  test('calculations.js exports required functions', () => {
    expect(typeof calculations.calculateVestedShares).toBe('function')
    expect(typeof calculations.calculateExerciseCost).toBe('function')
    expect(typeof calculations.calculateScenarioResult).toBe('function')
    expect(typeof calculations.calculateCurrentValue).toBe('function')
    expect(typeof calculations.calculateVestingPercentage).toBe('function')
    expect(typeof calculations.calculateReturnPercentage).toBe('function')
  })

  test('tax-calculations.js exports required functions', () => {
    expect(typeof taxCalculations.calculateOrdinaryIncomeTax).toBe('function')
    expect(typeof taxCalculations.calculateCapitalGainsTax).toBe('function')
    expect(typeof taxCalculations.calculateAMTExemption).toBe('function')
    expect(typeof taxCalculations.calculateAMT).toBe('function')
    expect(typeof taxCalculations.calculateDecisionFactors).toBe('function')
    expect(typeof taxCalculations.formatCurrency).toBe('function')
  })

  // Basic smoke test that tax calculation functions don't throw errors
  test('tax calculation functions handle basic inputs without errors', () => {
    expect(() => taxCalculations.calculateOrdinaryIncomeTax(50000, 100000, 0.35)).not.toThrow()
    expect(() => taxCalculations.calculateCapitalGainsTax(50000, 100000, true)).not.toThrow()
    expect(() => taxCalculations.calculateAMTExemption(100000, 'single')).not.toThrow()
    expect(() => taxCalculations.calculateAMT(50000, 100000, 'single')).not.toThrow()
  })

  // Smoke test for calculation functions
  test('calculation functions handle basic inputs without errors', () => {
    const mockGrant = {
      shares: 1000,
      vesting_start_date: '2023-01-01',
      vesting_end_date: '2027-01-01',
      vesting_cliff_date: '2024-01-01',
      strike_price: 2.5,
      current_fmv: 10,
      grant_type: 'ISO',
    }

    expect(() => calculations.calculateVestedShares(mockGrant, new Date('2025-01-01'))).not.toThrow()
    expect(() => calculations.calculateExerciseCost(500, 2.5)).not.toThrow() 
    expect(() => calculations.calculateScenarioResult(mockGrant, 15, 500, 'Test Scenario')).not.toThrow()
    expect(() => calculations.calculateCurrentValue(1000, 10)).not.toThrow()
    expect(() => calculations.calculateVestingPercentage(250, 1000)).not.toThrow()
    expect(() => calculations.calculateReturnPercentage(10, 2.5)).not.toThrow()
  })
})