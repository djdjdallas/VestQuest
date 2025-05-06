"use client";

import { useState, useEffect } from "react";
import { useGrants } from "@/hooks/useGrants";
import { useCalculator } from "@/hooks/useCalculator";
import { EnhancedTaxCalculator } from "@/components/tax/EnhancedTaxCalculator";
import { TaxVisualization } from "@/components/tax/TaxVisualization";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import AuthLoading from "@/components/auth/AuthLoading";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { calculateVestedShares } from "@/utils/calculations";

export default function TaxCalculatorPage() {
  const { grants, loading: grantsLoading } = useGrants();
  const {
    calculationResults,
    calculateTax,
    isLoading: calculationLoading,
  } = useCalculator();

  const [selectedGrantId, setSelectedGrantId] = useState("");
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [taxSettings, setTaxSettings] = useState({
    exerciseDate: new Date().toISOString().split("T")[0],
    saleDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    federalRate: 0.32,
    stateRate: 0.1,
    capitalGainsRate: 0.15,
    otherIncome: 150000,
    isMultiState: false,
    stateData: [],
  });
  const [exitPrice, setExitPrice] = useState(0);
  const [sharesToExercise, setSharesToExercise] = useState(0);

  // When selected grant changes, update related states
  useEffect(() => {
    if (selectedGrantId && grants.length > 0) {
      const grant = grants.find((g) => g.id === selectedGrantId);
      if (grant) {
        setSelectedGrant(grant);
        setSharesToExercise(calculateVestedShares(grant));
        setExitPrice(grant.current_fmv * 2); // Default to 2x current FMV
      }
    }
  }, [selectedGrantId, grants]);

  // Handle Tax Calculation
  const handleCalculate = () => {
    if (!selectedGrant) return;

    calculateTax(
      selectedGrant,
      selectedGrant.strike_price,
      exitPrice,
      sharesToExercise,
      taxSettings
    );
  };

  if (grantsLoading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Advanced Tax Calculator"
        text="Model the comprehensive tax impact of exercising and selling your equity"
      >
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/calculator")}
        >
          Back to Calculator
        </Button>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculator Inputs</CardTitle>
              <CardDescription>
                Configure the parameters for your tax calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Equity Grant</Label>
                  <Select
                    value={selectedGrantId}
                    onValueChange={setSelectedGrantId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a grant" />
                    </SelectTrigger>
                    <SelectContent>
                      {grants.map((grant) => (
                        <SelectItem key={grant.id} value={grant.id}>
                          {grant.company_name} - {grant.grant_type} (
                          {grant.shares.toLocaleString()} shares)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGrant && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Exit Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exitPrice}
                          onChange={(e) =>
                            setExitPrice(parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Shares to Exercise</Label>
                        <Input
                          type="number"
                          min="0"
                          max={selectedGrant.shares}
                          value={sharesToExercise}
                          onChange={(e) =>
                            setSharesToExercise(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <Tabs defaultValue="basic">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                        <TabsTrigger value="advanced">
                          Advanced Settings
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Exercise Date</Label>
                            <Input
                              type="date"
                              value={taxSettings.exerciseDate}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  exerciseDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Sale Date</Label>
                            <Input
                              type="date"
                              value={taxSettings.saleDate}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  saleDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Federal Tax Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={taxSettings.federalRate * 100}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  federalRate:
                                    parseFloat(e.target.value) / 100 || 0,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>State Tax Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={taxSettings.stateRate * 100}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  stateRate:
                                    parseFloat(e.target.value) / 100 || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="advanced" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Capital Gains Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={taxSettings.capitalGainsRate * 100}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  capitalGainsRate:
                                    parseFloat(e.target.value) / 100 || 0,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Other Income ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={taxSettings.otherIncome}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  otherIncome: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="multiState"
                            checked={taxSettings.isMultiState}
                            onChange={(e) =>
                              setTaxSettings({
                                ...taxSettings,
                                isMultiState: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="multiState">
                            Multi-State Tax Calculation
                          </Label>
                        </div>

                        {taxSettings.isMultiState && (
                          <div className="border rounded-md p-4 bg-muted/20">
                            <p className="text-sm mb-2">
                              Add states where you've lived or worked during the
                              grant period.
                            </p>
                            {/* State selection UI would go here */}
                            <p className="text-xs text-muted-foreground">
                              Multi-state calculation is available in the
                              premium version.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button
                onClick={handleCalculate}
                disabled={!selectedGrant || calculationLoading}
                className="w-full"
              >
                {calculationLoading ? "Calculating..." : "Calculate Tax Impact"}
              </Button>
            </CardFooter>
          </Card>

          {calculationResults && (
            <Card>
              <CardHeader>
                <CardTitle>Key Results</CardTitle>
                <CardDescription>
                  Summary of tax calculation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <p className="text-sm text-muted-foreground">Total Tax</p>
                      <p className="text-2xl font-bold">
                        $
                        {calculationResults.totals?.totalTax?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                    <div className="border rounded-md p-4">
                      <p className="text-sm text-muted-foreground">
                        Effective Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {(
                          (calculationResults.totals?.effectiveRate || 0) * 100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Federal Tax
                      </p>
                      <p className="font-medium">
                        $
                        {calculationResults.federal?.federalTax?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AMT</p>
                      <p className="font-medium">
                        $
                        {calculationResults.amt?.netAMTDue?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">State Tax</p>
                      <p className="font-medium">
                        $
                        {calculationResults.state?.stateTax?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {calculationResults ? (
            <TaxVisualization data={calculationResults} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-medium">
                    No Tax Calculation Yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Select an equity grant and configure the tax parameters,
                    then click "Calculate Tax Impact" to see a detailed
                    visualization of the tax implications.
                  </p>
                  {!selectedGrant && (
                    <p className="text-sm text-primary">
                      Start by selecting an equity grant from the dropdown on
                      the left.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
