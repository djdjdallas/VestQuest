"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  ArrowRight, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { createClient } from "@/lib/supabase/client";
import { 
  getManagementPortalUrl, 
  cancelSubscription 
} from "@/utils/subscriptionService";
import { SUBSCRIPTION_PRICES } from "@/lib/subscriptions/plans";

/**
 * Billing management page where users can view and manage their subscription
 */
export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const supabase = createClient();
  
  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/account/billing");
    }
  }, [user, router]);
  
  // Fetch subscription details
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching subscription details:", error);
          return;
        }
        
        setSubscriptionDetails(data);
      } catch (error) {
        console.error("Error in fetchSubscriptionDetails:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptionDetails();
  }, [user, supabase]);
  
  // Get formatted expiry date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDateString) => {
    if (!expiryDateString) return 0;
    
    const expiryDate = new Date(expiryDateString);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!user) return;
    
    if (!window.confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }
    
    try {
      setIsCancelling(true);
      
      await cancelSubscription(user.id);
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled. You'll have access until the end of your billing period.",
      });
      
      // Refresh subscription details
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setSubscriptionDetails(data);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Handle upgrade
  const handleUpgrade = () => {
    router.push("/pricing");
  };
  
  // Handle billing portal access
  const handleBillingPortal = async () => {
    if (!user) return;
    
    try {
      setIsLoadingPortal(true);
      
      const { url } = await getManagementPortalUrl(user.id);
      
      // In a real implementation, this would redirect to Stripe's billing portal
      router.push(url);
    } catch (error) {
      console.error("Error accessing billing portal:", error);
      toast({
        title: "Error",
        description: "Failed to access billing portal. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }
  
  // Get current plan price
  const currentPlanPrice = subscriptionDetails 
    ? SUBSCRIPTION_PRICES[subscriptionDetails.subscription_tier]?.[subscriptionDetails.billing_cycle] || 0
    : 0;
  
  // Check if subscription is active
  const isSubscriptionActive = !!subscriptionDetails;
  
  // Check if subscription is cancelled (i.e., will expire)
  const isSubscriptionCancelled = subscriptionDetails && subscriptionDetails.expires_at;
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
        
        {/* Current Plan Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSubscriptionActive ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                    <p className="text-lg font-medium capitalize">{subscriptionDetails.subscription_tier}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Billing Cycle</h3>
                    <p className="text-lg font-medium capitalize">{subscriptionDetails.billing_cycle}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="text-lg font-medium">
                      ${currentPlanPrice.toFixed(2)}/{subscriptionDetails.billing_cycle === "monthly" ? "month" : "year"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="flex items-center mt-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>
                
                {isSubscriptionCancelled && (
                  <Alert variant="warning" className="bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertTitle>Subscription Cancelled</AlertTitle>
                    <AlertDescription>
                      Your subscription has been cancelled and will expire on{" "}
                      <strong>{formatDate(subscriptionDetails.expires_at)}</strong>{" "}
                      ({getDaysUntilExpiry(subscriptionDetails.expires_at)} days remaining).
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="mb-2">You are currently on the free plan</p>
                <Button onClick={handleUpgrade}>
                  Upgrade Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
          {isSubscriptionActive && (
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleBillingPortal}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Payment Method
                  </>
                )}
              </Button>
              {!isSubscriptionCancelled && (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              )}
              {isSubscriptionCancelled && (
                <Button className="w-full sm:w-auto" onClick={handleUpgrade}>
                  Reactivate Subscription
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
        
        {/* Billing History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your past invoices and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubscriptionActive ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {subscriptionDetails.billing_cycle === "monthly" ? "Monthly" : "Annual"} Subscription
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(subscriptionDetails.starts_at)}
                    </p>
                  </div>
                  <p className="font-medium">${currentPlanPrice.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <Button variant="ghost" onClick={handleBillingPortal} className="text-sm">
                    View all invoices
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No billing history available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}