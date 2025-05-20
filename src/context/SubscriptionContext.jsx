"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";
import { 
  SUBSCRIPTION_TIERS, 
  TIER_FEATURES,
  FEATURES
} from "@/lib/subscriptions/plans";

// Create context
const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: SUBSCRIPTION_TIERS.BASIC,
    billingCycle: null,
    expiresAt: null,
    isActive: false,
    isTrial: true,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
    isTrialActive: true,
    isLoading: true,
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(prev => ({
          ...prev,
          tier: SUBSCRIPTION_TIERS.BASIC,
          isTrial: true,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
          isTrialActive: true,
          isLoading: false,
        }));
        return;
      }

      try {
        // Check if the table exists first
        const { error: tableError } = await supabase
          .from("user_subscriptions")
          .select("count")
          .limit(1);

        // If the table doesn't exist yet, default to BASIC tier with trial
        if (tableError && tableError.code === "42P01") { // PostgreSQL error code for undefined_table
          console.log("Table 'user_subscriptions' does not exist yet. Using basic tier with trial.");
          setSubscription(prev => ({
            ...prev,
            tier: SUBSCRIPTION_TIERS.BASIC,
            isTrial: true,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
            isTrialActive: true,
            isLoading: false,
          }));
          return;
        }

        // Get the user's subscription
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no records found

        if (error && error.code !== "PGRST116") { // PGRST116 is the error when no rows returned
          console.error("Error fetching subscription:", error);
          setSubscription(prev => ({
            ...prev,
            tier: SUBSCRIPTION_TIERS.BASIC,
            isTrial: true,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
            isTrialActive: true,
            isLoading: false,
          }));
          return;
        }

        if (data) {
          // Check if subscription is expired
          const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
          const isTrial = data.is_trial || false;
          const trialEndsAt = data.trial_ends_at || null;
          const isTrialExpired = trialEndsAt && new Date(trialEndsAt) < new Date();
          
          setSubscription({
            tier: data.subscription_tier,
            billingCycle: data.billing_cycle,
            expiresAt: data.expires_at,
            isActive: !isExpired && data.is_active,
            isTrial,
            trialEndsAt,
            isTrialActive: isTrial && !isTrialExpired,
            isLoading: false,
          });
        } else {
          // Create a new trial subscription for the user (will be saved on first checkout)
          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days trial
          
          setSubscription(prev => ({
            ...prev,
            tier: SUBSCRIPTION_TIERS.BASIC,
            isTrial: true,
            trialEndsAt,
            isTrialActive: true,
            isLoading: false,
          }));
        }
      } catch (err) {
        console.error("Error in subscription fetch:", err);
        setSubscription(prev => ({
          ...prev,
          tier: SUBSCRIPTION_TIERS.BASIC,
          isTrial: true,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
          isTrialActive: true,
          isLoading: false,
        }));
      }
    };

    fetchSubscription();
    
    // Set up subscription to subscription changes
    let subscriptionChannel;
    if (user) {
      try {
        subscriptionChannel = supabase
          .channel('subscription_updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_subscriptions',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchSubscription();
            }
          )
          .subscribe();
      } catch (error) {
        console.log("Channel subscription error:", error);
        // The channel fails if the table doesn't exist - not critical
      }
    }

    return () => {
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
    };
  }, [user, supabase]);

  // FOR TESTING ONLY - Uncomment this line to test a specific tier
  // Especially useful if database tables aren't set up yet
  /*
  useEffect(() => {
    // Set a fake Premium subscription for testing
    setSubscription({
      tier: SUBSCRIPTION_TIERS.PREMIUM,
      billingCycle: 'monthly',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      isLoading: false,
    });
  }, []);
  */

  // Functions to check if a user has access to a specific feature
  const hasFeature = (featureKey) => {
    const userTier = subscription.tier;
    return TIER_FEATURES[userTier]?.includes(featureKey) || false;
  };

  // Check if user has access based on their subscription tier
  const hasAccess = (requiredTier) => {
    const tiers = Object.values(SUBSCRIPTION_TIERS);
    const currentTierIndex = tiers.indexOf(subscription.tier);
    const requiredTierIndex = tiers.indexOf(requiredTier);
    
    // Higher index means higher tier
    return currentTierIndex >= requiredTierIndex;
  };

  // Get the minimum tier required for a feature
  const getRequiredTierForFeature = (featureKey) => {
    for (const [tier, features] of Object.entries(TIER_FEATURES)) {
      if (features.includes(featureKey)) {
        return tier;
      }
    }
    return null;
  };

  // Context value
  const value = {
    subscription,
    hasFeature,
    hasAccess,
    getRequiredTierForFeature,
    isLoading: subscription.isLoading,
    isTrial: subscription.isTrial,
    isTrialActive: subscription.isTrialActive,
    trialEndsAt: subscription.trialEndsAt,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

// Custom hook to use subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === null) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};