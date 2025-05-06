"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TaxVisualization } from "@/components/tax/TaxVisualization";
import { FileDown, Share, Calculator, InfoIcon } from "lucide-react";

export function IntegratedScenarioTaxAnalysis({
  scenarios = [],
  selectedScenarioId = null,
}) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());

  // Set up initial selected scenario
  useEffect(() => {
    if (scenarios.length > 0) {
      const initialScenario = selectedScenarioId
        ? scenarios.find((s) => s.id === selectedScenarioId)
        : scenarios[0];

      if (initialScenario) {
        setSelectedScenario(initialScenario);
      }
    }
  }, [scenarios, selectedScenarioId]);

  // Generate tax data whenever selected scenario changes
  useEffect(() => {
    if (selectedScenario) {
      // This would typically call an API or a tax calculation function
      // For now, we'll generate simulated data based on the scenario
      const simulatedTaxData = generateTaxAnalysisData(
        selectedScenario,
        taxYear
      );
      setTaxData(simulatedTaxData);
    }
  }, [selectedScenario, taxYear]);

  // Handle scenario change
  const handleScenarioChange = (scenarioId) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setSelectedScenario(scenario);
    }
  };

  if (!selectedScenario || scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            No scenarios available for tax analysis. Create a scenario first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle>Scenario Tax Analysis</CardTitle>
          <div className="flex gap-2">
            <Select
              value={selectedScenario.id}
              onValueChange={handleScenarioChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.scenario_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={taxYear.toString()}
              onValueChange={(year) => setTaxYear(parseInt(year))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tax year" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Detailed tax analysis for scenario: {selectedScenario.scenario_name}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
            <TabsTrigger value="federal">Federal Tax</TabsTrigger>
            <TabsTrigger value="state">State & AMT</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Summary</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Gross Proceeds
                    </p>
                    <p className="text-2xl font-medium">
                      ${selectedScenario.gross_proceeds?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Tax</p>
                    <p className="text-2xl font-medium text-red-500">
                      ${selectedScenario.tax_liability?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Exercise Cost
                    </p>
                    <p className="text-xl font-medium">
                      ${selectedScenario.exercise_cost?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Net Proceeds
                    </p>
                    <p className="text-xl font-medium text-green-500">
                      ${selectedScenario.net_proceeds?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg mt-4">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      Effective Tax Rate
                    </p>
                    <p className="text-sm font-medium">
                      {taxData?.totals?.effectiveRate
                        ? `${(taxData.totals.effectiveRate * 100).toFixed(1)}%`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      Federal Income Tax
                    </p>
                    <p className="text-sm font-medium">
                      ${taxData?.federal?.federalTax?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">State Tax</p>
                    <p className="text-sm font-medium">
                      ${taxData?.state?.stateTax?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      AMT Liability
                    </p>
                    <p className="text-sm font-medium">
                      ${taxData?.amt?.netAMTDue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Key Considerations</h3>

                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-medium text-sm">Tax Implications</h4>
                  <ul className="text-sm space-y-2 list-disc pl-5">
                    <li>
                      This {getTaxTreatmentType(selectedScenario)} results in{" "}
                      {getIncomeType(selectedScenario)}.
                    </li>
                    <li>
                      State taxes are calculated based on your primary residence
                      state.
                    </li>
                    {taxData?.amt?.netAMTDue > 0 && (
                      <li>
                        There is significant Alternative Minimum Tax exposure in
                        this scenario.
                      </li>
                    )}
                    {getTaxHoldingPeriodNote(selectedScenario)}
                  </ul>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 space-y-3">
                  <h4 className="font-medium text-sm flex items-center">
                    <InfoIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Optimization Opportunities
                  </h4>
                  <ul className="text-sm space-y-2 list-disc pl-5">
                    {getTaxOptimizationTips(selectedScenario, taxData)}
                  </ul>
                </div>

                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm">
                    <Calculator className="h-4 w-4 mr-2" />
                    Recalculate with Custom Inputs
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="py-4">
            {taxData && <TaxVisualization data={taxData} />}
          </TabsContent>

          <TabsContent value="federal" className="py-4">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Federal Tax Calculation
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">
                        Income Characterization
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2 mt-3">
                        <p className="text-sm text-muted-foreground">
                          Ordinary Income:
                        </p>
                        <p className="text-sm text-right">
                          $
                          {taxData?.federal?.ordinaryIncome?.toLocaleString() ||
                            0}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Short-Term Capital Gains:
                        </p>
                        <p className="text-sm text-right">
                          $
                          {taxData?.federal?.shortTermGains?.toLocaleString() ||
                            0}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Long-Term Capital Gains:
                        </p>
                        <p className="text-sm text-right">
                          $
                          {taxData?.federal?.longTermGains?.toLocaleString() ||
                            0}
                        </p>

                        <p className="text-sm font-medium">
                          Total Federal Tax:
                        </p>
                        <p className="text-sm font-medium text-right">
                          ${taxData?.federal?.federalTax?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Applied Tax Rates</h4>
                      <div className="grid grid-cols-2 gap-y-2 mt-3">
                        <p className="text-sm text-muted-foreground">
                          Federal Marginal Rate:
                        </p>
                        <p className="text-sm text-right">
                          {taxData?.assumptions?.federalRate
                            ? `${(
                                taxData.assumptions.federalRate * 100
                              ).toFixed(1)}%`
                            : "N/A"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Capital Gains Rate:
                        </p>
                        <p className="text-sm text-right">
                          {taxData?.assumptions?.capitalGainsRate
                            ? `${(
                                taxData.assumptions.capitalGainsRate * 100
                              ).toFixed(1)}%`
                            : "N/A"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Medicare Surtax:
                        </p>
                        <p className="text-sm text-right">
                          {taxData?.federal?.medicareSurtax
                            ? `${(taxData.federal.medicareSurtax * 100).toFixed(
                                1
                              )}%`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Tax Planning Implications
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium text-sm">
                        Holding Period Considerations
                      </h4>
                      <p className="mt-2 text-sm">
                        {getHoldingPeriodAdvice(selectedScenario)}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium text-sm">
                        Income Timing Strategies
                      </h4>
                      <p className="mt-2 text-sm">
                        {getIncomeTiming(selectedScenario, taxData)}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                      <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300">
                        Expert Insight
                      </h4>
                      <p className="mt-2 text-sm">
                        Consider spreading your equity transactions across
                        multiple tax years to avoid pushing yourself into a
                        higher tax bracket.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="state" className="py-4">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">State Tax Impact</h3>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">
                        State Tax Breakdown
                      </h4>
                      <div className="mt-3 space-y-2">
                        {taxData?.state?.stateBreakdown?.map((state, index) => (
                          <div key={index} className="flex justify-between">
                            <p className="text-sm">{state.stateCode}:</p>
                            <p className="text-sm">
                              ${state.stateTax?.toLocaleString()}
                            </p>
                          </div>
                        ))}

                        <div className="flex justify-between pt-2 border-t mt-2">
                          <p className="text-sm font-medium">
                            Total State Tax:
                          </p>
                          <p className="text-sm font-medium">
                            ${taxData?.state?.stateTax?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium text-sm">
                        Multi-State Considerations
                      </h4>
                      <p className="mt-2 text-sm">
                        {getMultiStateConsiderations(selectedScenario, taxData)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Alternative Minimum Tax (AMT)
                  </h3>

                  {taxData?.amt ? (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-sm">AMT Calculation</h4>
                        <div className="grid grid-cols-2 gap-y-2 mt-3">
                          <p className="text-sm text-muted-foreground">
                            AMT Income:
                          </p>
                          <p className="text-sm text-right">
                            ${taxData.amt.amtIncome?.toLocaleString() || 0}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Exemption Amount:
                          </p>
                          <p className="text-sm text-right">
                            ${taxData.amt.exemption?.toLocaleString() || 0}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            AMT Tax Due:
                          </p>
                          <p className="text-sm text-right">
                            ${taxData.amt.netAMTDue?.toLocaleString() || 0}
                          </p>

                          {taxData.amt.amtCredit > 0 && (
                            <>
                              <p className="text-sm text-muted-foreground">
                                AMT Credit Generated:
                              </p>
                              <p className="text-sm text-right text-green-600">
                                ${taxData.amt.amtCredit?.toLocaleString() || 0}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300">
                          AMT Strategies
                        </h4>
                        <ul className="mt-2 text-sm space-y-2 list-disc pl-5">
                          {getAMTStrategies(selectedScenario, taxData)}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm">
                        AMT does not apply to this scenario based on the
                        transaction type or amounts involved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Tax calculations for {taxYear} tax year based on current rates
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Helper functions for generating tax insights
function getTaxTreatmentType(scenario) {
  // Determine the type of tax treatment based on scenario properties
  if (scenario.iso_exercise) return "ISO exercise";
  if (scenario.nso_exercise) return "NSO exercise";
  if (scenario.rsu_vesting) return "RSU vesting";
  return "equity transaction";
}

function getIncomeType(scenario) {
  // Determine the income characterization
  if (scenario.iso_exercise)
    return "potential AMT income, but no regular taxable income until sale";
  if (scenario.nso_exercise)
    return "ordinary income equal to the spread between FMV and strike price";
  if (scenario.rsu_vesting)
    return "ordinary income equal to the full value of shares at vesting";
  return "taxable income based on transaction type";
}

function getTaxHoldingPeriodNote(scenario) {
  // Generate note about holding period implications
  if (scenario.iso_exercise) {
    return "Holding shares for 1 year after exercise and 2 years after grant date qualifies for long-term capital gains treatment on sale.";
  }
  if (scenario.nso_exercise) {
    return "Holding shares for 1 year after exercise qualifies for long-term capital gains treatment on any appreciation above the FMV at exercise.";
  }
  if (scenario.rsu_vesting) {
    return "Holding shares for 1 year after vesting qualifies for long-term capital gains treatment on any appreciation above the FMV at vesting.";
  }
  return "The holding period for favorable tax treatment depends on the type of equity.";
}

function getTaxOptimizationTips(scenario, taxData) {
  // Generate tax optimization tips based on scenario type and tax data
  const tips = [];

  if (scenario.iso_exercise && taxData?.amt?.netAMTDue > 0) {
    tips.push(
      "Consider exercising ISOs early in the calendar year to give more time for tax planning."
    );
    tips.push("Exercise ISOs in years with lower income to reduce AMT impact.");
    tips.push(
      "Consider a disqualifying disposition if you need liquidity and can't afford AMT."
    );
  }

  if (scenario.nso_exercise) {
    tips.push(
      "Exercise NSOs in years when your other income is lower to reduce overall tax rate."
    );
    tips.push(
      "Consider exercise-and-sell strategies to cover the tax liability from the exercise."
    );
  }

  if (scenario.rsu_vesting) {
    tips.push(
      "Set aside funds for tax withholding, as RSUs are taxed at vesting even without selling."
    );
    tips.push(
      "Consider selling enough shares at vesting to cover tax obligations."
    );
  }

  // Add general tips
  tips.push(
    "Consult with a tax professional for personalized advice based on your situation."
  );

  return tips;
}

function getHoldingPeriodAdvice(scenario) {
  // Generate holding period advice
  if (scenario.iso_exercise) {
    return "For ISO exercises, meeting the qualifying disposition requirements (holding for 1 year after exercise and 2 years after grant) allows any appreciation to be taxed at lower long-term capital gains rates. Consider these timelines in your selling strategy.";
  }
  if (scenario.nso_exercise) {
    return "For NSO exercises, any appreciation above the FMV at exercise will be taxed as capital gains. Holding for at least 1 year after exercise allows this appreciation to qualify for lower long-term capital gains rates.";
  }
  if (scenario.rsu_vesting) {
    return "For RSUs, you're taxed on the full value at vesting as ordinary income. Any appreciation after vesting can qualify for long-term capital gains rates if you hold the shares for at least 1 year.";
  }
  return "Strategic timing of equity sales based on holding periods can significantly impact your tax liability.";
}

function getIncomeTiming(scenario, taxData) {
  // Generate income timing advice
  const federalTax = taxData?.federal?.federalTax || 0;
  const isoExercise = scenario.iso_exercise;
  const highIncome = federalTax > 100000;

  if (isoExercise && highIncome) {
    return "Your ISO exercise could trigger significant AMT. Consider spreading exercises across multiple tax years or timing exercises in years with lower income to minimize AMT impact.";
  }
  if (isoExercise && !highIncome) {
    return "Your current income level allows for more flexibility with ISO exercises. Consider exercising more options now if you anticipate higher income in future years.";
  }
  if (!isoExercise && highIncome) {
    return "Given your high income level, consider deferring equity transactions to a future year with potentially lower income, if possible.";
  }
  return "Carefully timing your equity transactions within the tax year can help manage your overall tax burden.";
}

function getMultiStateConsiderations(scenario, taxData) {
  // Generate advice for multi-state scenarios
  const hasMultipleStates = taxData?.state?.stateBreakdown?.length > 1;

  if (hasMultipleStates) {
    return "Your equity income is allocated across multiple states. This can create complex tax reporting requirements. Consider consulting with a tax professional familiar with multi-state taxation.";
  }

  const stateCode = taxData?.state?.stateBreakdown?.[0]?.stateCode;

  if (stateCode === "California" || stateCode === "New York") {
    return `${stateCode} has high state tax rates that significantly impact equity transactions. If you're planning to relocate to a lower-tax state, timing your equity transactions accordingly could provide tax savings.`;
  }

  if (
    stateCode === "Texas" ||
    stateCode === "Washington" ||
    stateCode === "Florida"
  ) {
    return `${stateCode} does not impose state income tax, which is advantageous for equity transactions. Maintain clear documentation of your residency status to support this treatment.`;
  }

  return "State tax treatment of equity compensation varies significantly. Consider state tax implications when planning your equity strategy.";
}

function getAMTStrategies(scenario, taxData) {
  // Generate AMT strategies
  const amtLiability = taxData?.amt?.netAMTDue || 0;
  const amtCredit = taxData?.amt?.amtCredit || 0;
  const strategies = [];

  if (amtLiability > 50000) {
    strategies.push(
      "Your AMT exposure is substantial. Consider splitting your ISO exercises across multiple tax years."
    );
    strategies.push(
      "Work with a tax professional to develop a multi-year AMT minimization strategy."
    );
  } else if (amtLiability > 0) {
    strategies.push(
      "Your AMT liability is moderate. Consider exercising ISOs early in the year to have more time for tax planning."
    );
    strategies.push(
      "Track your AMT credit carryforward carefully to reclaim it in future years."
    );
  }

  if (amtCredit > 0) {
    strategies.push(
      `You'll generate an AMT credit of $${amtCredit.toLocaleString()} that can be used in future years when your regular tax exceeds your AMT.`
    );
  }

  if (strategies.length === 0) {
    strategies.push("No specific AMT strategies needed for this scenario.");
  }

  return strategies;
}

// Generate simulated tax data for visualization
function generateTaxAnalysisData(scenario, taxYear) {
  // This function would generate data for the tax visualization and analysis
  // In a real implementation, this would be a call to a tax calculation service

  // Extract values from scenario
  const grossProceeds = scenario.gross_proceeds || 0;
  const taxLiability = scenario.tax_liability || 0;
  const exerciseCost = scenario.exercise_cost || 0;
  const strikePrice = scenario.strike_price || 0;
  const sharePrice = scenario.exit_value || 0;
  const shares = scenario.shares_exercised || 0;

  // Determine if this is an ISO scenario (simplified logic)
  const isISO = strikePrice < sharePrice && shares > 0 && scenario.iso_exercise;

  // Calculate spread (simplified)
  const spread = (sharePrice - strikePrice) * shares;

  // Simplified tax calculations
  const federalRate = 0.35;
  const stateRate = 0.08;
  const capitalGainsRate = 0.15;
  const amtRate = 0.26;

  // Different tax treatments based on equity type
  if (isISO) {
    // ISOs are subject to AMT on exercise
    const federalTax = 0; // No regular income tax on exercise
    const stateTax = spread * stateRate * 0.5; // Some states tax ISO exercises

    // AMT calculation (simplified)
    const amtIncome = spread;
    const amtExemption = 75000; // Simplified
    const exemptionPhaseout = Math.max(0, (amtIncome - 1000000) * 0.25);
    const adjustedExemption = Math.max(0, amtExemption - exemptionPhaseout);
    const amtTaxableIncome = Math.max(0, amtIncome - adjustedExemption);
    const amtTax = amtTaxableIncome * amtRate;

    // AMT credit for future years
    const amtCredit = amtTax;

    return {
      totals: {
        totalIncome: spread,
        totalTax: amtTax + stateTax,
        effectiveRate: spread > 0 ? (amtTax + stateTax) / spread : 0,
        netProceeds: grossProceeds - taxLiability - exerciseCost,
      },
      federal: {
        federalTax: 0,
        ordinaryIncome: 0,
        shortTermGains: 0,
        longTermGains: 0,
        medicareSurtax: 0.0038,
      },
      state: {
        stateTax: stateTax,
        stateBreakdown: [
          { stateCode: "California", stateTax: stateTax, allocation: 1 },
        ],
      },
      amt: {
        amtIncome: amtIncome,
        exemption: adjustedExemption,
        netAMTDue: amtTax,
        amtCredit: amtCredit,
      },
      exerciseCost: exerciseCost,
      assumptions: {
        federalRate: federalRate,
        stateRate: stateRate,
        capitalGainsRate: capitalGainsRate,
        taxYear: taxYear,
      },
    };
  }

  // For non-ISO scenarios (NSOs or RSUs)
  else {
    const federalTax = spread * federalRate;
    const stateTax = spread * stateRate;
    const totalTax = federalTax + stateTax;

    return {
      totals: {
        totalIncome: spread,
        totalTax: totalTax,
        effectiveRate: spread > 0 ? totalTax / spread : 0,
        netProceeds: grossProceeds - taxLiability - exerciseCost,
      },
      federal: {
        federalTax: federalTax,
        ordinaryIncome: spread,
        shortTermGains: 0,
        longTermGains: 0,
        medicareSurtax: 0.0038,
      },
      state: {
        stateTax: stateTax,
        stateBreakdown: [
          { stateCode: "California", stateTax: stateTax, allocation: 1 },
        ],
      },
      amt: null, // No AMT implications
      exerciseCost: exerciseCost,
      assumptions: {
        federalRate: federalRate,
        stateRate: stateRate,
        capitalGainsRate: capitalGainsRate,
        taxYear: taxYear,
      },
    };
  }
}
