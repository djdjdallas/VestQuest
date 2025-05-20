import { checkAccessibility } from '../axe-helper'
import { renderWithProviders } from '@/utils/test-utils'
import SimpleCalculator from '@/components/calculator/SimpleCalculator'
import EnhancedCalculator from '@/components/calculator/EnhancedCalculator'
import LoginForm from '@/components/auth/LoginForm'

// Tests need jest-axe to run properly
// Add to devDependencies: "jest-axe": "^8.0.0"

describe('Accessibility Tests', () => {
  it('SimpleCalculator meets accessibility standards', async () => {
    await checkAccessibility(
      renderWithProviders(<SimpleCalculator />).container
    )
  })

  it('EnhancedCalculator meets accessibility standards', async () => {
    await checkAccessibility(
      renderWithProviders(<EnhancedCalculator />).container
    )
  })

  it('LoginForm meets accessibility standards', async () => {
    await checkAccessibility(
      renderWithProviders(<LoginForm onSubmit={() => {}} />).container
    )
  })
})

// Example of individual component accessibility checks
describe('Component-specific accessibility tests', () => {
  it('form labels are properly associated with inputs', async () => {
    const { getAllByRole } = renderWithProviders(<SimpleCalculator />)
    
    // Get all form elements
    const formElements = getAllByRole('textbox')
    
    // Verify each form element has an associated label
    formElements.forEach(element => {
      expect(element.labels.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('buttons have accessible names', async () => {
    const { getAllByRole } = renderWithProviders(<SimpleCalculator />)
    
    // Get all buttons
    const buttons = getAllByRole('button')
    
    // Verify each button has an accessible name
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
  })

  it('color contrast meets WCAG standards', async () => {
    // This would be tested using jest-axe or a similar tool
    // Note: Automated tools can only catch some contrast issues
    // Manual testing with color contrast analyzers is also recommended
  })
})