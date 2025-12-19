"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CreditCard, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SUBSCRIPTION_PRICES } from "@/lib/subscriptions/plans";
import { handleCheckoutSuccess } from "@/utils/subscriptionService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/**
 * Mock checkout page for testing subscription flows
 * In production, this would be replaced by Stripe Checkout
 */
export default function MockCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const tier = searchParams.get("tier") || "basic";
  const cycle = searchParams.get("cycle") || "monthly";

  const [isLoading, setIsLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [isCompleted, setIsCompleted] = useState(false);

  // Get price from tier and cycle
  const price = SUBSCRIPTION_PRICES[tier]?.[cycle] || 0;

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase.",
      });
      router.push(`/login?redirect=/checkout/mock?tier=${tier}&cycle=${cycle}`);
    }
  }, [user, router, tier, cycle, toast]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Generate a mock session ID for testing
      const mockSessionId = `mock_session_${tier}_${cycle}_${Date.now()}`;

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Process the subscription in our database
      await handleCheckoutSuccess(mockSessionId);

      // Show success state
      setIsCompleted(true);

      // Show success toast
      toast({
        title: "Subscription activated!",
        description: `Your ${tier} plan has been successfully activated.`,
      });

      // After a delay, redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (error) {
      toast({
        title: "Checkout failed",
        description:
          "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    return (
      value
        .replace(/\s/g, "")
        .match(/.{1,4}/g)
        ?.join(" ")
        .substr(0, 19) || ""
    );
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value) => {
    value = value.replace(/\D/g, "");
    if (value.length > 2) {
      return `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    return value;
  };

  // If completed, show success screen
  if (isCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 px-4">
          <Card className="border-green-100">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your {tier} subscription has been activated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <span className="text-sm capitalize">{tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Billing</span>
                  <span className="text-sm capitalize">{cycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount</span>
                  <span className="text-sm">${price.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <a href="/dashboard">
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete your order</h1>
          <p className="text-sm text-gray-500">
            You're subscribing to the{" "}
            {tier.charAt(0).toUpperCase() + tier.slice(1)} plan ({cycle})
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="font-medium capitalize">{tier} Plan</span>
                <span>${price.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-500 capitalize">
                Billed {cycle}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label
                    htmlFor="credit-card"
                    className="flex flex-1 cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>Credit Card</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="h-6 w-10 rounded bg-gray-200"></div>
                      <div className="h-6 w-10 rounded bg-gray-200"></div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "credit-card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name on card</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card number</Label>
                    <Input
                      id="card-number"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry date</Label>
                      <Input
                        id="expiry"
                        value={expiryDate}
                        onChange={(e) =>
                          setExpiryDate(formatExpiryDate(e.target.value))
                        }
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, "").substr(0, 3))
                        }
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${price.toFixed(2)}`
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>This is a mock checkout page for testing purposes.</p>
          <p>
            In production, this would be replaced by a secure payment processor.
          </p>
        </div>
      </div>
    </div>
  );
}
