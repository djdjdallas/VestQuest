describe('Authentication Flow', () => {
  beforeEach(() => {
    // Visit the home page
    cy.visit('/')
    
    // Clear any existing auth data
    cy.window().then((window) => {
      window.localStorage.removeItem('supabase.auth.token')
    })
  })

  it('redirects unauthenticated users to login page when accessing protected routes', () => {
    // Try to access dashboard directly
    cy.visit('/dashboard')
    
    // Should be redirected to login
    cy.url().should('include', '/login')
    
    // Login form should be visible
    cy.contains('Sign in to your account').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
  })

  it('shows registration form on the register page', () => {
    // Navigate to register page
    cy.visit('/register')
    
    // Check registration form elements
    cy.contains('Create your account').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('input[name="name"]').should('be.visible')
    
    // Find the submit button
    cy.contains('button', 'Create account').should('be.visible')
  })

  it('shows validation errors for invalid form inputs', () => {
    // Go to login page
    cy.visit('/login')
    
    // Try to submit with empty form
    cy.contains('button', 'Sign in').click()
    
    // Should show validation errors
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
    
    // Try invalid email format
    cy.get('input[type="email"]').type('invalid-email')
    cy.contains('button', 'Sign in').click()
    
    // Should show format validation error
    cy.contains('Invalid email address').should('be.visible')
  })

  it('allows access to public calculator without authentication', () => {
    // Navigate to public calculator
    cy.visit('/calculator')
    
    // Calculator should be accessible
    cy.contains('Equity Calculator').should('be.visible')
    cy.get('form').should('be.visible')
    
    // Should be able to use calculator
    cy.get('input[name="shares"]').type('1000')
    cy.get('input[name="strikePrice"]').type('2.50')
    cy.get('input[name="currentFMV"]').type('10.00')
    
    // Calculate button should work
    cy.contains('button', 'Calculate').click()
    
    // Results should appear
    cy.contains('Current Value').should('be.visible')
  })
  
  it('mocks login and accesses protected routes', () => {
    // Visit login page
    cy.visit('/login')
    
    // Mock successful login by setting token directly
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        expires_at: Date.now() + 86400000,
      }))
    })
    
    // Try accessing protected route after "login"
    cy.visit('/dashboard')
    
    // Should now be able to access dashboard
    cy.contains('Dashboard').should('be.visible')
    
    // Check navigation elements
    cy.contains('Analytics').should('be.visible')
    cy.contains('Grants').should('be.visible')
    cy.contains('Calculator').should('be.visible')
  })
})