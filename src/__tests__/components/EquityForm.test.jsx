import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EquityForm from '@/components/calculator/EquityForm'
import { renderWithProviders } from '@/utils/test-utils'

// Mock the form submission handler
const mockOnSubmit = jest.fn()

describe('EquityForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  test('renders all form fields', () => {
    renderWithProviders(<EquityForm onSubmit={mockOnSubmit} />)
    
    // Check for essential form fields
    expect(screen.getByLabelText(/grant type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/shares/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/strike price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/current fmv/i)).toBeInTheDocument()
    
    // Check for buttons
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    renderWithProviders(<EquityForm onSubmit={mockOnSubmit} />)
    
    // Submit the form without filling required fields
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    fireEvent.click(calculateButton)
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/shares is required/i)).toBeInTheDocument()
    })
    
    // Form submission should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('submits form with valid data', async () => {
    renderWithProviders(<EquityForm onSubmit={mockOnSubmit} />)
    
    // Fill out form fields
    await userEvent.selectOptions(screen.getByLabelText(/grant type/i), 'ISO')
    await userEvent.type(screen.getByLabelText(/shares/i), '1000')
    await userEvent.type(screen.getByLabelText(/strike price/i), '2.50')
    await userEvent.type(screen.getByLabelText(/current fmv/i), '10.00')
    
    // Submit the form
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    fireEvent.click(calculateButton)
    
    // Check that form submission was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          grantType: 'ISO',
          shares: '1000',
          strikePrice: '2.50',
          currentFMV: '10.00',
        }),
        expect.anything()
      )
    })
  })

  test('resets form when reset button is clicked', async () => {
    renderWithProviders(<EquityForm onSubmit={mockOnSubmit} />)
    
    // Fill out form fields
    await userEvent.selectOptions(screen.getByLabelText(/grant type/i), 'ISO')
    await userEvent.type(screen.getByLabelText(/shares/i), '1000')
    
    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(resetButton)
    
    // Check that form fields are reset
    await waitFor(() => {
      expect(screen.getByLabelText(/shares/i)).toHaveValue('')
    })
  })
})