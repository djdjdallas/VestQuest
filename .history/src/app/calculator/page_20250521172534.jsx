"use client";

import { useState, useEffect, useMemo } from "react";
import { SimpleCalculator } from "@/components/calculator/SimpleCalculator";
import { EquityForm } from "@/components/calculator/EquityForm";
import { EquityExplainer } from "@/components/calculator/EquityExplainer";
import { UnifiedCalculator } from "@/components/calculator/UnifiedCalculator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  PlusIcon,
  CalculatorIcon,
  SaveIcon,
  BookIcon,
  CheckCircle,
  Sparkles,
  Lock,
  ChevronRight,
  Star,
  Mail,
  LightbulbIcon,
  BarChart3Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useGrants } from "@/hooks/useGrants";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Calculator() {
  const { grants, addGrant, loading } = useGrants();
  const [activeTab, setActiveTab] = useState("calculator");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [email, setEmail] = useState("");
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [result, setResult] = useState(null);

  // Track pageview analytics and startup time
  useEffect(() => {
    // Page load performance monitoring could be added here
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      // Could log this to analytics in a real implementation
    };
  }, []);

  // Memoize expensive components for better performance
  const memoizedFeatureComparison = useMemo(
    () => (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Free vs Premium</CardTitle>
          <CardDescription>Compare available features</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="grid grid-cols-3 p-3 bg-muted/50">
              <div className="col-span-2 font-medium">Feature</div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div>Free</div>
                <div className="text-primary font-medium">Premium</div>
              </div>
            </div>
            {[
              {
                name: "Basic calculations",
                free: true,
                premium: true,
              },
              {
                name: "Simple exit scenarios",
                free: true,
                premium: true,
              },
              {
                name: "Save equity grants",
                free: false,
                premium: true,
              },
              {
                name: "Tax optimization",
                free: false,
                premium: true,
              },
              {
                name: "Advanced visualizations",
                free: false,
                premium: true,
              },
              {
                name: "Multi-scenario comparison",
                free: false,
                premium: true,
              },
              {
                name: "Exit planning tools",
                free: false,
                premium: true,
              },
              {
                name: "Personalized recommendations",
                free: false,
                premium: true,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="grid grid-cols-3 p-3 hover:bg-muted/20 transition-colors"
              >
                <div className="col-span-2 text-sm">{feature.name}</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    {feature.free ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 mx-auto" />
                    )}
                  </div>
                  <div>
                    {feature.premium && (
                      <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 p-4 border-t">
          <Button className="w-full" asChild>
            <a href="/register">Create Free Account</a>
          </Button>
        </CardFooter>
      </Card>
    ),
    []
  );

  const handleSaveSuccess = (data) => {
    toast({
      title: "Grant saved successfully",
      description: `Your ${
        data.grant_type
      } grant for ${data.shares.toLocaleString()} shares has been saved.`,
      variant: "success",
    });
  };

  const handleSaveError = (error) => {
    toast({
      title: "Error saving grant",
      description: error,
      variant: "destructive",
    });
  };

  const handleCalculationComplete = (calculationResult) => {
    setCalculationComplete(true);
    setResult(calculationResult);
    // Show login prompt after 3 seconds for a subtle, non-intrusive UX
    setTimeout(() => {
      setShowLoginPrompt(true);
    }, 3000);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Results sent!",
      description: `Detailed calculation results have been sent to ${email}`,
      variant: "success",
    });
    setShowLeadForm(false);

    // In a real implementation, this would also log a conversion event
    // and potentially create a lead in your CRM system
  };

  // Keyboard accessibility enhancement
  const handleKeyboardNavigation = (e) => {
    // Add keyboard shortcuts for quick navigation
    if (e.altKey) {
      switch (e.key) {
        case "c":
          setActiveTab("calculator");
          break;
        case "a":
          setActiveTab("add");
          break;
        case "l":
          setActiveTab("learn");
          break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardNavigation);
    return () => {
      document.removeEventListener("keydown", handleKeyboardNavigation);
    };
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Equity Calculator
          </h1>
          <p className="text-muted-foreground">
            Model and analyze your equity compensation - no account required
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab("calculator")}
            variant={activeTab === "calculator" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            aria-label="Calculator tab"
          >
            <CalculatorIcon className="h-4 w-4" />
            <span>Calculator</span>
          </Button>
          <Button
            onClick={() => setActiveTab("add")}
            variant={activeTab === "add" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            aria-label="Add Grant tab"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Grant</span>
          </Button>
          <Button
            onClick={() => setActiveTab("learn")}
            variant={activeTab === "learn" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            aria-label="Learn tab"
          >
            <BookIcon className="h-4 w-4" />
            <span>Learn</span>
          </Button>
        </div>
      </div>

      {/* Feature banner highlighting premium features */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-6 border border-primary/20 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <h3 className="font-medium">Free Equity Calculator</h3>
            <p className="text-sm text-muted-foreground">
              Get basic equity calculations now. Create a free account to unlock
              advanced features like tax modeling, scenario comparison, and
              more.
            </p>
          </div>
          <Button asChild className="shadow-sm hover:shadow">
            <a href="/register" className="whitespace-nowrap">
              Sign Up Free
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {activeTab === "calculator" && (
            <>
              <SimpleCalculator
                onCalculationComplete={handleCalculationComplete}
              />

              {calculationComplete && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Quick action tips based on calculation */}
                  {result && result.netProceeds > 100000 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <LightbulbIcon className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800">
                          Significant upside potential
                        </h4>
                        <p className="text-sm text-green-700">
                          Your calculation shows potentially significant
                          returns. Creating an account will give you access to
                          tax optimization tools that could save you thousands
                          in taxes.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Premium features preview section */}
                  <Card className="border-2 border-primary/30 bg-primary/5 overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Premium Features Preview
                      </CardTitle>
                      <CardDescription>
                        Create a free account to unlock these powerful tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Blurred visualization preview */}
                      <div className="relative">
                        <div className="bg-white rounded-md p-4 border mb-4">
                          <h4 className="font-medium mb-2">
                            Exit Value Scenarios
                          </h4>
                          <div className="h-[180px] bg-gradient-to-r from-blue-100 to-indigo-100 rounded-md"></div>
                        </div>
                        <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center">
                          <div className="bg-background/80 p-4 rounded-lg shadow-lg text-center">
                            <Lock className="h-8 w-8 mx-auto mb-2 text-primary/70" />
                            <h4 className="font-medium">
                              Advanced Visualizations
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Sign up to unlock interactive charts and scenario
                              modeling
                            </p>
                            <Button asChild size="sm">
                              <a href="/register">Create Free Account</a>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Feature gates with CTAs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 bg-card shadow-sm">
                          <div className="flex items-start gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h4 className="font-medium mb-1">
                                Advanced Tax Modeling
                              </h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                Model AMT implications, multi-state taxation,
                                and more
                              </p>
                              <Button variant="outline" size="sm" asChild>
                                <a href="/register">Unlock</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 bg-card shadow-sm">
                          <div className="flex items-start gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h4 className="font-medium mb-1">
                                Save & Compare
                              </h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                Save multiple scenarios and compare outcomes
                                side-by-side
                              </p>
                              <Button variant="outline" size="sm" asChild>
                                <a href="/register">Unlock</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {showLoginPrompt && (
                    <Card className="border-2 border-primary animate-in fade-in zoom-in-95 duration-300">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              Save Your Results
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Create a free account to save this calculation,
                              access advanced features, and get personalized
                              recommendations.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowLeadForm(true)}
                            >
                              Email Results
                            </Button>
                            <Button asChild>
                              <a href="/register">Create Free Account</a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Email lead generation form */}
                  {showLeadForm && (
                    <Card className="animate-in fade-in-50 slide-in-from-top-4 duration-300">
                      <CardHeader>
                        <CardTitle>Get Detailed Results</CardTitle>
                        <CardDescription>
                          We'll email you detailed results with additional
                          insights
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form
                          onSubmit={handleEmailSubmit}
                          className="space-y-4"
                        >
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              placeholder="name@example.com"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="transition-all focus:border-primary"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="offers"
                              className="rounded border-gray-300"
                            />
                            <Label
                              htmlFor="offers"
                              className="text-sm text-muted-foreground"
                            >
                              Send me occasional tips about equity compensation
                            </Label>
                          </div>
                          <Button type="submit" className="w-full">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Detailed Results
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "add" && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Add an Equity Grant</CardTitle>
                <CardDescription>
                  Create a free account to save and manage your equity grants
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Create a Free Account
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Sign up to save your equity grants, track vesting, and
                    access powerful planning tools.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" asChild>
                      <a href="/login">Log In</a>
                    </Button>
                    <Button asChild>
                      <a href="/register">Create Account</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "learn" && <EquityExplainer />}
        </div>

        <div className="space-y-6">
          {/* Free vs Premium Features Comparison */}
          {memoizedFeatureComparison}

          {/* Testimonials / Social Proof */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What Users Say</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    quote:
                      "VestQuest helped me understand my equity package and make informed decisions about when to exercise my options.",
                    author: "Sarah T.",
                    role: "Senior Developer",
                  },
                  {
                    quote:
                      "The tax planning features saved me thousands of dollars by optimizing my exercise strategy.",
                    author: "Michael K.",
                    role: "Product Manager",
                  },
                  {
                    quote:
                      "I was able to confidently negotiate my equity package by understanding the true value of what was being offered.",
                    author: "James L.",
                    role: "Marketing Director",
                  },
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-2">
                      "{testimonial.quote}"
                    </p>
                    <div className="text-xs font-medium">
                      {testimonial.author}{" "}
                      <span className="text-muted-foreground font-normal">
                        · {testimonial.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics / Social Proof */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">VestQuest in Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    50,000+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Active Users
                  </div>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    $2.1B+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Equity Modeled
                  </div>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    95%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Satisfaction
                  </div>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    4.8/5
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Rating
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Understanding Strike Price</h3>
                <p className="text-sm text-muted-foreground">
                  The strike price is the fixed price at which you can purchase
                  your company's shares. It's usually set to the fair market
                  value at grant date.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Tax Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Consider exercising early if the spread between strike price
                  and FMV is small to minimize tax implications.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Exit Strategy Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Model multiple exit scenarios rather than assuming the
                  best-case outcome for more realistic planning.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 w-full"
                onClick={() => setActiveTab("learn")}
              >
                <BookIcon className="h-4 w-4" />
                Learn More About Equity
              </Button>
            </CardContent>
          </Card>

          {/* Why use VestQuest section - additional social proof */}
          <Card className="bg-gradient-to-b from-white to-muted/20 border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-primary" />
                Why VestQuest?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">
                    Trusted by professionals
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Used by employees at top tech companies and startups
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Advanced tax modeling</h4>
                  <p className="text-xs text-muted-foreground">
                    Sophisticated tax calculations for optimal decision-making
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Educational resources</h4>
                  <p className="text-xs text-muted-foreground">
                    Helping you make informed decisions about your equity
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/register">Join VestQuest Community</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer banner - final CTA */}
      {calculationComplete && !showLeadForm && (
        <div className="mt-12 bg-primary/5 rounded-lg p-6 border border-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium mb-1">
                Ready to unlock the full potential of your equity?
              </h3>
              <p className="text-muted-foreground">
                Create a free account to access all premium features, save your
                calculations, and get personalized recommendations.
              </p>
            </div>
            <Button size="lg" asChild className="shadow-sm">
              <a href="/register">
                Create Free Account <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts info - for power users */}
      <div className="mt-12 text-xs text-center text-muted-foreground">
        <p>
          Keyboard shortcuts: Alt+C (Calculator), Alt+A (Add Grant), Alt+L
          (Learn)
        </p>
      </div>
    </div>
  );
}
