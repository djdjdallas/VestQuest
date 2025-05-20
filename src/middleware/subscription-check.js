import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TIER_FEATURES, SUBSCRIPTION_TIERS } from "@/lib/subscriptions/plans";

/**
 * Server-side middleware to verify subscription status and feature access
 * @param {string} requiredFeature - Feature key to check access for
 * @param {function} handler - The API route handler function to execute if access is granted
 * @returns {function} - A middleware function that performs subscription checks
 */
export function withSubscriptionCheck(requiredFeature, handler) {
  return async (req, { params }) => {
    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    try {
      // Get the current session and user
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, user is not authenticated
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      const userId = session.user.id;
      
      // Skip check if no feature is required
      if (!requiredFeature) {
        return handler(req, { ...params, userId });
      }
      
      // Query the user's active subscription
      const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      // Default to free tier if no subscription or error
      const userTier = subscription?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
      
      // Check if the subscription is expired
      const isExpired = subscription?.expires_at && new Date(subscription.expires_at) < new Date();
      
      // If expired, treat as free tier
      const effectiveTier = isExpired ? SUBSCRIPTION_TIERS.FREE : userTier;
      
      // Check if the user's tier includes the required feature
      const hasFeatureAccess = TIER_FEATURES[effectiveTier]?.includes(requiredFeature);
      
      if (!hasFeatureAccess) {
        // Get the minimum required tier for this feature
        const requiredTier = Object.entries(TIER_FEATURES).find(
          ([_, features]) => features.includes(requiredFeature)
        )?.[0];
        
        return NextResponse.json(
          { 
            error: "Subscription required",
            message: `This feature requires ${requiredTier || "a higher"} subscription`,
            requiredTier,
            currentTier: effectiveTier
          },
          { status: 403 }
        );
      }
      
      // If we got here, the user has access to the feature, so call the handler
      return handler(req, { ...params, userId });
    } catch (error) {
      console.error("Error checking subscription:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to create a middleware that requires a specific subscription tier
 * @param {string} requiredTier - Minimum subscription tier required (e.g., 'basic', 'pro', 'premium')
 * @param {function} handler - The API route handler function to execute if access is granted 
 * @returns {function} - A middleware function that performs subscription checks
 */
export function withSubscriptionTier(requiredTier, handler) {
  return async (req, { params }) => {
    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    try {
      // Get the current session and user
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, user is not authenticated
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      const userId = session.user.id;
      
      // Skip check if no tier is required
      if (!requiredTier) {
        return handler(req, { ...params, userId });
      }
      
      // Query the user's active subscription
      const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      // Default to free tier if no subscription or error
      const userTier = subscription?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
      
      // Check if the subscription is expired
      const isExpired = subscription?.expires_at && new Date(subscription.expires_at) < new Date();
      
      // If expired, treat as free tier
      const effectiveTier = isExpired ? SUBSCRIPTION_TIERS.FREE : userTier;
      
      // Get the tier indexes for comparison
      const tiers = Object.values(SUBSCRIPTION_TIERS);
      const currentTierIndex = tiers.indexOf(effectiveTier);
      const requiredTierIndex = tiers.indexOf(requiredTier);
      
      // Higher index means higher tier
      const hasTierAccess = currentTierIndex >= requiredTierIndex;
      
      if (!hasTierAccess) {
        return NextResponse.json(
          { 
            error: "Subscription required",
            message: `This feature requires ${requiredTier} subscription or higher`,
            requiredTier,
            currentTier: effectiveTier
          },
          { status: 403 }
        );
      }
      
      // If we got here, the user has the required tier, so call the handler
      return handler(req, { ...params, userId });
    } catch (error) {
      console.error("Error checking subscription tier:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}