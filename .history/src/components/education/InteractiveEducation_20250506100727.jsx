// Create src/components/education/InteractiveEducation.jsx

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
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateVestedShares,
  calculateExerciseCost,
  calculateTaxes,
} from "@/utils/calculations";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function InteractiveEducation() {
  const [scenario, setScenario] = useState({
    grantType: "ISO",
    shares: 1000,
    strikePrice: 1.0,
    currentFMV: 5.0,
    exerciseDate: new Date(),
    exitPrice: 20.0,
    exitDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
    vestingStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    vestingEnd: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years from now
  });

  const [results, setResults] = useState(null);

  // Update results when scenario changes
  const updateResults = () => {
    // Calculate vested shares
    const vestedShares = calculateVestedShares({
      shares: scenario.shares,
      vesting_start_date: scenario.vestingStart,
      vesting_end_date: scenario.vestingEnd,
      vesting_cliff_date: new Date(
        scenario.vestingStart.getTime() + 365 * 24 * 60 * 60 * 1000
      ),
    });

    // Calculate exercise cost
    const exerciseCost = calculateExerciseCost(
      vestedShares,
      scenario.strikePrice
    );

    // Calculate tax implications
    const isLongTerm =
      scenario.exitDate - scenario.exerciseDate >= 365 * 24 * 60 * 60 * 1000;
    const taxResults = calculateTaxes(
      {
        grant_type: scenario.grantType,
        strike_price: scenario.strikePrice,
        current_fmv: scenario.currentFMV,
        shares: vestedShares,
      },
      scenario.strikePrice,
      scenario.exitPrice,
      vestedShares,
      isLongTerm
    );

    // Calculate proceeds
    const grossProceeds = vestedShares * scenario.exitPrice;
    const netProceeds = grossProceeds - exerciseCost - taxResults.total_tax;

    setResults({
      vestedShares,
      exerciseCost,
      taxResults,
      grossProceeds,
      netProceeds,
      isLongTerm,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Equity Learning</CardTitle>
        <CardDescription>
          Adjust the parameters to see how they affect your equity outcomes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="parameters">
          <TabsList>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="space-y-4">
            {/* Input parameters UI */}
            <div className="grid grid-cols-2 gap-4">
              {/* Grant type selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Grant Type</label>
                <select
                  value={scenario.grantType}
                  onChange={(e) =>
                    setScenario({ ...scenario, grantType: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="ISO">ISO</option>
                  <option value="NSO">NSO</option>
                  <option value="RSU">RSU</option>
                </select>
              </div>

              {/* Number of shares */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Shares</label>
                <Input
                  type="number"
                  value={scenario.shares}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      shares: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              {/* More input fields for other parameters */}
              {/* ... */}
            </div>

            <Button onClick={updateResults}>Update Results</Button>
          </TabsContent>

          <TabsContent value="visualization">
            {results && (
              <div className="space-y-6">
                {/* Tax impact visualization */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Tax Impact</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Exercise Cost",
                            value: results.exerciseCost,
                          },
                          {
                            name: "Federal Tax",
                            value: results.taxResults.federal_tax,
                          },
                          {
                            name: "State Tax",
                            value: results.taxResults.state_tax,
                          },
                          {
                            name: "AMT",
                            value: results.taxResults.amt_liability,
                          },
                          { name: "Net Proceeds", value: results.netProceeds },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `$${value.toLocaleString()}`,
                            "",
                          ]}
                        />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Vesting schedule visualization */}
                {/* ... */}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explanation">
            {results && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">What This Means</h3>
                  <p>
                    Based on your parameters, you would have{" "}
                    {results.vestedShares.toLocaleString()} vested shares worth
                    $
                    {(
                      results.vestedShares * scenario.currentFMV
                    ).toLocaleString()}{" "}
                    at the current FMV.
                  </p>
                  <p className="mt-2">
                    If you exercise now and sell at the specified exit price,
                    you would pay:
                  </p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>
                      ${results.exerciseCost.toLocaleString()} to exercise your
                      options
                    </li>
                    <li>
                      ${results.taxResults.total_tax.toLocaleString()} in total
                      taxes
                    </li>
                    <li>
                      And receive ${results.netProceeds.toLocaleString()} in net
                      proceeds
                    </li>
                  </ul>
                  <p className="mt-2">
                    <strong>Key Insight:</strong>{" "}
                    {results.isLongTerm
                      ? "You would qualify for long-term capital gains treatment, which typically results in lower taxes."
                      : "You would not qualify for long-term capital gains treatment, which could result in higher taxes."}
                  </p>
                </div>

                {/* Show different tax explanations based on the grant type */}
                {scenario.grantType === "ISO" && (
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">
                      ISO Tax Considerations
                    </h3>
                    <p>
                      ISOs offer potential tax advantages, but come with AMT
                      implications:
                    </p>
                    <ul className="list-disc pl-5">
                      <li>No regular tax at exercise (but may trigger AMT)</li>
                      <li>
                        Long-term capital gains if held for >1 year after
                        exercise and >2 years after grant
                      </li>
                      <li>
                        AMT liability in this scenario: $
                        {results.taxResults.amt_liability.toLocaleString()}
                      </li>
                    </ul>
                  </div>
                )}

                {/* Similar explanations for NSOs and RSUs */}
                {/* ... */}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
