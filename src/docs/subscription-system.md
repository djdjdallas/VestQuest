# VestQuest Subscription System

This document explains how the VestQuest subscription system works and how to implement feature gating in your code.

## Table of Contents

1. [Overview](#overview)
2. [Subscription Tiers](#subscription-tiers)
3. [Database Schema](#database-schema)
4. [Client-Side Feature Gating](#client-side-feature-gating)
5. [Server-Side Feature Verification](#server-side-feature-verification)
6. [Handling Upgrades](#handling-upgrades)
7. [Testing](#testing)

## Overview

VestQuest implements a tiered subscription model with three paid tiers (Basic, Pro, and Premium) plus a free tier. Each tier grants access to specific features. The subscription system includes:

- Database schema for storing user subscription data
- Context provider for client-side access to subscription state
- Feature gating components for UI
- Server-side middleware for API route protection
- Upgrade prompt UI for guiding users to upgrade

## Subscription Tiers

The subscription tiers and their features are defined in `src/lib/subscriptions/plans.js`:

- **Free**: Limited access to basic features
- **Basic** ($9.99/month or $99/year): Includes equity tracking, basic vesting visualization, and educational resources
- **Pro** ($19.99/month or $199/year): Everything in Basic plus tax optimization, scenario planning, and multiple grant management
- **Premium** ($39.99/month or $399/year): Everything in Pro plus advanced tax optimization, unlimited scenarios, custom API access, and priority support

## Database Schema

The subscription data is stored in the `user_subscriptions` table with the following schema:

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'basic', 'pro', 'premium')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Client-Side Feature Gating

### Using the Subscription Context

The `SubscriptionContext` provides access to the user's subscription state:

```jsx
import { useSubscription } from "@/context/SubscriptionContext";

function MyComponent() {
  const { 
    subscription, // Contains tier, billingCycle, expiresAt, isActive
    hasFeature,   // Function to check if user has access to a specific feature
    hasAccess,    // Function to check if user has access to a specific tier
    isLoading     // Boolean indicating if subscription data is still loading
  } = useSubscription();
  
  if (hasFeature(FEATURES.ADVANCED_TAX_TOOLS)) {
    // Render premium feature
  }
  
  return (
    <div>
      {subscription.tier === SUBSCRIPTION_TIERS.PREMIUM && (
        <PremiumFeature />
      )}
    </div>
  );
}
```

### Using the FeatureGate Component

The `FeatureGate` component simplifies feature gating in UI components:

```jsx
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { FEATURES } from "@/lib/subscriptions/plans";

function MyComponent() {
  return (
    <div>
      {/* Basic content visible to all users */}
      <h1>Dashboard</h1>
      
      {/* Pro feature with automatic upgrade prompt */}
      <FeatureGate feature={FEATURES.ADVANCED_TAX_TOOLS}>
        <AdvancedTaxCalculator />
      </FeatureGate>
      
      {/* Premium feature with custom fallback */}
      <FeatureGate 
        feature={FEATURES.API_ACCESS}
        fallback={<CustomUpgradeMessage />}
      >
        <ApiIntegrationPanel />
      </FeatureGate>
    </div>
  );
}
```

## Server-Side Feature Verification

### Protecting API Routes

Use the middleware functions in `src/middleware/subscription-check.js` to protect API routes:

```js
import { withSubscriptionCheck } from "@/middleware/subscription-check";
import { FEATURES } from "@/lib/subscriptions/plans";

// This route requires the COMPREHENSIVE_SCENARIOS feature (Premium tier)
async function handler(req, { userId }) {
  // Your API logic here
  // The userId parameter is automatically provided
  
  return NextResponse.json({ success: true });
}

export const GET = withSubscriptionCheck(FEATURES.COMPREHENSIVE_SCENARIOS, handler);
export const POST = withSubscriptionCheck(FEATURES.COMPREHENSIVE_SCENARIOS, handler);
```

### Checking Subscription Tier

Alternatively, you can check for a specific subscription tier:

```js
import { withSubscriptionTier } from "@/middleware/subscription-check";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptions/plans";

// This route requires Pro tier or higher
async function handler(req, { userId }) {
  // Your API logic here
  
  return NextResponse.json({ success: true });
}

export const GET = withSubscriptionTier(SUBSCRIPTION_TIERS.PRO, handler);
```

## Handling Upgrades

### Upgrade Prompt Modal

The `UpgradePrompt` component is automatically used by `FeatureGate` when a user tries to access a feature they don't have access to:

```jsx
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

function MyComponent() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowUpgradeModal(true)}>
        Upgrade to Premium
      </button>
      
      {showUpgradeModal && (
        <UpgradePrompt
          feature={FEATURES.COMPREHENSIVE_SCENARIOS}
          requiredTier={SUBSCRIPTION_TIERS.PREMIUM}
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}
```

## Testing

To test different subscription tiers, you can insert test data directly into the `user_subscriptions` table:

```sql
-- Create a Premium subscription for a test user
INSERT INTO user_subscriptions (
  user_id,
  subscription_tier,
  billing_cycle,
  starts_at,
  expires_at,
  is_active
) VALUES (
  '[TEST_USER_ID]',
  'premium',
  'monthly',
  NOW(),
  NOW() + INTERVAL '30 days',
  true
);
```

For local development and testing, you can temporarily modify the `SubscriptionContext.jsx` file to force a specific subscription tier:

```jsx
// For testing only - force a specific tier
// Comment out in production
setSubscription({
  tier: SUBSCRIPTION_TIERS.PREMIUM,
  billingCycle: 'monthly',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
  isLoading: false,
});
```