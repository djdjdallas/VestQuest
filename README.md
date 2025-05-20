# VestQuest MVP

This is the initial MVP for VestQuest, a startup equity modeling tool built with Next.js, Supabase, and shadcn/ui.

## Features

- Simple equity calculator
- Equity grant management
- Vesting schedule visualization
- Basic tax calculations
- User authentication

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/`
   - Copy your Supabase URL and anon key to `.env.local`
4. Run the development server: `npm run dev`

## Testing

VestQuest has a comprehensive testing strategy with multiple testing layers:

### Unit Tests

Test individual functions and utilities in isolation:

```bash
npm test                  # Run all tests
npm run test:utils        # Run only utility function tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate test coverage report
```

### Component Tests

Test React components in isolation with React Testing Library:

```bash
npm test                  # Runs all tests including component tests
```

### Integration Tests

Test how multiple components work together:

```bash
npm test                  # Runs all tests including integration tests
```

### End-to-End Tests

Test complete user flows with Cypress:

```bash
npm run cy:open           # Open Cypress test runner
npm run cy:run            # Run Cypress tests in headless mode
npm run test:e2e          # Start dev server and run E2E tests
```

### CI/CD Integration

Tests run automatically on GitHub Actions for:
- Pull requests to main branch
- Pushes to main branch

## Tech Stack

- Next.js 14 (App Router)
- JavaScript
- Supabase (Database & Auth)
- shadcn/ui (UI Components)
- Tailwind CSS
- Recharts (Charts)
- Jest & React Testing Library (Testing)
- Cypress (End-to-End Testing)

## Directory Structure

```
src/
├── app/               # Next.js app router pages
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── calculator/   # Calculator components
│   ├── dashboard/    # Dashboard components
│   └── ui/           # shadcn/ui components
├── lib/              # Utilities and configs
├── utils/            # Helper functions
├── __tests__/        # Test files
│   ├── components/   # Component tests
│   ├── integration/  # Integration tests
│   └── utils/        # Utility function tests
└── mocks/            # Mock data and services for testing
```

## Testing Architecture

1. **Unit Tests**: Focus on core calculation and utility functions
2. **Component Tests**: Test UI components in isolation
3. **Integration Tests**: Test critical user flows
4. **E2E Tests**: Test complete user journeys
5. **Accessibility Tests**: Ensure WCAG compliance
