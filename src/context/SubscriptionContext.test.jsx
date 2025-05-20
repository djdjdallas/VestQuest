import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';
import { AuthProvider } from './AuthContext';
import { FEATURES, SUBSCRIPTION_TIERS } from '@/lib/subscriptions/plans';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                maybeSingle: jest.fn(() => Promise.resolve({
                  data: {
                    subscription_tier: 'premium',
                    billing_cycle: 'monthly',
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    is_active: true
                  },
                  error: null
                }))
              }))
            }))
          }))
        }))
      })),
      channel: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn()
        })),
      })),
      removeChannel: jest.fn()
    }))
  }))
}));

// Mock the AuthContext
jest.mock('./AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' }
  }))
}));

// Test component that uses the subscription hook
function TestComponent() {
  const { subscription, hasFeature, hasAccess } = useSubscription();
  return (
    <div>
      <div data-testid="tier">{subscription.tier}</div>
      <div data-testid="billing-cycle">{subscription.billingCycle}</div>
      <div data-testid="is-active">{subscription.isActive.toString()}</div>
      <div data-testid="has-advanced-tax">{hasFeature(FEATURES.ADVANCED_TAX_TOOLS).toString()}</div>
      <div data-testid="has-pro-access">{hasAccess(SUBSCRIPTION_TIERS.PRO).toString()}</div>
    </div>
  );
}

describe('SubscriptionContext', () => {
  it('should provide subscription data and helper functions', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <TestComponent />
          </SubscriptionProvider>
        </AuthProvider>
      );
    });

    // Tests for subscription data
    expect(screen.getByTestId('tier')).toHaveTextContent('premium');
    expect(screen.getByTestId('billing-cycle')).toHaveTextContent('monthly');
    expect(screen.getByTestId('is-active')).toHaveTextContent('true');
    
    // Tests for helper functions
    expect(screen.getByTestId('has-advanced-tax')).toHaveTextContent('true');
    expect(screen.getByTestId('has-pro-access')).toHaveTextContent('true');
  });
});