"use client";

import { useState, useEffect } from "react";
import { useGrants } from "@/hooks/useGrants";
import { useCalculator } from "@/hooks/useCalculator";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { EnhancedTaxCalculator } from "@/components/tax/EnhancedTaxCalculator";
import { TaxVisualization } from "@/components/tax/TaxVisualization";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import AuthLoading from "@/components/auth/AuthLoading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle, ArrowRight } from "lucide-react";
import { getTaxConfig } from "@/utils/taxConfig";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { calculateVestedShares } from "@/utils/calculations";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Helper function for date comparison
const isAfter = (date1, date2) => {
  return new Date(date1) > new Date(date2);
};

// Helper to check for long-term capital gains eligibility
const isLongTermEligible = (exerciseDate, saleDate, grantType) => {
  const exerciseDateObj = new Date(exerciseDate);
  const saleDateObj = new Date(saleDate);
  const dayDiff = Math.floor((saleDateObj - exerciseDateObj) / (1000 * 60 * 60 * 24));
  
  return dayDiff >= 365;
};

export default function TaxCalculatorPage() {
  const { grants, loading: grantsLoading } = useGrants();
  const { financialProfile, isLoading: profileLoading } = useFinancialProfile();
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
    filingStatus: "single",
    state: "California",
    isMultiState: false,
    stateData: [],
    includeAMT: true,
    includeNIIT: true,
    priorAMTCredits: 0,
  });
  const [exitPrice, setExitPrice] = useState(0);
  const [sharesToExercise, setSharesToExercise] = useState(0);
  const [scenarioOptions, setScenarioOptions] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [exitScenarios, setExitScenarios] = useState([
    { id: "conservative", name: "Conservative (2x)", multiplier: 2 },
    { id: "moderate", name: "Moderate (5x)", multiplier: 5 },
    { id: "optimistic", name: "Optimistic (10x)", multiplier: 10 }
  ]);
  const [selectedExitScenario, setSelectedExitScenario] = useState(null);
  const [isLongTerm, setIsLongTerm] = useState(true);
  const [showTaxTips, setShowTaxTips] = useState(false);

  // Calculate long-term status when dates change
  useEffect(() => {
    if (selectedGrant) {
      const longTerm = isLongTermEligible(
        taxSettings.exerciseDate,
        taxSettings.saleDate,
        selectedGrant.grant_type
      );
      setIsLongTerm(longTerm);
    }
  }, [taxSettings.exerciseDate, taxSettings.saleDate, selectedGrant]);

  // Apply financial profile data when available
  useEffect(() => {
    if (financialProfile) {
      setTaxSettings(prev => ({
        ...prev,
        otherIncome: financialProfile.income || prev.otherIncome,
        filingStatus: financialProfile.filingStatus || prev.filingStatus,
        state: financialProfile.state || prev.state,
      }));
    }
  }, [financialProfile]);

  // When selected grant changes, update related states
  useEffect(() => {
    if (selectedGrantId && grants.length > 0) {
      const grant = grants.find((g) => g.id === selectedGrantId);
      if (grant) {
        setSelectedGrant(grant);
        setSharesToExercise(calculateVestedShares(grant));
        setExitPrice(grant.current_fmv * 2); // Default to 2x current FMV
        
        // Reset exit scenario selection
        setSelectedExitScenario(exitScenarios[0]);
      }
    }
  }, [selectedGrantId, grants]);

  // Set exit price when scenario changes
  useEffect(() => {
    if (selectedGrant && selectedExitScenario) {
      setExitPrice(selectedGrant.current_fmv * selectedExitScenario.multiplier);
    }
  }, [selectedExitScenario, selectedGrant]);

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

  // Helper function to calculate exercise cost
  const calculateExerciseCost = () => {
    if (!selectedGrant) return 0;
    return selectedGrant.strike_price * sharesToExercise;
  };

  // Helper function to calculate AMT risk
  const calculateAMTRisk = () => {
    if (!selectedGrant || selectedGrant.grant_type !== "ISO") return "none";
    
    const spread = (selectedGrant.current_fmv - selectedGrant.strike_price) * sharesToExercise;
    const amtIncome = taxSettings.otherIncome + spread;
    
    if (amtIncome > 200000) {
      return spread > 100000 ? "high" : "medium";
    }
    
    return spread > 50000 ? "medium" : "low";
  };

  const getTaxBenefit = () => {
    if (!selectedGrant) return { hasAdvantage: false, message: "" };
    
    if (selectedGrant.grant_type === "ISO" && isLongTerm) {
      return { 
        hasAdvantage: true, 
        message: "Holding for at least 1 year after exercise may qualify for long-term capital gains rates." 
      };
    } else if (selectedGrant.grant_type === "ISO" && !isLongTerm) {
      return { 
        hasAdvantage: false, 
        message: "Consider holding for at least 1 year after exercise to qualify for long-term capital gains treatment." 
      };
    }
    
    return { hasAdvantage: false, message: "" };
  };

  if (grantsLoading || profileLoading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Advanced Tax Calculator"
        text="Model the comprehensive tax impact of exercising and selling your equity"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/calculator"}
            size="sm"
          >
            Basic Calculator
          </Button>
          <Button
            variant="outline" 
            onClick={() => window.location.href = "/dashboard/calculator/unified"}
            size="sm"
          >
            Unified Calculator
          </Button>
        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="exitPrice">Exit Price ($)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80 text-sm">
                                  The expected price per share when you sell your equity. 
                                  This could be at IPO, acquisition, or secondary sale.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="exitPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={exitPrice}
                          onChange={(e) =>
                            setExitPrice(parseFloat(e.target.value) || 0)
                          }
                        />
                        
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {exitScenarios.map(scenario => (
                            <Button 
                              key={scenario.id}
                              variant={selectedExitScenario?.id === scenario.id ? "default" : "outline"}
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setSelectedExitScenario(scenario)}
                            >
                              {scenario.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="sharesToExercise">Shares to Exercise</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80 text-sm">
                                  Number of shares you plan to exercise. For options like ISOs and NSOs, 
                                  this is the number you'll purchase. For RSUs, this represents the shares vesting.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="sharesToExercise"
                          type="number"
                          min="0"
                          max={selectedGrant.shares}
                          value={sharesToExercise}
                          onChange={(e) =>
                            setSharesToExercise(parseInt(e.target.value) || 0)
                          }
                        />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                          <span>Exercise cost: ${calculateExerciseCost().toLocaleString()}</span>
                          <span>{((sharesToExercise / selectedGrant.shares) * 100).toFixed(1)}% of grant</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <Tabs defaultValue="basic">
                      <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                        <TabsTrigger value="advanced">
                          Advanced Settings
                        </TabsTrigger>
                        <TabsTrigger value="scenarios">
                          Scenarios
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="exerciseDate">Exercise Date</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-80 text-sm">
                                      The date you plan to exercise your options. For ISOs, 
                                      this starts the clock for qualifying disposition (long-term capital gains).
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              id="exerciseDate"
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
                            <div className="flex justify-between">
                              <Label htmlFor="saleDate">Sale Date</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-80 text-sm">
                                      The date you plan to sell your shares. Holding for at least 1 year 
                                      after exercise may qualify for long-term capital gains rates.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              id="saleDate"
                              type="date"
                              value={taxSettings.saleDate}
                              onChange={(e) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  saleDate: e.target.value,
                                })
                              }
                            />
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs">
                                Holding period: {Math.floor((new Date(taxSettings.saleDate) - new Date(taxSettings.exerciseDate)) / (1000 * 60 * 60 * 24))} days
                              </span>
                              {isLongTerm ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                                  Long-term eligible
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">
                                  Short-term
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="federalRate">Federal Tax Rate (%)</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-80 text-sm">
                                      Your marginal federal income tax rate. This impacts ordinary income tax 
                                      on NSOs and RSUs, as well as short-term capital gains.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              id="federalRate"
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
                            <div className="flex justify-between">
                              <Label htmlFor="stateRate">State Tax Rate (%)</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-80 text-sm">
                                      Your state income tax rate. Some states have no income tax, 
                                      while others like California can have rates exceeding 13%.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              id="stateRate"
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
                            <div className="flex justify-between">
                              <Label htmlFor="capitalGainsRate">Capital Gains Rate (%)</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-80 text-sm">
                                      Long-term capital gains tax rate applied to qualifying 
                                      dispositions (typically 15% for most taxpayers).
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              id="capitalGainsRate"
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
                            <div className="flex justify-between">
                              <Label htmlFor="otherIncome">Other Income ($)</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-80 text-sm">
                                      Your annual income from other sources like salary, bonus, etc. 
                                      This affects your tax brackets and AMT exposure.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              id="otherIncome"
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="filingStatus">Filing Status</Label>
                            <Select
                              id="filingStatus"
                              value={taxSettings.filingStatus}
                              onValueChange={(value) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  filingStatus: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose filing status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
                                <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                                <SelectItem value="head_household">Head of Household</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State of Residence</Label>
                            <Select
                              id="state"
                              value={taxSettings.state}
                              onValueChange={(value) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  state: value,
                                  stateRate: value === "California" ? 0.133 : 
                                             value === "New York" ? 0.107 :
                                             value === "Texas" || value === "Washington" || value === "Florida" ? 0 : 0.05
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose state" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="California">California</SelectItem>
                                <SelectItem value="New York">New York</SelectItem>
                                <SelectItem value="Texas">Texas</SelectItem>
                                <SelectItem value="Washington">Washington</SelectItem>
                                <SelectItem value="Florida">Florida</SelectItem>
                                <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includeAMT"
                              checked={taxSettings.includeAMT}
                              onCheckedChange={(checked) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  includeAMT: checked,
                                })
                              }
                            />
                            <Label htmlFor="includeAMT">
                              Include AMT calculations
                            </Label>
                          </div>
                          
                          {selectedGrant?.grant_type === "ISO" && taxSettings.includeAMT && (
                            <div className="mt-2 pl-6">
                              <div className="space-y-2">
                                <Label htmlFor="priorAMTCredits">Prior Year AMT Credits ($)</Label>
                                <Input
                                  id="priorAMTCredits"
                                  type="number"
                                  min="0"
                                  value={taxSettings.priorAMTCredits}
                                  onChange={(e) =>
                                    setTaxSettings({
                                      ...taxSettings,
                                      priorAMTCredits: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                              id="includeNIIT"
                              checked={taxSettings.includeNIIT}
                              onCheckedChange={(checked) =>
                                setTaxSettings({
                                  ...taxSettings,
                                  includeNIIT: checked,
                                })
                              }
                            />
                            <Label htmlFor="includeNIIT">
                              Include Net Investment Income Tax (3.8%)
                            </Label>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="multiState"
                            checked={taxSettings.isMultiState}
                            onCheckedChange={(checked) =>
                              setTaxSettings({
                                ...taxSettings,
                                isMultiState: checked,
                              })
                            }
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
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div className="text-sm font-medium">State</div>
                              <div className="text-sm font-medium">Allocation (%)</div>
                              
                              {/* California (primary) */}
                              <div>California</div>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={75}
                                disabled
                                className="h-8"
                              />
                              
                              {/* New York (secondary) */}
                              <div>New York</div>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={25}
                                disabled
                                className="h-8"
                              />
                            </div>
                            <Button size="sm" variant="outline" disabled>Add State</Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              Multi-state calculation is available in the
                              premium version.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="scenarios" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Compare Tax Strategies</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a strategy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exercise_now_sell_later">Exercise Now, Sell in 1+ Years</SelectItem>
                                <SelectItem value="exercise_and_sell">Exercise and Sell Immediately</SelectItem>
                                <SelectItem value="exercise_in_stages">Exercise in Stages Over Multiple Years</SelectItem>
                                <SelectItem value="wait_for_liquidity">Wait for Liquidity Event</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Compare Exit Values</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exit scenario" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="downside">Downside (0.5x current)</SelectItem>
                                <SelectItem value="conservative">Conservative (2x current)</SelectItem>
                                <SelectItem value="moderate">Moderate (5x current)</SelectItem>
                                <SelectItem value="optimistic">Optimistic (10x current)</SelectItem>
                                <SelectItem value="home_run">Home Run (20x current)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button variant="outline" disabled>Run Scenario Comparison</Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Scenario comparison is available in the premium version.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col gap-4">
              <Button
                onClick={handleCalculate}
                disabled={!selectedGrant || calculationLoading}
                className="w-full"
              >
                {calculationLoading ? "Calculating..." : "Calculate Tax Impact"}
              </Button>
              
              {selectedGrant?.grant_type === "ISO" && calculateAMTRisk() !== "none" && (
                <Alert className={
                  calculateAMTRisk() === "high" ? "bg-red-50 border-red-200 text-red-800" :
                  calculateAMTRisk() === "medium" ? "bg-amber-50 border-amber-200 text-amber-800" :
                  "bg-blue-50 border-blue-200 text-blue-800"
                }>
                  <AlertCircle className={
                    calculateAMTRisk() === "high" ? "text-red-600" :
                    calculateAMTRisk() === "medium" ? "text-amber-600" :
                    "text-blue-600"
                  } />
                  <AlertTitle className="text-sm font-medium">
                    {calculateAMTRisk() === "high" ? "High AMT Risk" :
                     calculateAMTRisk() === "medium" ? "Moderate AMT Risk" :
                     "AMT Consideration"}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {calculateAMTRisk() === "high" 
                      ? "This transaction may trigger significant AMT liability. Consider exercising in stages across multiple tax years."
                      : calculateAMTRisk() === "medium"
                      ? "Be aware of potential AMT implications. Consider consulting a tax professional."
                      : "This transaction has some AMT exposure. Review the detailed results carefully."
                    }
                  </AlertDescription>
                </Alert>
              )}
              
              {getTaxBenefit().message && (
                <Alert className={getTaxBenefit().hasAdvantage ? "bg-green-50 border-green-200 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"}>
                  <InfoIcon className={getTaxBenefit().hasAdvantage ? "text-green-600" : "text-blue-600"} />
                  <AlertDescription className="text-xs">
                    {getTaxBenefit().message}
                  </AlertDescription>
                </Alert>
              )}
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
                  
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="px-0"
                    onClick={() => setShowTaxTips(!showTaxTips)}
                  >
                    {showTaxTips ? "Hide Tax Tips" : "Show Tax Tips"}
                  </Button>
                  
                  {showTaxTips && (
                    <div className="bg-muted p-4 rounded-md text-sm space-y-3">
                      <h4 className="font-medium">Tax Optimization Tips</h4>
                      
                      {selectedGrant?.grant_type === "ISO" && (
                        <div className="flex gap-2">
                          <div className="h-5 w-5 text-primary rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs">1</span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Consider exercising ISOs early in the calendar year to maximize time for 
                            long-term capital gains qualification while minimizing AMT holding risk.
                          </p>
                        </div>
                      )}
                      
                      {calculationResults.amt?.netAMTDue > 5000 && (
                        <div className="flex gap-2">
                          <div className="h-5 w-5 text-primary rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs">2</span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Your AMT impact is significant (${calculationResults.amt.netAMTDue.toLocaleString()}). 
                            Consider spreading exercises across multiple tax years to reduce AMT exposure.
                          </p>
                        </div>
                      )}
                      
                      {calculationResults.totals?.effectiveRate > 0.3 && (
                        <div className="flex gap-2">
                          <div className="h-5 w-5 text-primary rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs">3</span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Your effective tax rate is high ({(calculationResults.totals.effectiveRate * 100).toFixed(1)}%). 
                            Holding for long-term capital gains treatment could significantly reduce your tax burden.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
          
          {/* Educational panel */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Understanding Equity Taxation</CardTitle>
              <CardDescription>
                Key concepts to help you navigate tax implications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Grant Type Tax Treatment</h4>
                <div className="text-sm space-y-1.5">
                  <p><strong>ISOs:</strong> No ordinary income at exercise, but may trigger AMT. Qualifying sales (1+ year after exercise, 2+ years after grant) eligible for long-term capital gains.</p>
                  <p><strong>NSOs:</strong> Ordinary income on the spread at exercise. Capital gains/losses on subsequent appreciation/depreciation.</p>
                  <p><strong>RSUs:</strong> Ordinary income at vesting based on FMV. Capital gains/losses on subsequent appreciation/depreciation.</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Alternative Minimum Tax (AMT)</h4>
                <p className="text-sm text-muted-foreground">
                  AMT is a parallel tax system that ensures taxpayers pay a minimum amount of tax. 
                  Exercising ISOs can trigger AMT because the spread (FMV - strike price) is considered 
                  income for AMT purposes but not for regular tax. This can result in a surprising tax bill.
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Short-term gains rate:</div>
                <div>Same as ordinary income (10% to 37%)</div>
                
                <div className="text-muted-foreground">Long-term gains rate:</div>
                <div>0%, 15%, or 20% (based on income)</div>
                
                <div className="text-muted-foreground">NIIT:</div>
                <div>3.8% on investment income above thresholds</div>
                
                <div className="text-muted-foreground">AMT rate:</div>
                <div>26% or 28% with exemption phase-outs</div>
              </div>
              
              <div className="pt-4">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/education">
                    Learn More About Equity Taxation
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}