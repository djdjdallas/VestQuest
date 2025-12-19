"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FEATURES, 
  FEATURE_NAMES, 
  SUBSCRIPTION_TIERS, 
  SUBSCRIPTION_PRICES, 
  TIER_FEATURES 
} from "@/lib/subscriptions/plans";
import { createCheckoutSession } from "@/utils/subscriptionService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

/**
 * UpgradePrompt component that shows a modal with subscription upgrade options
 * @param {Object} props
 * @param {string} props.feature - Feature key from FEATURES object
 * @param {string} props.requiredTier - The minimum tier required for this feature
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {() => void} props.onClose - Function to call when modal is closed
 * @param {boolean} props.isTrial - Whether the user is in a trial
 * @param {boolean} props.isTrialActive - Whether the trial is still active
 * @returns {React.ReactNode}
 */
export function UpgradePrompt({ feature, requiredTier, isOpen, onClose, isTrial, isTrialActive }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [processingTier, setProcessingTier] = useState(null);
  
  // Get feature name for display
  const featureName = FEATURE_NAMES[feature] || "this feature";
  
  // Get all available tiers that provide access to the feature
  const availableTiers = Object.entries(TIER_FEATURES)
    .filter(([tier, features]) => features.includes(feature))
    .map(([tier]) => tier);
  
  // Helper to get formatted price with currency symbol
  const getFormattedPrice = (tier, cycle) => {
    return `$${SUBSCRIPTION_PRICES[tier][cycle].toFixed(2)}`;
  };
  
  // Handle navigation to pricing page
  const handleViewPlans = () => {
    onClose();
    router.push("/pricing");
  };

  // Handle upgrade button click - create checkout session and redirect
  const handleUpgrade = async (tier) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in or create an account to upgrade.",
        variant: "destructive",
      });
      onClose();
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      setIsLoading(true);
      setProcessingTier(tier);
      
      // Create checkout session
      const { url } = await createCheckoutSession(tier, billingCycle, user);
      
      // Redirect to checkout
      router.push(url);
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "Unable to start checkout process. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingTier(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            {featureName} is available in the {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan or higher.
            {isTrialActive && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
                <p className="text-blue-800 font-medium">
                  You're currently in your 14-day free trial period!
                </p>
              </div>
            )}
          </DialogDescription>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs
            defaultValue="monthly"
            value={billingCycle}
            onValueChange={setBillingCycle}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  Save 20%
                </span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6 space-y-4">
              {availableTiers.map((tier) => (
                <div
                  key={tier}
                  className="flex items-center justify-between rounded-lg border p-4 hover:border-primary transition-colors"
                >
                  <div>
                    <h3 className="font-medium capitalize">{tier}</h3>
                    <p className="text-sm text-gray-500">
                      {getFormattedPrice(tier, billingCycle)}{billingCycle === "monthly" ? "/month" : "/year"}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleUpgrade(tier)}
                    disabled={isLoading} 
                    className={tier === requiredTier ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    {isLoading && processingTier === tier ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      isTrialActive 
                        ? `Continue with ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
                        : `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </Tabs>
        </div>
        
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={handleViewPlans} disabled={isLoading}>
            View All Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}