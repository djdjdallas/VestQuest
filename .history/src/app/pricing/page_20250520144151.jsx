"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, XIcon, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("yearly");

  // Feature lists for each plan
  const basicFeatures = [
    { name: "Real-time equity grant tracking", included: true },
    { name: "Basic vesting schedule visualization", included: true },
    { name: "Essential tax calculators", included: true },
    { name: "Standard educational resources", included: true },
    { name: "Email support", included: true },
    { name: "Advanced tax optimization tools", included: false },
    { name: "Scenario planning", included: false },
    { name: "Multiple grant management", included: false },
    { name: "Personalized recommendations", included: false },
  ];

  const proFeatures = [
    { name: "Real-time equity grant tracking", included: true },
    { name: "Basic vesting schedule visualization", included: true },
    { name: "Essential tax calculators", included: true },
    { name: "Standard educational resources", included: true },
    { name: "Email and chat support", included: true },
    { name: "Advanced tax optimization tools", included: true },
    { name: "Basic scenario planning", included: true },
    { name: "Multiple grant management", included: true },
    { name: "Decision support tools", included: true },
    { name: "Personalized recommendations", included: false },
  ];

  const premiumFeatures = [
    { name: "Real-time equity grant tracking", included: true },
    { name: "Advanced vesting schedule visualization", included: true },
    { name: "Comprehensive tax calculators", included: true },
    { name: "Premium educational resources", included: true },
    { name: "Priority email and chat support", included: true },
    { name: "Advanced tax optimization tools", included: true },
    { name: "Comprehensive scenario modeling", included: true },
    { name: "Multiple grant management", included: true },
    { name: "Decision support tools", included: true },
    { name: "Personalized recommendations", included: true },
    { name: "API access for personal finance integrations", included: true },
  ];

  // Pricing data based on billing cycle
  const pricing = {
    basic: {
      monthly: 9.99,
      yearly: 99,
    },
    pro: {
      monthly: 19.99,
      yearly: 199,
    },
    premium: {
      monthly: 39.99,
      yearly: 399,
    },
  };

  // Calculate monthly equivalent for yearly billing
  const getMonthlyEquivalent = (yearlyPrice) => {
    return (yearlyPrice / 12).toFixed(2);
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Choose the plan that's right for your equity management needs. All
            plans include a 14-day free trial.
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          <Tabs
            defaultValue="yearly"
            value={billingCycle}
            onValueChange={setBillingCycle}
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-800"
                >
                  Save 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-12 space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          {/* Basic Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Basic</CardTitle>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight">
                  $
                  {billingCycle === "yearly"
                    ? pricing.basic.yearly
                    : pricing.basic.monthly}
                </span>
                <span className="ml-1 text-xl font-semibold text-gray-500">
                  {billingCycle === "yearly" ? "/year" : "/month"}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-sm text-gray-500 mt-1">
                  ${getMonthlyEquivalent(pricing.basic.yearly)}/mo billed
                  annually
                </p>
              )}
              <CardDescription className="mt-4">
                Essential tools for tracking your equity grants
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {basicFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    ) : (
                      <XIcon className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                    )}
                    <span className={feature.included ? "" : "text-gray-400"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/signup?plan=basic">Start free trial</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-primary relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Badge className="px-3 py-1 bg-primary text-white">Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Pro</CardTitle>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight">
                  $
                  {billingCycle === "yearly"
                    ? pricing.pro.yearly
                    : pricing.pro.monthly}
                </span>
                <span className="ml-1 text-xl font-semibold text-gray-500">
                  {billingCycle === "yearly" ? "/year" : "/month"}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-sm text-gray-500 mt-1">
                  ${getMonthlyEquivalent(pricing.pro.yearly)}/mo billed annually
                </p>
              )}
              <CardDescription className="mt-4">
                Advanced tools for tax optimization and scenario planning
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    ) : (
                      <XIcon className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                    )}
                    <span className={feature.included ? "" : "text-gray-400"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/signup?plan=pro">Start free trial</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Premium</CardTitle>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight">
                  $
                  {billingCycle === "yearly"
                    ? pricing.premium.yearly
                    : pricing.premium.monthly}
                </span>
                <span className="ml-1 text-xl font-semibold text-gray-500">
                  {billingCycle === "yearly" ? "/year" : "/month"}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-sm text-gray-500 mt-1">
                  ${getMonthlyEquivalent(pricing.premium.yearly)}/mo billed
                  annually
                </p>
              )}
              <CardDescription className="mt-4">
                Comprehensive tools with personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    ) : (
                      <XIcon className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                    )}
                    <span className={feature.included ? "" : "text-gray-400"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/signup?plan=premium">Start free trial</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">
                How does the 14-day free trial work?
              </h3>
              <p className="mt-2 text-gray-500">
                You can try VestUp free for 14 days with full access to all
                features in your selected plan. No credit card required to
                start. You'll only be charged after your trial ends if you
                choose to continue.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Can I switch plans later?</h3>
              <p className="mt-2 text-gray-500">
                Yes, you can upgrade or downgrade your plan at any time. If you
                upgrade, the new features will be immediately available. If you
                downgrade, the change will take effect at the start of your next
                billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">
                What payment methods do you accept?
              </h3>
              <p className="mt-2 text-gray-500">
                We accept all major credit cards including Visa, Mastercard, and
                American Express. For annual plans, we can also support
                invoicing for enterprise customers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">
                How secure is my equity information?
              </h3>
              <p className="mt-2 text-gray-500">
                We take security seriously. Your data is encrypted both in
                transit and at rest. We use bank-level security practices and do
                not share your information with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-primary/5 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold">
            Not sure which plan is right for you?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Try our recommended Pro plan with a 14-day free trial. Experience
            the full set of features to optimize your equity decisions.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/signup?plan=pro">
                Get started with Pro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required
            </p>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <blockquote className="text-xl italic text-gray-600 text-center">
            "VestUp helped me optimize my equity decisions during a recent
            acquisition, saving me over $45,000 in taxes. The Pro plan paid for
            itself within minutes."
            <footer className="mt-4 text-sm font-medium text-gray-700">
              — Alex Chen, Senior Engineer at TechCorp
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
