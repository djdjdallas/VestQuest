import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/utils/test-utils'
import { mockGrants } from '@/utils/test-utils'
import { useGrants } from '@/hooks/useGrants'

// Mock components that would be used in a full grant management flow
import SimpleCalculator from '@/components/calculator/SimpleCalculator'

// Mock the useGrants hook
jest.mock('@/hooks/useGrants', () => ({
  useGrants: jest.fn(),
}))

describe('Grant Management Flow', () => {
  beforeEach(() => {
    // Setup the mock implementation of useGrants
    useGrants.mockReturnValue({
      grants: mockGrants,
      isLoading: false,
      error: null,
      addGrant: jest.fn().mockImplementation((grant) => Promise.resolve({ ...grant, id: 'new-grant-id' })),
      updateGrant: jest.fn().mockImplementation((id, grant) => Promise.resolve({ ...grant, id })),
      deleteGrant: jest.fn().mockImplementation((id) => Promise.resolve(true)),
      refreshGrants: jest.fn().mockImplementation(() => Promise.resolve(mockGrants)),
    })
  })

  test('renders calculator with default values', async () => {
    renderWithProviders(<SimpleCalculator />)
    
    // Check for calculator components
    expect(screen.getByText(/equity calculator/i)).toBeInTheDocument()
    
    // Should display form fields for input
    expect(screen.getByLabelText(/shares/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/strike price/i)).toBeInTheDocument()
  })

  test('calculator processes input and shows results', async () => {
    renderWithProviders(<SimpleCalculator />)
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/shares/i), '1000')
    await userEvent.type(screen.getByLabelText(/strike price/i), '2.50')
    await userEvent.type(screen.getByLabelText(/current fmv/i), '10.00')
    
    // Click calculate button
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    fireEvent.click(calculateButton)
    
    // Check for results
    await waitFor(() => {
      // Results should include calculation outputs
      expect(screen.getByText(/current value/i)).toBeInTheDocument()
      expect(screen.getByText(/exercise cost/i)).toBeInTheDocument()
      
      // Specific values from our calculation
      expect(screen.getByText(/\$10,000/)).toBeInTheDocument() // Current value: 1000 * $10
      expect(screen.getByText(/\$2,500/)).toBeInTheDocument() // Exercise cost: 1000 * $2.50
    })
  })

  test('displays error message when calculation fails', async () => {
    renderWithProviders(<SimpleCalculator />)
    
    // Enter invalid data
    await userEvent.type(screen.getByLabelText(/shares/i), 'invalid')
    await userEvent.type(screen.getByLabelText(/strike price/i), '2.50')
    
    // Click calculate button
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    fireEvent.click(calculateButton)
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/must be a number/i)).toBeInTheDocument()
    })
  })
})