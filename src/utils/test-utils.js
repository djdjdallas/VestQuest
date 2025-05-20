import { render } from '@testing-library/react'
import { AuthProvider } from '@/context/AuthContext'
import { EducationProvider } from '@/context/EducationContext'

// Custom render function to wrap components in necessary providers
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <AuthProvider>
      <EducationProvider>
        {children}
      </EducationProvider>
    </AuthProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// Create mock grant data for testing
export const mockGrants = [
  {
    id: 'grant-1',
    grant_type: 'ISO',
    shares: 1000,
    strike_price: 2.5,
    current_fmv: 10,
    grant_date: '2023-01-01',
    vesting_start_date: '2023-01-01',
    vesting_end_date: '2027-01-01',
    vesting_cliff_date: '2024-01-01',
    vested_shares: 250,
  },
  {
    id: 'grant-2',
    grant_type: 'RSU',
    shares: 500,
    current_fmv: 10,
    grant_date: '2023-03-15',
    vesting_start_date: '2023-03-15',
    vesting_end_date: '2027-03-15',
    vested_shares: 125,
  },
]

// Create mock scenario data for testing
export const mockScenarios = [
  {
    id: 'scenario-1',
    scenario_name: 'Early Exit',
    exit_value: 15,
    shares_exercised: 500,
    exercise_cost: 1250,
    gross_proceeds: 7500,
    tax_liability: 1875,
    net_proceeds: 4375,
    roi_percentage: 250,
  },
  {
    id: 'scenario-2',
    scenario_name: 'IPO Exit',
    exit_value: 25,
    shares_exercised: 750,
    exercise_cost: 1875,
    gross_proceeds: 18750,
    tax_liability: 5062.5,
    net_proceeds: 11812.5,
    roi_percentage: 530,
  },
]

// Mock financial profile data
export const mockFinancialProfile = {
  income: 150000,
  filingStatus: 'single',
  stateOfResidence: 'California',
  availableCash: 50000,
  otherLiquidAssets: 25000,
  monthlyExpenses: 5000,
  riskTolerance: 'medium',
}