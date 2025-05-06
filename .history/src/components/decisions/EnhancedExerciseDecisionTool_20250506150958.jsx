"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TaxVisualization } from "@/components/tax/TaxVisualization";
import {
  BarChart,
  LineChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  DollarSign,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";

// Define the form schema with more comprehensive factors
const formSchema = z.object({
  // Financial situation
  availableCash: z.number().min(0, "Must be a positive number"),
  otherLiquidAssets: z.number().min(0, "Must be a positive number"),
  currentDebt: z.number().min(0, "Must be a positive number"),
  monthlyExpenses: z.number().min(0, "Must be a positive number"),
  riskTolerance: z.enum(["very_low", "low", "medium", "high", "very_high"]),

  // Company outlook
  companyStage: z.enum([
    "seed",
    "early",
    "growth",
    "late",
    "pre_ipo",
    "public",
  ]),
  growthRate: z.number().min(-100).max(1000),
  financingHistory: z.enum(["strong", "moderate", "weak", "unknown"]),
  competitivePosition: z.enum([
    "leader",
    "strong",
    "average",
    "weak",
    "unknown",
  ]),
  exitTimeline: z.enum([
    "imminent",
    "1-2_years",
    "3-5_years",
    "5+_years",
    "unknown",
  ]),

  // Tax considerations
  currentIncome: z.number().min(0, "Must be a positive number"),
  filingStatus: z.enum([
    "single",
    "married_joint",
    "married_separate",
    "head_household",
  ]),
  stateOfResidence: z.string().min(1, "Required"),
  internationalTaxation: z.boolean().default(false),
  useAMTCalculation: z.boolean().default(true),

  // Options specifics
  strikePrice: z.number().min(0, "Must be a positive number"),
  currentFMV: z.number().min(0, "Must be a positive number"),
  optionType: z.enum(["iso", "nso", "rsu"]),
  vestedShares: z.number().min(0, "Must be a positive number"),
  timeToExpiration: z.number().min(0, "Must be a positive number"),
  earlierExerciseWindow: z.boolean().default(false),
});

export function EnhancedExerciseDecisionTool({ grant }) {
  const [step, setStep] = useState(1);
  const [recommendation, setRecommendation] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Pre-fill from grant data if available
  const defaultValues = {
    availableCash: 50000,
    otherLiquidAssets: 100000,
    currentDebt: 10000,
    monthlyExpenses: 5000,
    riskTolerance: "medium",

    companyStage: grant?.company_stage || "growth",
    growthRate: 30,
    financingHistory: "moderate",
    competitivePosition: "strong",
    exitTimeline: "3-5_years",

    currentIncome: 150000,
    filingStatus: "single",
    stateOfResidence: "California",
    internationalTaxation: false,
    useAMTCalculation: true,

    strikePrice: grant?.strike_price || 1,
    currentFMV: grant?.current_fmv || 10,
    optionType: grant?.grant_type?.toLowerCase() || "iso",
    vestedShares: grant?.vested_shares || 1000,
    timeToExpiration: grant?.expiration_years || 10,
    earlierExerciseWindow: false,
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Watch form values for real-time calculations
  const watchValues = form.watch();

  // Calculate exercise cost and tax implications
  const getExerciseCost = (strikePrice, shares) => {
    return strikePrice * shares;
  };

  // Generate recommendation
  const generateRecommendation = (data) => {
    // Calculate various scores based on user input
    const financialCapacityScore = calculateFinancialCapacityScore(data);
    const companyOutlookScore = calculateCompanyOutlookScore(data);
    const taxEfficiencyScore = calculateTaxEfficiencyScore(data);
    const timingScore = calculateTimingScore(data);

    // Calculate overall recommendation score (weighted)
    const totalScore =
      financialCapacityScore * 0.35 +
      companyOutlookScore * 0.3 +
      taxEfficiencyScore * 0.25 +
      timingScore * 0.1;

    // Calculate AMT exposure for ISOs
    const amtExposure = calculateAMTExposure(data);

    // Calculate exercise cost
    const exerciseCost = getExerciseCost(data.strikePrice, data.vestedShares);

    // Calculate spread (potential AMT amount for ISOs or ordinary income for NSOs)
    const spread = (data.currentFMV - data.strikePrice) * data.vestedShares;

    // Create simulated tax data for visualization
    const simulatedTaxData = generateSimulatedTaxData(
      data,
      spread,
      exerciseCost
    );
    setTaxData(simulatedTaxData);

    // Generate recommendation based on total score
    let recommendedAction;
    let reasoning = [];
    let riskLevel;

    if (totalScore >= 0.75) {
      recommendedAction = "Exercise all vested options now";
      reasoning = [
        "Strong financial capacity to handle exercise costs and tax implications",
        "Positive company outlook with good growth indicators",
        "Favorable tax situation with manageable AMT exposure",
        "Timing considerations align well with exercise now",
      ];
      riskLevel = "low";
    } else if (totalScore >= 0.6) {
      recommendedAction = "Exercise a portion of vested options now (50-75%)";
      reasoning = [
        "Good financial capacity, but consider maintaining some liquidity",
        "Positive company outlook with some uncertainty",
        "Generally favorable tax situation with some considerations",
        "Timing is appropriate for partial exercise strategy",
      ];
      riskLevel = "medium-low";
    } else if (totalScore >= 0.45) {
      recommendedAction = "Exercise a smaller portion of options now (25-50%)";
      reasoning = [
        "Moderate financial capacity - exercise would impact liquidity",
        "Mixed company outlook with moderate growth potential",
        "Some tax inefficiencies or AMT exposure concerns",
        "Consider staging exercises over time",
      ];
      riskLevel = "medium";
    } else if (totalScore >= 0.3) {
      recommendedAction = "Consider minimal exercise (10-25%) or wait";
      reasoning = [
        "Limited financial capacity for exercise costs",
        "Uncertain company outlook or competitive position",
        "Significant tax inefficiencies or AMT concerns",
        "Timing factors suggest waiting may be advantageous",
      ];
      riskLevel = "medium-high";
    } else {
      recommendedAction = "Wait to exercise options";
      reasoning = [
        "Insufficient financial capacity to handle exercise costs safely",
        "Company outlook shows significant uncertainty or concerns",
        "High tax inefficiency or prohibitive AMT exposure",
        "Timing considerations favor waiting for better conditions",
      ];
      riskLevel = "high";
    }

    // Format timeframe recommendation
    const timeframeRecommendation = getTimeframeRecommendation(
      data,
      totalScore
    );

    // Set the recommendation
    setRecommendation({
      action: recommendedAction,
      reasoning: reasoning,
      riskLevel: riskLevel,
      timeframe: timeframeRecommendation,
      scores: {
        financialCapacity: financialCapacityScore,
        companyOutlook: companyOutlookScore,
        taxEfficiency: taxEfficiencyScore,
        timing: timingScore,
        total: totalScore,
      },
      details: {
        exerciseCost: exerciseCost,
        amtExposure: amtExposure,
        spread: spread,
        alternativeApproaches: generateAlternativeApproaches(data, totalScore),
      },
    });
  };

  // Form submission handler
  const onSubmit = (data) => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      generateRecommendation(data);
      setStep(5);
    }
  };

  // Helper function to display risk levels with appropriate colors
  const getRiskBadge = (level) => {
    switch (level) {
      case "low":
        return <Badge className="bg-green-500">Low Risk</Badge>;
      case "medium-low":
        return <Badge className="bg-green-700">Medium-Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case "medium-high":
        return <Badge className="bg-orange-500">Medium-High Risk</Badge>;
      case "high":
        return <Badge className="bg-red-500">High Risk</Badge>;
      default:
        return <Badge>Unknown Risk</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Exercise Decision Analyzer</CardTitle>
        <CardDescription>
          Get a personalized recommendation based on your financial situation,
          company outlook, and tax considerations
        </CardDescription>
        {step < 5 && (
          <div className="mt-2">
            <Progress value={(step / 4) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Step {step} of 4
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {step < 5 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    Your Financial Situation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This helps us assess your capacity to handle exercise costs
                    and potential tax implications.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="availableCash"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Cash ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Cash you can readily access for exercise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherLiquidAssets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Liquid Assets ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Assets that can be quickly converted to cash
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentDebt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Debt ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Total outstanding debt obligations
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Expenses ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Your typical monthly expenses
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Tolerance</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-5 gap-4"
                          >
                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="very_low"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-4 w-full h-full flex flex-col items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span className="font-medium">Very Low</span>
                                <span className="text-xs text-muted-foreground">
                                  Very conservative
                                </span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="low"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-4 w-full h-full flex flex-col items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span className="font-medium">Low</span>
                                <span className="text-xs text-muted-foreground">
                                  Prefer safety
                                </span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="medium"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-4 w-full h-full flex flex-col items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span className="font-medium">Medium</span>
                                <span className="text-xs text-muted-foreground">
                                  Balanced approach
                                </span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="high"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-4 w-full h-full flex flex-col items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span className="font-medium">High</span>
                                <span className="text-xs text-muted-foreground">
                                  Growth-focused
                                </span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="very_high"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-4 w-full h-full flex flex-col items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span className="font-medium">Very High</span>
                                <span className="text-xs text-muted-foreground">
                                  Aggressive investor
                                </span>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Your comfort level with financial risk and volatility
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Company Outlook
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Assess the company's growth potential and likelihood of a
                    successful exit.
                  </p>

                  <FormField
                    control={form.control}
                    name="companyStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Stage</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 lg:grid-cols-6 gap-2"
                          >
                            <FormItem className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <RadioGroupItem
                                  value="seed"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-2 w-full flex items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span>Seed</span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <RadioGroupItem
                                  value="early"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-2 w-full flex items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span>Early Stage</span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <RadioGroupItem
                                  value="growth"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-2 w-full flex items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span>Growth</span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <RadioGroupItem
                                  value="late"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-2 w-full flex items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span>Late Stage</span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <RadioGroupItem
                                  value="pre_ipo"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-2 w-full flex items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span>Pre-IPO</span>
                              </div>
                            </FormItem>

                            <FormItem className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <RadioGroupItem
                                  value="public"
                                  className="sr-only peer"
                                />
                              </FormControl>
                              <div className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 border-2 rounded-md p-2 w-full flex items-center justify-center hover:bg-muted/50 cursor-pointer">
                                <span>Public</span>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Current stage of the company's development
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="growthRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Estimated Annual Growth Rate ({field.value}%)
                        </FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={-20}
                            max={100}
                            step={5}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-4"
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Declining (-20%)</span>
                          <span>No Growth (0%)</span>
                          <span>High Growth (100%+)</span>
                        </div>
                        <FormDescription>
                          Estimated year-over-year growth rate of the company
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="financingHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financing History</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="strong" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Strong (Recent funding at higher valuations)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="moderate" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Moderate (Stable funding rounds)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="weak" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Weak (Down rounds or difficult fundraising)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="unknown" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Unknown / I'm not sure
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exitTimeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Exit Timeline</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="imminent" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Imminent (within 12 months)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="1-2_years" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  1-2 years
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="3-5_years" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  3-5 years
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="5+_years" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  5+ years
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="unknown" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Unknown / I'm not sure
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Tax Considerations
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Understanding your tax situation helps optimize the exercise
                    decision.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Annual Income ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Your total annual income from all sources
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filingStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Filing Status</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="single" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Single
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="married_joint" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Married Filing Jointly
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="married_separate" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Married Filing Separately
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="head_household" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Head of Household
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="stateOfResidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State of Residence</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Your primary state of residence for tax purposes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="internationalTaxation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              International Tax Considerations
                            </FormLabel>
                            <FormDescription>
                              Enable if you're subject to tax in multiple
                              countries
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="useAMTCalculation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Include AMT Calculations (for ISOs)
                            </FormLabel>
                            <FormDescription>
                              Alternative Minimum Tax applies to ISO exercises
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAdvancedOptions(!showAdvancedOptions)
                      }
                    >
                      {showAdvancedOptions ? "Hide" : "Show"} Advanced Tax
                      Options
                    </Button>

                    {showAdvancedOptions && (
                      <div className="mt-4 p-4 border rounded-md bg-muted/50 space-y-4">
                        <p className="text-sm font-medium">
                          Advanced Tax Options
                        </p>
                        <p className="text-xs text-muted-foreground">
                          These are placeholder fields for advanced tax options
                          like multi-state allocation, previous AMT credits,
                          83(b) election consideration, etc.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-primary" />
                    Options Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Specifics about your equity grant help calculate accurate
                    recommendations.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="optionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equity Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="iso" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  ISO (Incentive Stock Options)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="nso" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  NSO (Non-qualified Stock Options)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="rsu" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  RSU (Restricted Stock Units)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="vestedShares"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vested Shares</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Number of shares that have already vested
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeToExpiration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years Until Expiration</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Time remaining before options expire
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strikePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strike Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Price at which you can exercise your options
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentFMV"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Fair Market Value ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Current estimated value of each share
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="earlierExerciseWindow"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Early Exercise Window</FormLabel>
                            <FormDescription>
                              Toggle if your grant allows early exercise of
                              unvested options
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6 border rounded-md p-4 bg-blue-50 dark:bg-blue-950">
                    <h4 className="text-sm font-medium flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                      Current Exercise Cost Calculator
                    </h4>

                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Exercise Cost:
                        </p>
                        <p className="text-lg font-medium">
                          $
                          {(
                            watchValues.strikePrice * watchValues.vestedShares
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Potential Spread:
                        </p>
                        <p className="text-lg font-medium">
                          $
                          {(
                            (watchValues.currentFMV - watchValues.strikePrice) *
                            watchValues.vestedShares
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-blue-600">
                      These are preliminary calculations. Full tax implications
                      will be shown in the recommendation.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button type="submit">
                  {step < 4 ? "Next" : "Generate Recommendation"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {recommendation && (
              <>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-primary">
                      Recommendation
                    </h3>
                    {getRiskBadge(recommendation.riskLevel)}
                  </div>
                  <p className="mt-2 font-medium text-xl">
                    {recommendation.action}
                  </p>
                  <p className="mt-1 text-sm">
                    Optimal timeframe: {recommendation.timeframe}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-md font-medium">Reasoning</h3>
                    <ul className="space-y-2 pl-5 list-disc">
                      {recommendation.reasoning.map((reason, idx) => (
                        <li key={idx} className="text-sm">
                          {reason}
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-md font-medium pt-2">
                      Analysis Factors
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Financial Capacity</span>
                          <span>
                            {Math.round(
                              recommendation.scores.financialCapacity * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={recommendation.scores.financialCapacity * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Company Outlook</span>
                          <span>
                            {Math.round(
                              recommendation.scores.companyOutlook * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={recommendation.scores.companyOutlook * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Tax Efficiency</span>
                          <span>
                            {Math.round(
                              recommendation.scores.taxEfficiency * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={recommendation.scores.taxEfficiency * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Timing</span>
                          <span>
                            {Math.round(recommendation.scores.timing * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={recommendation.scores.timing * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-md font-medium">Financial Impact</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Exercise Cost</p>
                        <p className="font-medium text-lg">
                          $
                          {recommendation.details.exerciseCost.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">
                          Potential AMT Exposure
                        </p>
                        <p className="font-medium text-lg">
                          ${recommendation.details.amtExposure.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Bargain Element</p>
                        <p className="font-medium">
                          ${recommendation.details.spread.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-md font-medium">
                      Alternative Approaches
                    </h3>
                    <div className="space-y-2">
                      {recommendation.details.alternativeApproaches.map(
                        (approach, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                              <CheckCircle className="h-3 w-3 text-primary" />
                            </div>
                            <p>{approach}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {taxData && (
                  <div className="pt-4">
                    <h3 className="text-md font-medium mb-4">
                      Tax Impact Analysis
                    </h3>
                    <TaxVisualization data={taxData} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
      {step === 5 && (
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => setStep(1)}>
            Start Over
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Utility functions for calculating scores and recommendations
function calculateFinancialCapacityScore(data) {
  // Calculate exercise cost
  const exerciseCost = data.strikePrice * data.vestedShares;

  // Calculate total liquid assets
  const liquidAssets = data.availableCash + data.otherLiquidAssets;

  // Calculate financial capacity ratio (assets / cost)
  const capacityRatio = exerciseCost > 0 ? liquidAssets / exerciseCost : 0;

  // Calculate debt-to-income ratio
  const monthlyIncome = data.currentIncome / 12;
  const debtRatio =
    monthlyIncome > 0 ? data.monthlyExpenses / monthlyIncome : 1;

  // Factor in risk tolerance (higher tolerance improves score)
  const riskFactor =
    data.riskTolerance === "very_low"
      ? 0.6
      : data.riskTolerance === "low"
      ? 0.8
      : data.riskTolerance === "medium"
      ? 1.0
      : data.riskTolerance === "high"
      ? 1.2
      : 1.4; // very_high

  // Calculate base score from capacity ratio
  let baseScore = 0;
  if (capacityRatio >= 3) baseScore = 1.0;
  else if (capacityRatio >= 2) baseScore = 0.9;
  else if (capacityRatio >= 1.5) baseScore = 0.8;
  else if (capacityRatio >= 1.2) baseScore = 0.7;
  else if (capacityRatio >= 1.0) baseScore = 0.6;
  else if (capacityRatio >= 0.8) baseScore = 0.5;
  else if (capacityRatio >= 0.6) baseScore = 0.4;
  else if (capacityRatio >= 0.4) baseScore = 0.3;
  else if (capacityRatio >= 0.2) baseScore = 0.2;
  else baseScore = 0.1;

  // Adjust for debt ratio (lower debt improves score)
  const debtAdjustment =
    debtRatio <= 0.2
      ? 0.1
      : debtRatio <= 0.3
      ? 0.05
      : debtRatio <= 0.4
      ? 0
      : debtRatio <= 0.5
      ? -0.05
      : -0.1;

  // Apply risk tolerance factor and debt adjustment
  let finalScore = baseScore * riskFactor + debtAdjustment;

  // Ensure score stays in 0-1 range
  return Math.max(0, Math.min(1, finalScore));
}

function calculateCompanyOutlookScore(data) {
  // Base score based on company stage
  const stageScore =
    data.companyStage === "seed"
      ? 0.4
      : data.companyStage === "early"
      ? 0.5
      : data.companyStage === "growth"
      ? 0.7
      : data.companyStage === "late"
      ? 0.8
      : data.companyStage === "pre_ipo"
      ? 0.9
      : 1.0; // public

  // Growth rate score
  const growthScore =
    data.growthRate <= 0
      ? 0.3
      : data.growthRate <= 10
      ? 0.5
      : data.growthRate <= 20
      ? 0.6
      : data.growthRate <= 30
      ? 0.7
      : data.growthRate <= 50
      ? 0.8
      : data.growthRate <= 75
      ? 0.9
      : 1.0;

  // Financing history score
  const financingScore =
    data.financingHistory === "strong"
      ? 0.9
      : data.financingHistory === "moderate"
      ? 0.7
      : data.financingHistory === "weak"
      ? 0.4
      : 0.6; // unknown

  // Calculate weighted average
  return stageScore * 0.4 + growthScore * 0.3 + financingScore * 0.3;
}

function calculateTaxEfficiencyScore(data) {
  // Different calculation based on option type
  if (data.optionType === "iso") {
    // For ISOs, consider AMT implications
    const spread = (data.currentFMV - data.strikePrice) * data.vestedShares;
    const totalIncome = data.currentIncome + spread;

    // Higher spread and income increase AMT risk, lowering score
    const amtRiskFactor =
      totalIncome <= 100000
        ? 0.9
        : totalIncome <= 200000
        ? 0.8
        : totalIncome <= 400000
        ? 0.6
        : totalIncome <= 600000
        ? 0.4
        : 0.2;

    // State tax impact
    const stateImpact =
      data.stateOfResidence === "California"
        ? 0.3
        : data.stateOfResidence === "New York"
        ? 0.3
        : data.stateOfResidence === "Texas"
        ? 0.8
        : 0.6; // Default for other states

    return amtRiskFactor * 0.7 + stateImpact * 0.3;
  } else if (data.optionType === "nso") {
    // For NSOs, ordinary income tax applies immediately on exercise
    // Higher spread means higher immediate tax, lowering score
    const spread = (data.currentFMV - data.strikePrice) * data.vestedShares;
    const taxRatio = data.currentIncome > 0 ? spread / data.currentIncome : 1;

    // Lower ratio is better for tax efficiency
    const taxEfficiency =
      taxRatio <= 0.1
        ? 0.9
        : taxRatio <= 0.2
        ? 0.8
        : taxRatio <= 0.5
        ? 0.6
        : taxRatio <= 1.0
        ? 0.4
        : taxRatio <= 2.0
        ? 0.2
        : 0.1;

    return taxEfficiency;
  } else {
    // RSUs
    // RSUs are typically taxed at vesting - tax efficiency for exercise N/A
    return 0.5; // Neutral score
  }
}

function calculateTimingScore(data) {
  // Consider time to expiration
  const expirationScore =
    data.timeToExpiration <= 0.5
      ? 0.9 // Urgent to exercise
      : data.timeToExpiration <= 1
      ? 0.8
      : data.timeToExpiration <= 2
      ? 0.6
      : data.timeToExpiration <= 5
      ? 0.4
      : 0.2; // Plenty of time

  // Consider exit timeline
  const exitScore =
    data.exitTimeline === "imminent"
      ? 0.9 // Good time to exercise
      : data.exitTimeline === "1-2_years"
      ? 0.7
      : data.exitTimeline === "3-5_years"
      ? 0.5
      : data.exitTimeline === "5+_years"
      ? 0.3
      : 0.5; // unknown

  // Weight expiration more heavily if it's more urgent
  const expirationWeight = data.timeToExpiration <= 2 ? 0.7 : 0.4;
  const exitWeight = 1 - expirationWeight;

  return expirationScore * expirationWeight + exitScore * exitWeight;
}

function calculateAMTExposure(data) {
  // Only relevant for ISOs
  if (data.optionType !== "iso") return 0;

  // Calculate bargain element (spread)
  const spread = (data.currentFMV - data.strikePrice) * data.vestedShares;

  // Simplified AMT calculation (this would be more complex in reality)
  // Base AMT rate around 26%
  const amtRate = 0.26;

  // Higher income thresholds have higher AMT exposure
  const amtExposure =
    data.currentIncome <= 100000
      ? spread * amtRate * 0.5
      : data.currentIncome <= 200000
      ? spread * amtRate * 0.7
      : data.currentIncome <= 400000
      ? spread * amtRate * 0.9
      : spread * amtRate;

  return amtExposure;
}

function getTimeframeRecommendation(data, score) {
  // Generate a specific timeframe recommendation based on all factors
  if (data.timeToExpiration <= 0.5)
    return "Before options expire in the next 6 months";

  if (score >= 0.7) {
    return "Within the next 3 months to optimize tax position";
  } else if (score >= 0.5) {
    return "Within the next 6 months, potentially staggered exercises";
  } else if (score >= 0.3) {
    if (data.exitTimeline === "imminent" || data.exitTimeline === "1-2_years") {
      return "Consider waiting 3-6 months to reassess company progress";
    } else {
      return "Wait at least 6 months and reassess market conditions";
    }
  } else {
    return "Wait at least 12 months and reassess all factors";
  }
}

function generateAlternativeApproaches(data, score) {
  const approaches = [];

  // Generate alternative strategies
  if (data.optionType === "iso") {
    approaches.push("Consider exercising at year-end to optimize AMT planning");

    if (data.vestedShares > 1000) {
      approaches.push(
        "Consider a staged exercise strategy over multiple tax years to spread AMT impact"
      );
    }

    if (score < 0.5 && data.exitTimeline !== "imminent") {
      approaches.push(
        "Watch for decreases in company valuation that might reduce AMT exposure"
      );
    }
  }

  if (data.optionType === "nso") {
    approaches.push("Consider exercising in a year with lower overall income");
    approaches.push(
      "Evaluate exercise-and-hold vs. exercise-and-sell strategies for tax implications"
    );
  }

  if (data.timeToExpiration > 5) {
    approaches.push(
      "Consider waiting for potential increase in company valuation"
    );
  } else if (data.timeToExpiration < 2) {
    approaches.push("Develop a timeline to ensure exercise before expiration");
  }

  if (data.earlierExerciseWindow) {
    approaches.push(
      "Consider early exercise of unvested shares with 83(b) election to start capital gains holding period"
    );
  }

  // Always add these general approaches
  approaches.push("Consult with a tax professional for personalized advice");
  approaches.push(
    "Regularly reassess as company valuation and personal finances change"
  );

  // Return 3-5 most relevant approaches
  return approaches.slice(0, Math.min(5, approaches.length));
}

function generateSimulatedTaxData(data, spread, exerciseCost) {
  // This function would generate data for the TaxVisualization component
  // In a real implementation, this would be a more sophisticated calculation

  // Different tax impacts based on equity type
  let federalTax, stateTax, amtTax;

  if (data.optionType === "iso") {
    // ISOs are subject to AMT on exercise
    federalTax = 0; // No regular income tax on exercise
    stateTax = 0; // No state income tax on exercise

    // AMT calculation (simplified)
    const amtRate = 0.26;
    amtTax = spread * amtRate;

    // AMT credit for future years
    const amtCredit = amtTax;

    return {
      totals: {
        totalIncome: spread,
        totalTax: amtTax,
        effectiveRate: spread > 0 ? amtTax / spread : 0,
        netProceeds: spread - amtTax - exerciseCost,
      },
      federal: {
        federalTax: 0,
        ordinaryIncome: 0,
        shortTermGains: 0,
        longTermGains: 0,
      },
      state: {
        stateTax: 0,
        stateBreakdown: [
          { stateCode: data.stateOfResidence, stateTax: 0, allocation: 1 },
        ],
      },
      amt: {
        amtIncome: spread,
        exemption: 70000, // Simplified
        netAMTDue: amtTax,
        amtCredit: amtCredit,
      },
      exerciseCost: exerciseCost,
      assumptions: {
        federalRate: 0.32,
        stateRate: 0.08,
        capitalGainsRate: 0.15,
      },
    };
  } else if (data.optionType === "nso") {
    // NSOs are subject to ordinary income tax on exercise
    const federalRate = 0.32; // Simplified
    const stateRate = 0.08; // Simplified

    federalTax = spread * federalRate;
    stateTax = spread * stateRate;
    amtTax = 0; // No AMT implications

    const totalTax = federalTax + stateTax;

    return {
      totals: {
        totalIncome: spread,
        totalTax: totalTax,
        effectiveRate: spread > 0 ? totalTax / spread : 0,
        netProceeds: spread - totalTax - exerciseCost,
      },
      federal: {
        federalTax: federalTax,
        ordinaryIncome: spread,
        shortTermGains: 0,
        longTermGains: 0,
      },
      state: {
        stateTax: stateTax,
        stateBreakdown: [
          {
            stateCode: data.stateOfResidence,
            stateTax: stateTax,
            allocation: 1,
          },
        ],
      },
      amt: null,
      exerciseCost: exerciseCost,
      assumptions: {
        federalRate: federalRate,
        stateRate: stateRate,
        capitalGainsRate: 0.15,
      },
    };
  } else {
    // RSUs
    // Simplified tax calculation for RSUs (typically taxed at vesting, not exercise)
    return null;
  }
}
