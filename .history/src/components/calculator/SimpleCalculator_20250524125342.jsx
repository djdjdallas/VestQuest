"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateExerciseCost,
  calculateGrossProceeds,
  calculateTaxes,
} from "@/utils/calculations";
import { GRANT_TYPES, TAX_RATES, COMMON_SCENARIOS } from "@/utils/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  InfoIcon,
  ArrowRightIcon,
  CalculatorIcon,
  LockIcon,
} from "lucide-react";

export function SimpleCalculator({ onCalculationComplete }) {
  // Basic inputs
  const [grantType, setGrantType] = useState("ISO");
  const [shares, setShares] = useState(1000);
  const [strikePrice, setStrikePrice] = useState(1.0);
  const [currentFMV, setCurrentFMV] = useState(10.0);
  const [exitPrice, setExitPrice] = useState(50.0);

  // Advanced inputs
  const [taxRate, setTaxRate] = useState(
    TAX_RATES.FEDERAL_LONG_TERM + TAX_RATES.STATE_CA
  );
  const [exerciseDate, setExerciseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exitDate, setExitDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [percentageToExercise, setPercentageToExercise] = useState(100);

  // Results
  const [result, setResult] = useState(null);
  const [sharesToExercise, setSharesToExercise] = useState(shares);

  // Update sharesToExercise when shares or percentage changes
  useEffect(() => {
    setSharesToExercise(Math.floor(shares * (percentageToExercise / 100)));
  }, [shares, percentageToExercise]);

  // Load predefined scenario
  const loadScenario = (multiplier) => {
    setExitPrice(currentFMV * multiplier);
  };

  // Calculate results
  const calculate = () => {
    const exerciseCost = calculateExerciseCost(sharesToExercise, strikePrice);
    const grossProceeds = calculateGrossProceeds(sharesToExercise, exitPrice);

    // Calculate tax implications
    const taxes = calculateTaxes(
      {
        grant_type: grantType,
        strike_price: strikePrice,
        shares: sharesToExercise,
      },
      strikePrice,
      exitPrice,
      sharesToExercise,
      isLongTerm()
    );

    const netProceeds = grossProceeds - exerciseCost - taxes.total_tax;
    const roi = exerciseCost > 0 ? (netProceeds / exerciseCost) * 100 : 0;

    const calculationResult = {
      exerciseCost,
      grossProceeds,
      taxes,
      netProceeds,
      roi,
      sharesToExercise,
      exitPrice,
      strikePrice,
      spreadPerShare: exitPrice - strikePrice,
    };

    setResult(calculationResult);

    // Notify parent component that calculation is complete
    if (onCalculationComplete) {
      onCalculationComplete(calculationResult);
    }
  };

  // Determine if gain would be long-term based on exercise and exit dates
  const isLongTerm = () => {
    const exerciseD = new Date(exerciseDate);
    const exitD = new Date(exitDate);
    const diffTime = Math.abs(exitD - exerciseD);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 365; // 1 year holding period for long-term capital gains
  };

  return (
    <TooltipProvider>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5 text-primary" />
            <CardTitle>Equity Value Calculator</CardTitle>
          </div>
          <CardDescription>
            Calculate the potential value of your stock options under different
            scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Inputs</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grantType">Grant Type</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          ISO: Incentive Stock Options (potential tax
                          advantages)
                          <br />
                          NSO: Non-Qualified Stock Options
                          <br />
                          RSU: Restricted Stock Units
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={grantType} onValueChange={setGrantType}>
                    <SelectTrigger id="grantType">
                      <SelectValue placeholder="Select grant type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISO">ISO</SelectItem>
                      <SelectItem value="NSO">NSO</SelectItem>
                      <SelectItem value="RSU">RSU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="shares">Number of Shares</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total number of shares in your grant</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="shares"
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(parseInt(e.target.value || "0"))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="strikePrice">Strike Price ($)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The price at which you can exercise your options</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="strikePrice"
                    type="number"
                    step="0.01"
                    value={strikePrice}
                    onChange={(e) =>
                      setStrikePrice(parseFloat(e.target.value || "0"))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="currentFMV">Current FMV ($)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current Fair Market Value (409A valuation)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="currentFMV"
                    type="number"
                    step="0.01"
                    value={currentFMV}
                    onChange={(e) =>
                      setCurrentFMV(parseFloat(e.target.value || "0"))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="exitPrice">Exit Price ($)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Expected price per share at exit (IPO or acquisition)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.01"
                    value={exitPrice}
                    onChange={(e) =>
                      setExitPrice(parseFloat(e.target.value || "0"))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="percentageToExercise">
                      Percentage to Exercise
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of your shares you plan to exercise</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="percentageToExercise"
                    type="number"
                    min="0"
                    max="100"
                    value={percentageToExercise}
                    onChange={(e) =>
                      setPercentageToExercise(
                        Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value || "0"))
                        )
                      )
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    {sharesToExercise.toLocaleString()} of{" "}
                    {shares.toLocaleString()} shares
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="mb-3 text-sm font-medium">Quick Scenarios</div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SCENARIOS.map((scenario) => (
                    <Button
                      key={scenario.name}
                      variant="outline"
                      size="sm"
                      onClick={() => loadScenario(scenario.multiplier)}
                    >
                      {scenario.name}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="taxRate">Effective Tax Rate (%)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Combined federal and state tax rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxRate * 100}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value || "0") / 100)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exerciseDate">Exercise Date</Label>
                  <Input
                    id="exerciseDate"
                    type="date"
                    value={exerciseDate}
                    onChange={(e) => setExerciseDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitDate">Exit Date</Label>
                  <Input
                    id="exitDate"
                    type="date"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {isLongTerm()
                      ? "Long-term capital gains"
                      : "Short-term capital gains"}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={calculate} className="w-full mt-6" size="lg">
            Calculate <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>

          {result && (
            <div className="mt-6 border rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground p-3">
                <h3 className="font-semibold text-lg">Results</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="text-muted-foreground">Shares Exercised:</div>
                  <div className="font-medium text-right">
                    {result.sharesToExercise.toLocaleString()}
                  </div>

                  <div className="text-muted-foreground">Strike Price:</div>
                  <div className="font-medium text-right">
                    ${result.strikePrice.toFixed(2)}
                  </div>

                  <div className="text-muted-foreground">Exit Price:</div>
                  <div className="font-medium text-right">
                    ${result.exitPrice.toFixed(2)}
                  </div>

                  <div className="text-muted-foreground">Spread per Share:</div>
                  <div className="font-medium text-right">
                    ${result.spreadPerShare.toFixed(2)}
                  </div>

                  <div className="text-muted-foreground">Exercise Cost:</div>
                  <div className="font-medium text-right">
                    $
                    {result.exerciseCost.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>

                  <div className="text-muted-foreground">Gross Proceeds:</div>
                  <div className="font-medium text-right">
                    $
                    {result.grossProceeds.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>

                  <div className="text-muted-foreground">Tax Liability:</div>
                  <div className="font-medium text-right text-red-600">
                    -$
                    {result.taxes.total_tax.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>

                  <div className="text-muted-foreground">
                    Effective Tax Rate:
                  </div>
                  <div className="font-medium text-right">
                    {(result.taxes.effective_tax_rate * 100).toFixed(1)}%
                  </div>

                  <div className="col-span-2 h-px bg-border my-1"></div>

                  <div className="text-muted-foreground font-semibold">
                    Net Proceeds:
                  </div>
                  <div className="font-bold text-right text-green-600 text-lg">
                    $
                    {result.netProceeds.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>

                  <div className="text-muted-foreground">ROI:</div>
                  <div className="font-medium text-right">
                    {result.roi.toFixed(1)}%
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  <p className="italic">
                    These calculations are estimates and should not be
                    considered financial advice. Consult with a tax professional
                    for personalized guidance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
