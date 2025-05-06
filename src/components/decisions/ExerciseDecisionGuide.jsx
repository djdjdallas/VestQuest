// Create src/components/decisions/ExerciseDecisionGuide.jsx

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { calculateExerciseCost, calculateTaxes } from "@/utils/calculations";

// Define the form schema
const formSchema = z.object({
  // Financial situation
  availableCash: z.number().min(0, "Must be a positive number"),
  riskTolerance: z.enum(["low", "medium", "high"]),
  otherInvestments: z.number().min(0, "Must be a positive number"),

  // Company outlook
  companyStage: z.enum(["early", "growth", "late", "pre-ipo"]),
  growthPotential: z.enum(["low", "medium", "high"]),
  exitTimeline: z.enum(["unknown", "1-2 years", "3-5 years", "5+ years"]),

  // Tax considerations
  currentIncome: z.number().min(0, "Must be a positive number"),
  taxBracket: z.enum(["low", "medium", "high"]),
  amtExposure: z.enum(["none", "some", "significant"]),
});

export function ExerciseDecisionGuide({ grant }) {
  const [step, setStep] = useState(1);
  const [recommendation, setRecommendation] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      availableCash: 0,
      riskTolerance: "medium",
      otherInvestments: 0,
      companyStage: "growth",
      growthPotential: "medium",
      exitTimeline: "unknown",
      currentIncome: 0,
      taxBracket: "medium",
      amtExposure: "none",
    },
  });

  // Calculate exercise cost and tax implications
  const vestedShares = grant ? grant.vested_shares : 0;
  const strikePrice = grant ? grant.strike_price : 0;
  const exerciseCost = calculateExerciseCost(vestedShares, strikePrice);

  // Generate recommendation
  const generateRecommendation = (data) => {
    // Calculate financial capacity score
    const financialCapacityScore = calculateFinancialCapacityScore(
      data,
      exerciseCost
    );

    // Calculate company outlook score
    const companyOutlookScore = calculateCompanyOutlookScore(data);

    // Calculate tax efficiency score
    const taxEfficiencyScore = calculateTaxEfficiencyScore(data, grant);

    // Calculate overall recommendation score
    const totalScore =
      financialCapacityScore * 0.4 +
      companyOutlookScore * 0.3 +
      taxEfficiencyScore * 0.3;

    // Generate recommendation based on total score
    let recommendationText;
    let action;
    let reasoning;

    if (totalScore >= 0.7) {
      action = "Exercise all vested options now";
      reasoning =
        "Your financial situation, the company's outlook, and the tax implications all favor exercising your options now.";
    } else if (totalScore >= 0.5) {
      action = "Consider exercising a portion of your vested options";
      reasoning =
        "While there are some favorable factors, there are also some risks. Consider exercising a portion of your options based on your risk tolerance.";
    } else {
      action = "Hold off on exercising for now";
      reasoning =
        "The current financial costs and risks outweigh the potential benefits of exercising now.";
    }

    // Set the recommendation
    setRecommendation({
      action,
      reasoning,
      scores: {
        financialCapacity: financialCapacityScore,
        companyOutlook: companyOutlookScore,
        taxEfficiency: taxEfficiencyScore,
        total: totalScore,
      },
      details: {
        exerciseCost,
        cashRequired: exerciseCost * 1.2, // Add buffer for taxes
        taxImplications: calculateTaxes(
          grant,
          grant.strike_price,
          grant.current_fmv,
          vestedShares
        ),
        timeToExercise: getTimeToExercise(grant),
      },
    });
  };

  // Form submission handler
  const onSubmit = (data) => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      generateRecommendation(data);
      setStep(4);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Exercise Decision Guide</CardTitle>
        <CardDescription>
          Answer a few questions to get a personalized recommendation on whether
          to exercise your options.
        </CardDescription>
        {step < 4 && (
          <div className="mt-2">
            <Progress value={(step / 3) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Step {step} of 3
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {step < 4 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Your Financial Situation
                  </h3>

                  <FormField
                    control={form.control}
                    name="availableCash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Cash for Exercise ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          How much cash do you have available for exercising
                          options?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="low" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Low - I prefer safer investments
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="medium" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Medium - I can accept some risk
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="high" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                High - I'm comfortable with significant risk
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* More financial fields */}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Company Outlook</h3>

                  {/* Company outlook fields */}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Tax Considerations</h3>

                  {/* Tax consideration fields */}
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
                  {step < 3 ? "Next" : "Get Recommendation"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {recommendation && (
              <>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-primary">
                    Recommendation
                  </h3>
                  <p className="mt-2 font-medium">{recommendation.action}</p>
                  <p className="mt-1 text-sm">{recommendation.reasoning}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-medium">Analysis Breakdown</h3>

                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Company Outlook</span>
                      <span>
                        {Math.round(recommendation.scores.companyOutlook * 100)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={recommendation.scores.companyOutlook * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tax Efficiency</span>
                      <span>
                        {Math.round(recommendation.scores.taxEfficiency * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={recommendation.scores.taxEfficiency * 100}
                      className="h-2"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-md font-medium">Key Considerations</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Exercise Cost</p>
                      <p className="font-medium">
                        ${recommendation.details.exerciseCost.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Cash Required (with tax buffer)
                      </p>
                      <p className="font-medium">
                        ${recommendation.details.cashRequired.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">AMT Exposure</p>
                      <p className="font-medium">
                        $
                        {recommendation.details.taxImplications.amt_liability.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Time to Exercise</p>
                      <p className="font-medium">
                        {recommendation.details.timeToExercise}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
      {step === 4 && (
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => setStep(1)}>
            Start Over
          </Button>
          <Button>Export Report</Button>
        </CardFooter>
      )}
    </Card>
  );
}
