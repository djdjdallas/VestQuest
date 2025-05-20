"use client";

import { useState } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { FEATURES, FEATURE_NAMES, SUBSCRIPTION_TIERS } from "@/lib/subscriptions/plans";
import { UpgradePrompt } from "./UpgradePrompt";

/**
 * FeatureGate component restricts access to premium features based on subscription tier
 * @param {Object} props
 * @param {string} props.feature - Feature key from FEATURES object
 * @param {React.ReactNode} props.children - Components to render if user has access
 * @param {React.ReactNode} props.fallback - Optional component to render if user doesn't have access (defaults to upgrade prompt)
 * @returns {React.ReactNode}
 */
export function FeatureGate({ feature, children, fallback }) {
  const { hasFeature, getRequiredTierForFeature, isLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // If the subscription data is still loading, show nothing or a loading state
  if (isLoading) {
    return null; // Or return a loading spinner if preferred
  }
  
  // If user has access to the feature, render the children
  if (hasFeature(feature)) {
    return <>{children}</>;
  }
  
  // If a custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Get the minimum required tier for this feature
  const requiredTier = getRequiredTierForFeature(feature);
  
  // Default fallback is an upgrade button that opens the upgrade modal
  return (
    <>
      <div className="p-4 border rounded-lg bg-gray-50 text-center">
        <h3 className="font-semibold text-lg mb-2">Premium Feature</h3>
        <p className="mb-4 text-gray-600">
          {FEATURE_NAMES[feature] || "This feature"} is available in the{" "}
          {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan or higher.
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Upgrade to Access
        </button>
      </div>
      
      {showUpgradeModal && (
        <UpgradePrompt
          feature={feature}
          requiredTier={requiredTier}
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}