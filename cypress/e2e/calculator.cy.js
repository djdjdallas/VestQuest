describe('Equity Calculator', () => {
  beforeEach(() => {
    // Visit the calculator page
    cy.visit('/calculator')
    // Mock the authentication state (if needed)
    cy.window().then((window) => {
      // Set session data in local storage to simulate logged-in state
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        expires_at: Date.now() + 86400000, // 24 hours from now
      }))
    })
  })

  it('loads the calculator page successfully', () => {
    // Check page title
    cy.contains('Equity Calculator').should('be.visible')
    
    // Check form elements
    cy.get('form').should('be.visible')
    cy.get('select[name="grantType"]').should('be.visible')
    cy.get('input[name="shares"]').should('be.visible')
    cy.get('input[name="strikePrice"]').should('be.visible')
    cy.get('input[name="currentFMV"]').should('be.visible')
    
    // Check calculate button
    cy.contains('button', 'Calculate').should('be.visible')
  })

  it('performs calculations correctly', () => {
    // Fill in form fields
    cy.get('select[name="grantType"]').select('ISO')
    cy.get('input[name="shares"]').type('1000')
    cy.get('input[name="strikePrice"]').type('2.50')
    cy.get('input[name="currentFMV"]').type('10.00')
    
    // Submit the form
    cy.contains('button', 'Calculate').click()
    
    // Check calculation results appear
    cy.contains('Current Value').should('be.visible')
    cy.contains('$10,000').should('be.visible') // 1000 * $10.00
    cy.contains('Exercise Cost').should('be.visible')
    cy.contains('$2,500').should('be.visible') // 1000 * $2.50
    
    // Check detailed metrics are displayed
    cy.contains('Potential Return').should('be.visible')
  })

  it('validates form inputs', () => {
    // Try to submit with empty fields
    cy.contains('button', 'Calculate').click()
    
    // Check for validation errors
    cy.contains('Shares is required').should('be.visible')
    
    // Try invalid inputs
    cy.get('input[name="shares"]').type('-100')
    cy.get('input[name="strikePrice"]').type('abc')
    
    // Submit the form
    cy.contains('button', 'Calculate').click()
    
    // Check for validation errors
    cy.contains('Shares must be a positive number').should('be.visible')
    cy.contains('Strike Price must be a number').should('be.visible')
  })

  it('resets the form correctly', () => {
    // Fill in form fields
    cy.get('select[name="grantType"]').select('ISO')
    cy.get('input[name="shares"]').type('1000')
    cy.get('input[name="strikePrice"]').type('2.50')
    
    // Click reset button
    cy.contains('button', 'Reset').click()
    
    // Check form fields are reset
    cy.get('select[name="grantType"]').should('have.value', '')
    cy.get('input[name="shares"]').should('have.value', '')
    cy.get('input[name="strikePrice"]').should('have.value', '')
  })
})

describe('Authenticated User Flow', () => {
  beforeEach(() => {
    // Visit the login page
    cy.visit('/login')
    
    // Skip actual authentication - mock user session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        expires_at: Date.now() + 86400000,
      }))
    })
  })

  it('navigates to dashboard after login', () => {
    // After mocking auth, navigate to dashboard
    cy.visit('/dashboard')
    
    // Check dashboard elements
    cy.contains('Dashboard').should('be.visible')
    cy.contains('Equity Overview').should('be.visible')
    
    // Navigate to calculator from dashboard
    cy.contains('Calculator').click()
    cy.url().should('include', '/dashboard/calculator')
    
    // Check calculator loaded within dashboard
    cy.contains('Equity Calculator').should('be.visible')
  })
})