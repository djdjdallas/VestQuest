// src/app/dashboard/decisions/exit/page.jsx
"use client";

import { useState } from "react";
import { DecisionLayout } from "@/components/decisions/DecisionLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGrants } from "@/hooks/useGrants";
import { calculateTaxes } from "@/utils/calculations";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { GRANT_TYPES, COMMON_SCENARIOS } from "@/utils/constants";

export default function ExitPlanningGuidePage() {
  const { grants, loading: grantsLoading } = useGrants();

  const [currentStep, setCurrentStep] = useState(0);
  const [exitScenario, setExitScenario] = useState({
    type: "IPO",
    timing: "6-12",
    customMultiplier: 10,
    selectedScenario: COMMON_SCENARIOS[1].name,
  });
  const [taxStrategy, setTaxStrategy] = useState({
    exerciseBeforeExit: "some",
    exerciseTiming: "now",
    holdingPeriod: "1-year",
    sellTiming: "staggered",
  });
  const [result, setResult] = useState(null);

  const steps = ["Exit Scenario", "Tax Strategy", "Recommendations"];

  const handleNext = () => {
    if (currentStep === 1) {
      // Generate recommendation
      generateRecommendation();
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get selected multiplier from common scenarios or custom
  const getMultiplier = () => {
    if (exitScenario.selectedScenario === "custom") {
      return exitScenario.customMultiplier;
    }

    const scenario = COMMON_SCENARIOS.find(
      (s) => s.name === exitScenario.selectedScenario
    );
    return scenario ? scenario.multiplier : 10;
  };

  const generateRecommendation = () => {
    if (!grants || grants.length === 0) return;

    const multiplier = getMultiplier();
    const totalCurrentValue = grants.reduce((sum, grant) => {
      return sum + grant.shares * grant.current_fmv;
    }, 0);
    const estimatedExitValue = totalCurrentValue * multiplier;

    // Calculate optimal exercise strategy
    let strategies = [];
    let optimalStrategy = null;
    let maxReturn = 0;

    grants.forEach((grant) => {
      if (
        grant.grant_type === GRANT_TYPES.ISO ||
        grant.grant_type === GRANT_TYPES.NSO
      ) {
        // Calculate exercise now vs. at exit
        const exerciseNow = calculateTaxes(
          grant,
          grant.strike_price,
          grant.current_fmv * multiplier,
          grant.shares,
          true // Long-term capital gains
        );

        const exerciseAtExit = calculateTaxes(
          grant,
          grant.strike_price,
          grant.current_fmv * multiplier,
          grant.shares,
          false // Short-term capital gains
        );

        const exerciseNowReturn =
          grant.shares * grant.current_fmv * multiplier -
          grant.shares * grant.strike_price -
          exerciseNow.total_tax;

        const exerciseAtExitReturn =
          grant.shares * grant.current_fmv * multiplier -
          grant.shares * grant.strike_price -
          exerciseAtExit.total_tax;

        strategies.push({
          grantId: grant.id,
          grantType: grant.grant_type,
          shares: grant.shares,
          exerciseNowReturn,
          exerciseAtExitReturn,
          recommendation:
            exerciseNowReturn > exerciseAtExitReturn ? "now" : "at-exit",
          taxSavings: Math.abs(exerciseNowReturn - exerciseAtExitReturn),
        });

        if (exerciseNowReturn > maxReturn) {
          maxReturn = exerciseNowReturn;
          optimalStrategy = "now";
        }

        if (exerciseAtExitReturn > maxReturn) {
          maxReturn = exerciseAtExitReturn;
          optimalStrategy = "at-exit";
        }
      }
    });

    setResult({
      estimatedExitValue,
      optimalStrategy,
      maxReturn,
      strategies,
      recommendations: [
        {
          title: "Exercise Strategy",
          content:
            optimalStrategy === "now"
              ? "Consider exercising your ISOs now to qualify for long-term capital gains treatment."
              : "Exercise at exit to minimize cash outlay, though this may result in higher taxes.",
        },
        {
          title: "Holding Period",
          content:
            "Hold ISOs for at least 1 year after exercise and 2 years after grant to qualify for favorable tax treatment.",
        },
        {
          title: "Diversification",
          content:
            "Consider selling some shares soon after exit to diversify your portfolio and reduce risk.",
        },
      ],
    });
  };

  return (
    <DecisionLayout
      title="Exit Planning Guide"
      description="Optimize your exit strategy to maximize after-tax returns"
      steps={steps}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      isComplete={currentStep === steps.length - 1}
    >
      {currentStep === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Exit Scenario</h2>
          <p className="text-muted-foreground">
            Define the exit scenario you're planning for
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exit Type</Label>
              <RadioGroup
                value={exitScenario.type}
                onValueChange={(value) =>
                  setExitScenario({
                    ...exitScenario,
                    type: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IPO" id="type-ipo" />
                  <Label htmlFor="type-ipo">IPO</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Acquisition" id="type-acquisition" />
                  <Label htmlFor="type-acquisition">Acquisition</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Secondary" id="type-secondary" />
                  <Label htmlFor="type-secondary">Secondary Sale</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Expected Timing</Label>
              <RadioGroup
                value={exitScenario.timing}
                onValueChange={(value) =>
                  setExitScenario({
                    ...exitScenario,
                    timing: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0-6" id="timing-0-6" />
                  <Label htmlFor="timing-0-6">0-6 months</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6-12" id="timing-6-12" />
                  <Label htmlFor="timing-6-12">6-12 months</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-2" id="timing-1-2" />
                  <Label htmlFor="timing-1-2">1-2 years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2+" id="timing-2+" />
                  <Label htmlFor="timing-2+">2+ years</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select
                value={exitScenario.selectedScenario}
                onValueChange={(value) =>
                  setExitScenario({
                    ...exitScenario,
                    selectedScenario: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SCENARIOS.map((scenario) => (
                    <SelectItem key={scenario.name} value={scenario.name}>
                      {scenario.name} ({scenario.multiplier}x)
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exitScenario.selectedScenario === "custom" && (
              <div className="space-y-2">
                <Label>Custom Multiple: {exitScenario.customMultiplier}x</Label>
                <Slider
                  value={[exitScenario.customMultiplier]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(values) =>
                    setExitScenario({
                      ...exitScenario,
                      customMultiplier: values[0],
                    })
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1x</span>
                  <span>25x</span>
                  <span>50x</span>
                  <span>75x</span>
                  <span>100x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Tax Strategy</h2>
          <p className="text-muted-foreground">
            Define your tax strategy for maximizing after-tax returns
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exercise Before Exit</Label>
              <RadioGroup
                value={taxStrategy.exerciseBeforeExit}
                onValueChange={(value) =>
                  setTaxStrategy({
                    ...taxStrategy,
                    exerciseBeforeExit: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="exercise-all" />
                  <Label htmlFor="exercise-all">Exercise all options now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="some" id="exercise-some" />
                  <Label htmlFor="exercise-some">
                    Exercise some options now
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="exercise-none" />
                  <Label htmlFor="exercise-none">
                    Wait until exit to exercise
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {taxStrategy.exerciseBeforeExit !== "none" && (
              <div className="space-y-2">
                <Label>Exercise Timing</Label>
                <RadioGroup
                  value={taxStrategy.exerciseTiming}
                  onValueChange={(value) =>
                    setTaxStrategy({
                      ...taxStrategy,
                      exerciseTiming: value,
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="timing-now" />
                    <Label htmlFor="timing-now">As soon as possible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staggered" id="timing-staggered" />
                    <Label htmlFor="timing-staggered">
                      Staggered over time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="threshold" id="timing-threshold" />
                    <Label htmlFor="timing-threshold">
                      When company reaches valuation threshold
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Post-Exit Holding Period</Label>
              <RadioGroup
                value={taxStrategy.holdingPeriod}
                onValueChange={(value) =>
                  setTaxStrategy({
                    ...taxStrategy,
                    holdingPeriod: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="holding-immediate" />
                  <Label htmlFor="holding-immediate">Sell immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-year" id="holding-1-year" />
                  <Label htmlFor="holding-1-year">
                    Hold for 1 year after exit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="varied" id="holding-varied" />
                  <Label htmlFor="holding-varied">Varied holding periods</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Selling Strategy</Label>
              <RadioGroup
                value={taxStrategy.sellTiming}
                onValueChange={(value) =>
                  setTaxStrategy({
                    ...taxStrategy,
                    sellTiming: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="sell-all" />
                  <Label htmlFor="sell-all">Sell all at once</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staggered" id="sell-staggered" />
                  <Label htmlFor="sell-staggered">Staggered sales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10b5-1" id="sell-10b5-1" />
                  <Label htmlFor="sell-10b5-1">10b5-1 plan</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && result && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-center">
            Exit Planning Recommendations
          </h2>

          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="font-medium mb-2">Estimated Exit Value</h3>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(result.estimatedExitValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {getMultiplier()}x current valuation
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Optimal Strategy</h3>
            <div
              className={`p-4 border rounded-md ${
                result.optimalStrategy === "now"
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <h4 className="font-medium mb-1">
                {result.optimalStrategy === "now"
                  ? "Exercise Options Now"
                  : "Exercise at Exit"}
              </h4>
              <p className="text-sm">
                {result.optimalStrategy === "now"
                  ? "This strategy maximizes your after-tax returns by qualifying for long-term capital gains rates."
                  : "This strategy minimizes cash outlay now, though may result in higher taxes at exit."}
              </p>
              <div className="mt-2 font-medium">
                Estimated Net Return: {formatCurrency(result.maxReturn)}
              </div>
            </div>

            {result.strategies && result.strategies.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Grant-by-Grant Analysis</h3>
                {result.strategies.map((strategy, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between mb-1">
                      <span>
                        {strategy.grantType} - {strategy.shares} shares
                      </span>
                      <span
                        className={
                          strategy.recommendation === "now"
                            ? "text-green-600 font-medium"
                            : "text-blue-600 font-medium"
                        }
                      >
                        {strategy.recommendation === "now"
                          ? "Exercise Now"
                          : "Exercise at Exit"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tax savings: {formatCurrency(strategy.taxSavings)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 mt-4">
              <h3 className="font-medium">Key Recommendations</h3>
              {result.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <h4 className="font-medium mb-1">{rec.title}</h4>
                  <p className="text-sm">{rec.content}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full">
                Save & Print Tax Strategy
              </Button>
            </div>
          </div>
        </div>
      )}
    </DecisionLayout>
  );
}
