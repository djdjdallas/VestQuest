// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock the fetch API
import 'jest-fetch-mock'

// Temporarily disable MSW while we fix it
// import { server } from './src/mocks/server'

beforeAll(() => {
  // Enable API mocking before tests
  // server.listen()
})

afterEach(() => {
  // Reset handlers between tests
  // server.resetHandlers()
})

afterAll(() => {
  // Clean up after tests
  // server.close()
})

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(cb => cb({ data: [], error: null })),
    }),
  },
}))