// src/app/dashboard/decisions/exercise/page.jsx
"use client";

import { useState } from "react";
import { DecisionLayout } from "@/components/decisions/DecisionLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGrants } from "@/hooks/useGrants";
import { useCalculator } from "@/hooks/useCalculator";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { GRANT_TYPES } from "@/utils/constants";

export default function ExerciseDecisionGuidePage() {
  const { grants, loading: grantsLoading } = useGrants();
  const { calculateTax, isLoading: calculationLoading } = useCalculator();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [financialInfo, setFinancialInfo] = useState({
    cashAvailable: 50000,
    otherIncome: 150000,
    riskTolerance: 3, // 1-5 scale
    timeHorizon: "medium", // short, medium, long
    taxBracket: "high",
  });
  const [companyOutlook, setCompanyOutlook] = useState({
    confidence: "moderate", // low, moderate, high
    timeToExit: "unknown", // 1-2 years, 3-5 years, 5+ years, unknown
    expectedMultiple: 3, // Default to 3x current value
  });
  const [result, setResult] = useState(null);

  const steps = [
    "Select Grant",
    "Financial Profile",
    "Company Outlook",
    "Recommendation",
  ];

  const handleNext = () => {
    if (currentStep === 2) {
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

  const generateRecommendation = () => {
    if (!selectedGrant) return;

    // Simplified decision logic
    const grant = selectedGrant;
    const exerciseCost = grant.vested_shares * grant.strike_price;
    const expectedValue =
      grant.vested_shares * grant.current_fmv * companyOutlook.expectedMultiple;

    // Check if user has enough cash
    const affordabilityRatio = financialInfo.cashAvailable / exerciseCost;

    // Check tax implications
    const taxSettings = {
      federalRate: financialInfo.taxBracket === "high" ? 0.37 : 0.24,
      stateRate: 0.13, // Assuming CA
      exerciseDate: new Date(),
      saleDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
    };

    // Calculate tax impact
    const taxImpact = calculateTax(
      grant,
      grant.strike_price,
      grant.current_fmv * companyOutlook.expectedMultiple,
      grant.vested_shares,
      taxSettings
    );

    // Decision factors
    const factors = {
      affordability:
        affordabilityRatio >= 1
          ? "high"
          : affordabilityRatio >= 0.5
          ? "medium"
          : "low",
      taxBenefit:
        grant.grant_type === GRANT_TYPES.ISO &&
        financialInfo.timeHorizon === "long"
          ? "high"
          : "medium",
      companyConfidence: companyOutlook.confidence,
      roi: (expectedValue - exerciseCost) / exerciseCost,
    };

    // Generate recommendation
    let recommendation = "";
    let explanation = "";

    if (factors.affordability === "low") {
      recommendation = "Hold";
      explanation = "You don't have sufficient cash to exercise comfortably.";
    } else if (factors.companyConfidence === "low") {
      recommendation = "Hold";
      explanation = "Your confidence in the company's future is low.";
    } else if (
      factors.taxBenefit === "high" &&
      factors.affordability === "high"
    ) {
      recommendation = "Exercise Now";
      explanation =
        "You can afford to exercise and will benefit from favorable tax treatment.";
    } else if (factors.roi > 3 && factors.affordability === "high") {
      recommendation = "Exercise Now";
      explanation =
        "The potential return is significant and you can afford the exercise cost.";
    } else if (factors.roi > 2 && factors.affordability === "medium") {
      recommendation = "Partially Exercise";
      explanation =
        "Consider exercising some options to balance risk and potential return.";
    } else {
      recommendation = "Hold";
      explanation =
        "Based on your financial situation and the company outlook, it may be better to wait.";
    }

    setResult({
      recommendation,
      explanation,
      financialImpact: {
        exerciseCost,
        expectedValue,
        potentialReturn: expectedValue - exerciseCost,
        roi: (expectedValue - exerciseCost) / exerciseCost,
      },
      taxImpact: taxImpact || {
        federalTax: exerciseCost * 0.24,
        stateTax: exerciseCost * 0.13,
        amtImpact:
          grant.grant_type === GRANT_TYPES.ISO ? exerciseCost * 0.1 : 0,
      },
      factors,
    });
  };

  return (
    <DecisionLayout
      title="Exercise Decision Guide"
      description="Get a personalized recommendation on whether to exercise your options"
      steps={steps}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      isComplete={currentStep === steps.length - 1}
    >
      {currentStep === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Select an Equity Grant</h2>
          <p className="text-muted-foreground">
            Choose the grant you're considering exercising
          </p>

          {grantsLoading ? (
            <p>Loading your grants...</p>
          ) : grants.length > 0 ? (
            <div className="space-y-4">
              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className={`p-4 border rounded-md cursor-pointer hover:border-primary transition-colors
                    ${
                      selectedGrant?.id === grant.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  onClick={() => setSelectedGrant(grant)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">
                        {grant.grant_type} - {grant.shares} shares
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Strike price: {formatCurrency(grant.strike_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(grant.current_fmv)} current FMV
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(grant.vested_percentage)} vested
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md bg-muted/50">
              <p>You don't have any grants yet.</p>
              <Button className="mt-4" asChild>
                <a href="/dashboard/grants/new">Add a Grant</a>
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Financial Profile</h2>
          <p className="text-muted-foreground">
            These details help us determine if exercising makes financial sense
            for you
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cash available for exercise</Label>
              <Input
                type="number"
                value={financialInfo.cashAvailable}
                onChange={(e) =>
                  setFinancialInfo({
                    ...financialInfo,
                    cashAvailable: parseFloat(e.target.value),
                  })
                }
                prefix="$"
              />
            </div>

            <div className="space-y-2">
              <Label>Other annual income</Label>
              <Input
                type="number"
                value={financialInfo.otherIncome}
                onChange={(e) =>
                  setFinancialInfo({
                    ...financialInfo,
                    otherIncome: parseFloat(e.target.value),
                  })
                }
                prefix="$"
              />
            </div>

            <div className="space-y-2">
              <Label>Risk tolerance (1 = Low, 5 = High)</Label>
              <Slider
                value={[financialInfo.riskTolerance]}
                min={1}
                max={5}
                step={1}
                onValueChange={(values) =>
                  setFinancialInfo({
                    ...financialInfo,
                    riskTolerance: values[0],
                  })
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Investment time horizon</Label>
              <RadioGroup
                value={financialInfo.timeHorizon}
                onValueChange={(value) =>
                  setFinancialInfo({
                    ...financialInfo,
                    timeHorizon: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="short" id="horizon-short" />
                  <Label htmlFor="horizon-short">Short (1-2 years)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="horizon-medium" />
                  <Label htmlFor="horizon-medium">Medium (3-5 years)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="long" id="horizon-long" />
                  <Label htmlFor="horizon-long">Long (5+ years)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Tax bracket</Label>
              <RadioGroup
                value={financialInfo.taxBracket}
                onValueChange={(value) =>
                  setFinancialInfo({
                    ...financialInfo,
                    taxBracket: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="tax-low" />
                  <Label htmlFor="tax-low">24% or below</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="tax-high" />
                  <Label htmlFor="tax-high">32% or above</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Company Outlook</h2>
          <p className="text-muted-foreground">
            Your assessment of the company's future prospects
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Confidence in company success</Label>
              <RadioGroup
                value={companyOutlook.confidence}
                onValueChange={(value) =>
                  setCompanyOutlook({
                    ...companyOutlook,
                    confidence: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="confidence-low" />
                  <Label htmlFor="confidence-low">Low confidence</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="confidence-moderate" />
                  <Label htmlFor="confidence-moderate">
                    Moderate confidence
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="confidence-high" />
                  <Label htmlFor="confidence-high">High confidence</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Expected time to liquidity event</Label>
              <RadioGroup
                value={companyOutlook.timeToExit}
                onValueChange={(value) =>
                  setCompanyOutlook({
                    ...companyOutlook,
                    timeToExit: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-2" id="exit-1-2" />
                  <Label htmlFor="exit-1-2">1-2 years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3-5" id="exit-3-5" />
                  <Label htmlFor="exit-3-5">3-5 years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5+" id="exit-5+" />
                  <Label htmlFor="exit-5+">5+ years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unknown" id="exit-unknown" />
                  <Label htmlFor="exit-unknown">Unknown</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>
                Expected growth multiple (current value x{" "}
                {companyOutlook.expectedMultiple})
              </Label>
              <Slider
                value={[companyOutlook.expectedMultiple]}
                min={1}
                max={10}
                step={0.5}
                onValueChange={(values) =>
                  setCompanyOutlook({
                    ...companyOutlook,
                    expectedMultiple: values[0],
                  })
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1x</span>
                <span>5x</span>
                <span>10x</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && result && (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div
              className={`
              p-3 rounded-full text-white font-medium text-xl w-32 h-32 flex items-center justify-center
              ${
                result.recommendation === "Exercise Now"
                  ? "bg-green-600"
                  : result.recommendation === "Partially Exercise"
                  ? "bg-amber-500"
                  : "bg-blue-600"
              }
            `}
            >
              {result.recommendation}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Explanation</h3>
            <p>{result.explanation}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Financial Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground">
                  Exercise Cost
                </div>
                <div className="text-lg font-medium">
                  {formatCurrency(result.financialImpact.exerciseCost)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground">
                  Expected Value
                </div>
                <div className="text-lg font-medium">
                  {formatCurrency(result.financialImpact.expectedValue)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground">
                  Potential Return
                </div>
                <div className="text-lg font-medium">
                  {formatCurrency(result.financialImpact.potentialReturn)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground">ROI</div>
                <div className="text-lg font-medium">
                  {formatPercentage(result.financialImpact.roi * 100)}
                </div>
              </div>
            </div>

            <h3 className="font-medium mt-4">Tax Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground">Federal Tax</div>
                <div className="text-lg font-medium">
                  {formatCurrency(result.taxImpact.federalTax)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground">State Tax</div>
                <div className="text-lg font-medium">
                  {formatCurrency(result.taxImpact.stateTax)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md col-span-2">
                <div className="text-sm text-muted-foreground">
                  AMT Impact (if applicable)
                </div>
                <div className="text-lg font-medium">
                  {formatCurrency(result.taxImpact.amtImpact)}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full">
                Save & Print Recommendation
              </Button>
            </div>
          </div>
        </div>
      )}
    </DecisionLayout>
  );
}
