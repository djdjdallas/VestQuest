-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('basic', 'pro', 'premium')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_trial BOOLEAN NOT NULL DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for quicker lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Create RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own subscription
CREATE POLICY user_subscriptions_select_policy
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow service role to manage all subscriptions
CREATE POLICY service_manage_subscriptions_policy
  ON user_subscriptions
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to get a user's subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  subscription_tier TEXT;
BEGIN
  SELECT us.subscription_tier INTO subscription_tier
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
  AND us.is_active = TRUE
  AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Return null if no subscription is found (instead of defaulting to 'free')
  RETURN subscription_tier;
END;
$$ LANGUAGE plpgsql;