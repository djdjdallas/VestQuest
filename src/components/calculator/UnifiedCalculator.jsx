"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  Calculator,
  Info,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Percent,
  BookOpen,
  BarChart3,
  Download,
  Share2,
  Save,
  AlertCircle,
  CheckCircle2,
  InfoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMON_SCENARIOS, GRANT_TYPES, TAX_RATES } from "@/utils/constants";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { calculateComprehensiveTax, calculateDecisionFactors } from "@/utils/calculations";
import { Checkbox } from "@/components/ui/checkbox";

// Enhanced tooltip component with educational content
const EducationalTooltip = ({ children, title, content }) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center cursor-help">
        {children} <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground" />
      </span>
    </TooltipTrigger>
    <TooltipContent side="right" className="w-80 p-4">
      <div className="space-y-2">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
    </TooltipContent>
  </Tooltip>
);

// Scenario button component
const ScenarioButton = ({ name, description, onClick, isActive }) => (
  <Button
    variant={isActive ? "default" : "outline"}
    size="sm"
    onClick={onClick}
    className={cn(
      "flex flex-col items-start h-auto p-3 space-y-1 transition-all",
      isActive ? "border-primary bg-primary/10 text-primary" : ""
    )}
  >
    <span className="font-medium">{name}</span>
    <span className="text-xs text-muted-foreground">{description}</span>
  </Button>
);

// Tax breakdown chart component
const TaxBreakdownChart = ({ data }) => {
  const taxData = [
    { name: "Federal Ordinary", value: data.federal?.ordinaryTax || 0 },
    { name: "Federal Capital Gains", value: data.federal?.capitalGainsTax || 0 },
    { name: "AMT", value: data.amt?.netAMTDue || 0 },
    { name: "State", value: data.state?.stateTax || 0 },
  ].filter(item => item.value > 0);

  if (taxData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No tax liability
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={taxData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {taxData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Outcome visualization component
const OutcomeVisualization = ({
  grantType,
  shares,
  strikePrice,
  currentFMV,
  exitValues,
  taxSettings,
}) => {
  // Generate data points for different exit values
  const data = exitValues.map(exitValue => {
    const result = calculateComprehensiveTax(
      {
        grant_type: grantType,
        shares: shares,
        strike_price: strikePrice,
        current_fmv: currentFMV,
      },
      strikePrice,
      exitValue,
      shares,
      taxSettings.isLongTerm,
      {
        federalRate: taxSettings.federalRate,
        stateRate: taxSettings.stateRate,
        filingStatus: taxSettings.filingStatus,
        income: taxSettings.otherIncome,
      }
    );

    return {
      exitValue,
      netProceeds: result.totals?.netProceeds || 0,
      totalTax: result.totals?.totalTax || 0,
      exerciseCost: shares * strikePrice,
    };
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="exitValue" 
            tickFormatter={(value) => `$${value}`}
            label={{ 
              value: "Exit Price", 
              position: "insideBottom", 
              offset: -5 
            }}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <RechartsTooltip 
            formatter={(value) => formatCurrency(value)}
            labelFormatter={(value) => `Exit Price: $${value}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="netProceeds"
            name="Net Proceeds"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.2}
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="totalTax"
            name="Tax Liability"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="exerciseCost"
            name="Exercise Cost"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Decision factors visual
const DecisionFactorsVisual = ({ factors }) => {
  if (!factors) return null;

  // Calculate overall score (weighted average)
  const overallScore = (
    factors.financialCapacity * 0.3 +
    factors.companyOutlook * 0.3 +
    factors.taxEfficiency * 0.2 +
    factors.timing * 0.2
  ) * 100;

  return (
    <div className="space-y-4">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
              Exercise Opportunity Score
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block">
              {overallScore.toFixed(0)}/100
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200">
          <div
            style={{ width: `${overallScore}%` }}
            className={cn(
              "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all",
              overallScore >= 70
                ? "bg-green-500"
                : overallScore >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            )}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Financial Capacity", score: factors.financialCapacity * 100 },
          { name: "Company Outlook", score: factors.companyOutlook * 100 },
          { name: "Tax Efficiency", score: factors.taxEfficiency * 100 },
          { name: "Timing", score: factors.timing * 100 }
        ].map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-medium">{item.score.toFixed(0)}/100</span>
            </div>
            <div className="overflow-hidden h-1.5 rounded-full bg-gray-200">
              <div
                style={{ width: `${item.score}%` }}
                className={cn(
                  "h-full transition-all",
                  item.score >= 70
                    ? "bg-green-500"
                    : item.score >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function UnifiedCalculator() {
  // State for calculator mode
  const [calculatorMode, setCalculatorMode] = useState("basic"); // basic, advanced, expert
  
  // Basic inputs with sensible defaults
  const [grantType, setGrantType] = useState("ISO");
  const [shares, setShares] = useState(10000);
  const [strikePrice, setStrikePrice] = useState(1.0);
  const [currentFMV, setCurrentFMV] = useState(5.0);
  const [exitPrice, setExitPrice] = useState(25.0);
  const [activeScenario, setActiveScenario] = useState(null);
  const [percentageToExercise, setPercentageToExercise] = useState(100);
  
  // Advanced inputs
  const [exerciseDate, setExerciseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exitDate, setExitDate] = useState(
    new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [filingStatus, setFilingStatus] = useState("single");
  const [stateOfResidence, setStateOfResidence] = useState("California");
  const [otherIncome, setOtherIncome] = useState(150000);
  
  // Expert inputs
  const [companyStage, setCompanyStage] = useState("growth");
  const [growthRate, setGrowthRate] = useState(30);
  const [financingHistory, setFinancingHistory] = useState("moderate");
  const [availableCash, setAvailableCash] = useState(50000);
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [showMultiState, setShowMultiState] = useState(false);
  const [stateAllocation, setStateAllocation] = useState({
    California: 100,
  });
  
  // Derived state
  const [sharesToExercise, setSharesToExercise] = useState(shares);
  
  // Tax settings
  const [taxSettings, setTaxSettings] = useState({
    federalRate: 0.35,
    stateRate: 0.1,
    isLongTerm: true,
    filingStatus: "single",
    otherIncome: 150000,
    includeAMT: true,
    includeMedicareNIIT: true,
  });
  
  // Results state
  const [result, setResult] = useState(null);
  const [decisionFactors, setDecisionFactors] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Update shares to exercise when total shares or percentage changes
  useEffect(() => {
    setSharesToExercise(Math.floor(shares * (percentageToExercise / 100)));
  }, [shares, percentageToExercise]);
  
  // Update tax settings when related inputs change
  useEffect(() => {
    const holdingPeriod = calculateHoldingPeriod();
    setTaxSettings((prev) => ({
      ...prev,
      isLongTerm: holdingPeriod >= 365,
      filingStatus,
      otherIncome,
    }));
  }, [filingStatus, otherIncome, exerciseDate, exitDate]);
  
  // Generate exit values for visualization
  const generateExitValues = () => {
    const baseValue = currentFMV || 1;
    return [
      baseValue * 0.5,
      baseValue,
      baseValue * 2,
      baseValue * 5,
      baseValue * 10,
      baseValue * 20,
    ];
  };
  
  // Calculate holding period in days
  const calculateHoldingPeriod = () => {
    const exercise = new Date(exerciseDate);
    const exit = new Date(exitDate);
    return Math.floor((exit - exercise) / (1000 * 60 * 60 * 24));
  };
  
  // Load predefined scenario
  const loadScenario = (name, multiplier) => {
    setExitPrice(currentFMV * multiplier);
    setActiveScenario(name);
  };
  
  // Handle state allocation change
  const handleStateAllocationChange = (state, value) => {
    setStateAllocation(prev => ({
      ...prev,
      [state]: value
    }));
  };
  
  // Prepare state allocation for API
  const prepareStateAllocation = () => {
    if (!showMultiState) return null;
    
    const allocationObj = {};
    let total = 0;
    
    Object.entries(stateAllocation).forEach(([state, percentage]) => {
      total += percentage;
    });
    
    if (total <= 0) return null;
    
    // Normalize to sum to 1
    Object.entries(stateAllocation).forEach(([state, percentage]) => {
      allocationObj[state] = percentage / total;
    });
    
    return allocationObj;
  };
  
  // Calculate results
  const calculate = () => {
    setLoading(true);
    
    try {
      const holdingPeriod = calculateHoldingPeriod();
      
      // Create grant object
      const grant = {
        grant_type: grantType,
        shares: sharesToExercise,
        strike_price: strikePrice,
        current_fmv: currentFMV,
      };
      
      // Update tax settings
      const updatedTaxSettings = {
        ...taxSettings,
        isLongTerm: holdingPeriod >= 365,
        stateAllocation: prepareStateAllocation(),
      };
      
      // Calculate comprehensive tax impact
      const calculationResult = calculateComprehensiveTax(
        grant,
        strikePrice,
        exitPrice,
        sharesToExercise,
        updatedTaxSettings.isLongTerm,
        {
          federalRate: updatedTaxSettings.federalRate,
          stateRate: updatedTaxSettings.stateRate,
          filingStatus: updatedTaxSettings.filingStatus,
          income: updatedTaxSettings.otherIncome,
          stateAllocation: updatedTaxSettings.stateAllocation,
        }
      );
      
      // Calculate decision factors if in advanced or expert mode
      let factorScores = null;
      if (calculatorMode !== "basic") {
        factorScores = calculateDecisionFactors({
          strikePrice,
          currentFMV,
          vestedShares: sharesToExercise,
          companyStage,
          growthRate,
          financingHistory,
          availableCash,
          currentIncome: otherIncome,
          riskTolerance,
          stateOfResidence,
          optionType: grantType.toLowerCase(),
          timeToExpiration: 10, // Assuming 10 years for example
        });
      }
      
      // Set results
      setResult({
        ...calculationResult,
        holdingPeriod,
        isLongTerm: holdingPeriod >= 365,
        sharesToExercise,
      });
      
      setDecisionFactors(factorScores);
    } catch (error) {
      console.error("Calculation error:", error);
      // Handle error state
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <TooltipProvider>
      <Card className="border-2 relative shadow-md">
        {/* Mode selector */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mode:</span>
          <Select value={calculatorMode} onValueChange={setCalculatorMode}>
            <SelectTrigger className="h-7 w-[100px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Equity Calculator</CardTitle>
          </div>
          <CardDescription>
            {calculatorMode === "basic" 
              ? "Calculate the potential value of your equity compensation" 
              : calculatorMode === "advanced" 
                ? "Model scenarios and tax impacts for informed decisions" 
                : "Advanced tax modeling and strategic decision support"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className={cn(
              "grid w-full",
              calculatorMode === "basic" ? "grid-cols-2" : calculatorMode === "advanced" ? "grid-cols-3" : "grid-cols-4"
            )}>
              <TabsTrigger value="basic">Basic Inputs</TabsTrigger>
              <TabsTrigger value="advanced">Tax Settings</TabsTrigger>
              {calculatorMode !== "basic" && (
                <TabsTrigger value="timing">Timing</TabsTrigger>
              )}
              {calculatorMode === "expert" && (
                <TabsTrigger value="expert">Expert Settings</TabsTrigger>
              )}
            </TabsList>
            
            {/* Basic Inputs Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grantType">
                    <EducationalTooltip
                      title="Grant Type"
                      content="Different equity types have different tax treatment. ISOs may offer tax advantages but have AMT implications. NSOs are simpler but taxed as ordinary income. RSUs are taxed at vesting."
                    >
                      Grant Type
                    </EducationalTooltip>
                  </Label>
                  <Select value={grantType} onValueChange={setGrantType}>
                    <SelectTrigger id="grantType">
                      <SelectValue placeholder="Select grant type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISO">
                        ISO (Incentive Stock Option)
                      </SelectItem>
                      <SelectItem value="NSO">
                        NSO (Non-Qualified Stock Option)
                      </SelectItem>
                      <SelectItem value="RSU">
                        RSU (Restricted Stock Unit)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shares">
                    <EducationalTooltip
                      title="Number of Shares"
                      content="The total number of shares in your equity grant. This is the quantity of shares you have the right to purchase (for options) or will receive (for RSUs)."
                    >
                      Number of Shares
                    </EducationalTooltip>
                  </Label>
                  <Input
                    id="shares"
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="strikePrice">
                    <EducationalTooltip
                      title="Strike Price"
                      content="For options (ISOs/NSOs), this is the price you'll pay to exercise each share. For RSUs, this isn't applicable but the calculator uses it for comparison purposes."
                    >
                      Strike Price ($)
                    </EducationalTooltip>
                  </Label>
                  <Input
                    id="strikePrice"
                    type="number"
                    step="0.01"
                    value={strikePrice}
                    onChange={(e) => setStrikePrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentFMV">
                    <EducationalTooltip
                      title="Current FMV"
                      content="Fair Market Value is the current estimated value of each share. For private companies, this is typically the 409A valuation. For public companies, it's the market price."
                    >
                      Current FMV ($)
                    </EducationalTooltip>
                  </Label>
                  <Input
                    id="currentFMV"
                    type="number"
                    step="0.01"
                    value={currentFMV}
                    onChange={(e) => setCurrentFMV(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exitPrice">
                    <EducationalTooltip
                      title="Exit Price"
                      content="The estimated price per share at exit (IPO, acquisition, or secondary sale). This helps you model the potential future value of your equity."
                    >
                      Exit Price ($)
                    </EducationalTooltip>
                  </Label>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.01"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="percentageToExercise">
                      <EducationalTooltip
                        title="Percentage to Exercise"
                        content="You don't have to exercise all your options at once. Using a lower percentage can reduce upfront costs and AMT impact, but may affect long-term capital gains treatment."
                      >
                        Percentage to Exercise
                      </EducationalTooltip>
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {percentageToExercise}%
                    </span>
                  </div>
                  <Slider
                    id="percentageToExercise"
                    min={1}
                    max={100}
                    step={1}
                    value={[percentageToExercise]}
                    onValueChange={(values) => setPercentageToExercise(values[0])}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {sharesToExercise.toLocaleString()} of{" "}
                    {shares.toLocaleString()} shares
                  </div>
                </div>
              </div>
              
              {/* Quick Scenarios Section */}
              <div className="pt-4 border-t mt-4">
                <div className="mb-3 text-sm font-medium">Quick Scenarios</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <ScenarioButton
                    name="Conservative"
                    description="2x current value"
                    onClick={() => loadScenario("Conservative", 2)}
                    isActive={activeScenario === "Conservative"}
                  />
                  <ScenarioButton
                    name="Moderate"
                    description="5x current value"
                    onClick={() => loadScenario("Moderate", 5)}
                    isActive={activeScenario === "Moderate"}
                  />
                  <ScenarioButton
                    name="Optimistic"
                    description="10x current value"
                    onClick={() => loadScenario("Optimistic", 10)}
                    isActive={activeScenario === "Optimistic"}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Tax Settings Tab */}
            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filingStatus">
                    <EducationalTooltip
                      title="Filing Status"
                      content="Your tax filing status affects tax bracket thresholds and certain deductions. Different statuses have different AMT exemption amounts."
                    >
                      Filing Status
                    </EducationalTooltip>
                  </Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger id="filingStatus">
                      <SelectValue placeholder="Select filing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married_joint">
                        Married Filing Jointly
                      </SelectItem>
                      <SelectItem value="married_separate">
                        Married Filing Separately
                      </SelectItem>
                      <SelectItem value="head_household">
                        Head of Household
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stateOfResidence">
                    <EducationalTooltip
                      title="State of Residence"
                      content="Your state tax rate can significantly impact your overall tax burden. Some states have no income tax, while others have rates exceeding 10%."
                    >
                      State of Residence
                    </EducationalTooltip>
                  </Label>
                  <Select
                    value={stateOfResidence}
                    onValueChange={setStateOfResidence}
                  >
                    <SelectTrigger id="stateOfResidence">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="California">California</SelectItem>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="Texas">Texas</SelectItem>
                      <SelectItem value="Washington">Washington</SelectItem>
                      <SelectItem value="Florida">Florida</SelectItem>
                      {calculatorMode === "expert" && (
                        <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                      )}
                      {calculatorMode === "expert" && (
                        <SelectItem value="Illinois">Illinois</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="otherIncome">
                    <EducationalTooltip
                      title="Other Annual Income"
                      content="Your regular income (salary, bonus, etc.) affects your marginal tax rate and potential AMT impact. Higher income can increase AMT exposure when exercising ISOs."
                    >
                      Other Annual Income ($)
                    </EducationalTooltip>
                  </Label>
                  <Input
                    id="otherIncome"
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                {calculatorMode === "expert" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id="showMultiState"
                          checked={showMultiState}
                          onCheckedChange={setShowMultiState}
                        />
                        <Label htmlFor="showMultiState" className="text-sm font-medium cursor-pointer">
                          Multi-State Allocation
                        </Label>
                      </div>
                      
                      {showMultiState && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Allocate income percentages across states (total should be 100%)
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(stateAllocation).map(([state, percentage]) => (
                              <div key={state} className="flex gap-2 items-center">
                                <div className="text-xs">{state}:</div>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={percentage}
                                  onChange={(e) => 
                                    handleStateAllocationChange(state, parseInt(e.target.value) || 0)
                                  }
                                  className="h-8"
                                />
                                <div className="text-xs">%</div>
                              </div>
                            ))}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setStateAllocation(prev => ({
                                ...prev,
                                ...(prev.Washington ? {} : { Washington: 0 }),
                                ...(prev.Texas ? {} : { Texas: 0 }),
                                ...(prev.Florida ? {} : { Florida: 0 }),
                              }));
                            }}
                          >
                            Add State
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {calculatorMode === "expert" && (
                <div className="pt-4 border-t mt-4">
                  <div className="mb-3 text-sm font-medium">Advanced Tax Settings</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="includeAMT"
                        checked={taxSettings.includeAMT}
                        onCheckedChange={(checked) => 
                          setTaxSettings(prev => ({ ...prev, includeAMT: checked }))
                        }
                      />
                      <Label htmlFor="includeAMT" className="text-sm cursor-pointer">
                        Include AMT calculations (for ISOs)
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="includeMedicareNIIT"
                        checked={taxSettings.includeMedicareNIIT}
                        onCheckedChange={(checked) => 
                          setTaxSettings(prev => ({ ...prev, includeMedicareNIIT: checked }))
                        }
                      />
                      <Label htmlFor="includeMedicareNIIT" className="text-sm cursor-pointer">
                        Include Medicare and Net Investment Income Tax
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Timing Tab */}
            {calculatorMode !== "basic" && (
              <TabsContent value="timing" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exerciseDate">
                      <EducationalTooltip
                        title="Exercise Date"
                        content="The date when you plan to exercise your options. For ISOs, the holding period for favorable tax treatment starts on this date."
                      >
                        Exercise Date
                      </EducationalTooltip>
                    </Label>
                    <Input
                      id="exerciseDate"
                      type="date"
                      value={exerciseDate}
                      onChange={(e) => setExerciseDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exitDate">
                      <EducationalTooltip
                        title="Exit Date"
                        content="The date when you plan to sell your shares. To qualify for long-term capital gains treatment, this must be at least 1 year after exercise (and 2 years after grant for ISOs)."
                      >
                        Exit Date
                      </EducationalTooltip>
                    </Label>
                    <Input
                      id="exitDate"
                      type="date"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Holding period: {calculateHoldingPeriod()} days (
                      {calculateHoldingPeriod() >= 365
                        ? "Long-term capital gains may apply"
                        : "Short-term capital gains"}
                      )
                    </div>
                  </div>
                </div>
                
                {grantType === "ISO" && calculatorMode === "expert" && (
                  <div className="p-4 border rounded-md bg-blue-50 mt-4">
                    <div className="flex items-start gap-2">
                      <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">
                          ISO Holding Periods
                        </h4>
                        <p className="text-xs text-blue-600 mb-2">
                          For favorable ISO tax treatment, you must meet two holding requirements:
                        </p>
                        <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
                          <li>Hold for at least 1 year after exercise date</li>
                          <li>Hold for at least 2 years after grant date</li>
                        </ul>
                        <p className="text-xs text-blue-600 mt-2">
                          Failing to meet these requirements results in a disqualifying disposition.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
            
            {/* Expert Settings Tab */}
            {calculatorMode === "expert" && (
              <TabsContent value="expert" className="space-y-4 pt-4">
                <div className="p-4 border rounded-md bg-blue-50">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Decision Analysis Inputs
                      </h4>
                      <p className="text-xs text-blue-600 mb-3">
                        These additional inputs help improve the accuracy of our
                        exercise recommendation
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="companyStage" className="text-xs">
                            Company Stage
                          </Label>
                          <Select
                            value={companyStage}
                            onValueChange={setCompanyStage}
                          >
                            <SelectTrigger id="companyStage">
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seed">Seed</SelectItem>
                              <SelectItem value="early">Early</SelectItem>
                              <SelectItem value="growth">Growth</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="pre_ipo">Pre-IPO</SelectItem>
                              <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="growthRate" className="text-xs">
                            Annual Growth Rate (%)
                          </Label>
                          <Input
                            id="growthRate"
                            type="number"
                            value={growthRate}
                            onChange={(e) =>
                              setGrowthRate(parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="financingHistory" className="text-xs">
                            Financing History
                          </Label>
                          <Select
                            value={financingHistory}
                            onValueChange={setFinancingHistory}
                          >
                            <SelectTrigger id="financingHistory">
                              <SelectValue placeholder="Select history" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="strong">
                                Strong (Well-funded)
                              </SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="weak">
                                Weak (Struggling)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="availableCash" className="text-xs">
                            Your Available Cash ($)
                          </Label>
                          <Input
                            id="availableCash"
                            type="number"
                            value={availableCash}
                            onChange={(e) =>
                              setAvailableCash(parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="riskTolerance" className="text-xs">
                            Your Risk Tolerance
                          </Label>
                          <Select
                            value={riskTolerance}
                            onValueChange={setRiskTolerance}
                          >
                            <SelectTrigger id="riskTolerance">
                              <SelectValue placeholder="Select tolerance" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="very_low">Very Low</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very_high">Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {grantType === "ISO" && (
                  <div className="p-4 border rounded-md bg-yellow-50 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          ISO 100K Limit Considerations
                        </h4>
                        <p className="text-xs text-yellow-700 mb-2">
                          ISOs are subject to a $100,000 limit per year based on the grant date fair market value.
                          Excess options are treated as NSOs, with different tax implications.
                        </p>
                        <div className="border-t border-yellow-200 pt-2 mt-2">
                          <div className="text-xs text-yellow-700 flex justify-between">
                            <span>Estimated ISO-eligible value:</span>
                            <span className="font-medium">
                              {formatCurrency(Math.min(100000, shares * strikePrice))}
                            </span>
                          </div>
                          {shares * strikePrice > 100000 && (
                            <div className="text-xs text-yellow-700 flex justify-between mt-1">
                              <span>Portion potentially treated as NSO:</span>
                              <span className="font-medium">
                                {formatCurrency(shares * strikePrice - 100000)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
          
          <Button 
            onClick={calculate} 
            className="w-full mt-6" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Calculating...
              </>
            ) : (
              <>
                Calculate <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          {/* Results Section */}
          {result && (
            <div className="mt-6 space-y-6">
              <Card className="overflow-hidden border-2">
                <CardHeader className="bg-primary text-primary-foreground">
                  <CardTitle>
                    Calculation Results
                    {activeScenario && (
                      <span className="ml-2 text-sm font-normal opacity-90">
                        ({activeScenario} Scenario)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    {grantType} grant with {sharesToExercise.toLocaleString()} shares
                    {result.isLongTerm && " (long-term capital gains eligible)"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Key metrics and financial summary */}
                    <div className="col-span-2 p-6 space-y-4 border-b lg:border-b-0 lg:border-r">
                      {/* Key metrics summary - use larger text for main metrics */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Exercise Cost</div>
                          <div className="text-3xl font-bold">{formatCurrency(result.exerciseCost || 0)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Net Proceeds</div>
                          <div className="text-3xl font-bold text-green-600">{formatCurrency(result.totals?.netProceeds || 0)}</div>
                        </div>
                      </div>
                      
                      {/* Key pricing and share information */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="text-sm text-muted-foreground">Grant Type:</div>
                        <div className="text-sm font-medium text-right">{grantType}</div>
                        
                        <div className="text-sm text-muted-foreground">Strike Price:</div>
                        <div className="text-sm font-medium text-right">${strikePrice.toFixed(2)} per share</div>
                        
                        <div className="text-sm text-muted-foreground">Current FMV:</div>
                        <div className="text-sm font-medium text-right">${currentFMV.toFixed(2)} per share</div>
                        
                        <div className="text-sm text-muted-foreground">Exit Price:</div>
                        <div className="text-sm font-medium text-right">${exitPrice.toFixed(2)} per share</div>
                        
                        <div className="text-sm text-muted-foreground">Shares:</div>
                        <div className="text-sm font-medium text-right">{sharesToExercise.toLocaleString()}</div>
                        
                        <div className="text-sm text-muted-foreground">Holding Period:</div>
                        <div className="text-sm font-medium text-right">
                          {result.holdingPeriod} days ({result.isLongTerm ? "Long-term" : "Short-term"})
                        </div>
                      </div>
                      
                      {/* Financial summary */}
                      <div className="pt-4 mt-2 border-t">
                        <h4 className="text-sm font-medium mb-3">Financial Summary</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="text-sm text-muted-foreground">Gross Proceeds:</div>
                          <div className="text-sm font-medium text-right">
                            {formatCurrency(result.totals?.totalIncome || 0)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">Tax Liability:</div>
                          <div className="text-sm font-medium text-right text-red-600">
                            -{formatCurrency(result.totals?.totalTax || 0)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">Exercise Cost:</div>
                          <div className="text-sm font-medium text-right">
                            -{formatCurrency(result.exerciseCost || 0)}
                          </div>
                          
                          <div className="col-span-2 h-px bg-border my-2"></div>
                          
                          <div className="text-sm font-bold text-muted-foreground">Net Proceeds:</div>
                          <div className="text-sm font-bold text-right text-green-600">
                            {formatCurrency(result.totals?.netProceeds || 0)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">Effective Tax Rate:</div>
                          <div className="text-sm font-medium text-right">
                            {formatPercentage(result.totals?.effectiveRate * 100 || 0)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">ROI:</div>
                          <div className="text-sm font-medium text-right">
                            {formatPercentage(
                              result.exerciseCost > 0
                                ? (result.totals?.netProceeds / result.exerciseCost) * 100
                                : 0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tax breakdown chart and breakdown table */}
                    <div className="col-span-3 lg:border-l p-6">
                      <h4 className="text-lg font-semibold mb-4">Tax Analysis</h4>
                      
                      {/* Tax visualization */}
                      <TaxBreakdownChart data={result} />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-6">
                        {/* Tax breakdown details */}
                        <div className="text-sm font-medium text-muted-foreground">
                          Ordinary Income:
                        </div>
                        <div className="text-sm font-semibold text-right">
                          {formatCurrency(result.federal?.ordinaryIncome || 0)}
                        </div>
                        
                        <div className="text-sm font-medium text-muted-foreground">
                          Federal Income Tax:
                        </div>
                        <div className="text-sm font-semibold text-right">
                          {formatCurrency(result.federal?.federalTax || 0)}
                        </div>
                        
                        {result.federal?.longTermGains > 0 && (
                          <>
                            <div className="text-sm font-medium text-muted-foreground">
                              Long-term Capital Gains:
                            </div>
                            <div className="text-sm font-semibold text-right">
                              {formatCurrency(result.federal?.longTermGains || 0)}
                            </div>
                          </>
                        )}
                        
                        {result.federal?.shortTermGains > 0 && (
                          <>
                            <div className="text-sm font-medium text-muted-foreground">
                              Short-term Capital Gains:
                            </div>
                            <div className="text-sm font-semibold text-right">
                              {formatCurrency(result.federal?.shortTermGains || 0)}
                            </div>
                          </>
                        )}
                        
                        {(result.amt?.netAMTDue || 0) > 0 && (
                          <>
                            <div className="text-sm font-medium text-muted-foreground">
                              AMT Income:
                            </div>
                            <div className="text-sm font-semibold text-right">
                              {formatCurrency(result.amt?.amtIncome || 0)}
                            </div>
                            
                            <div className="text-sm font-medium text-muted-foreground">
                              AMT Tax:
                            </div>
                            <div className="text-sm font-semibold text-right">
                              {formatCurrency(result.amt?.netAMTDue || 0)}
                            </div>
                          </>
                        )}
                        
                        <div className="text-sm font-medium text-muted-foreground">
                          State Tax:
                        </div>
                        <div className="text-sm font-semibold text-right">
                          {formatCurrency(result.state?.stateTax || 0)}
                        </div>
                      </div>
                      
                      {calculatorMode === "expert" && showMultiState && result.state?.stateBreakdown?.length > 1 && (
                        <div className="mt-4 pt-3 border-t">
                          <h4 className="text-sm font-semibold mb-2">State Tax Breakdown</h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="font-medium">State</div>
                            <div className="font-medium text-right">Allocation</div>
                            <div className="font-medium text-right">Tax</div>
                            
                            {result.state.stateBreakdown.map((state, index) => (
                              <React.Fragment key={index}>
                                <div>{state.stateCode}</div>
                                <div className="text-right">{formatPercentage(state.allocation * 100)}</div>
                                <div className="text-right">{formatCurrency(state.stateTax)}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                {calculatorMode !== "basic" && (
                  <CardFooter className="bg-muted/10 p-4 border-t flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Generated on {new Date().toLocaleDateString()} • Results are
                      estimates only
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" /> Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" /> Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Share2 className="h-3 w-3" /> Share
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
              
              {/* Additional analysis based on calculator mode */}
              {calculatorMode !== "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outcome visualization */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Potential Outcomes</CardTitle>
                      <CardDescription>
                        How different exit values affect your net proceeds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <OutcomeVisualization
                        grantType={grantType}
                        shares={sharesToExercise}
                        strikePrice={strikePrice}
                        currentFMV={currentFMV}
                        exitValues={generateExitValues()}
                        taxSettings={taxSettings}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Decision guidance - only shown in advanced & expert modes */}
                  {decisionFactors && (
                    <Card
                      className={cn(
                        "border-2",
                        (decisionFactors.financialCapacity +
                          decisionFactors.companyOutlook +
                          decisionFactors.taxEfficiency +
                          decisionFactors.timing) /
                          4 >=
                          0.7
                          ? "border-green-400"
                          : (decisionFactors.financialCapacity +
                              decisionFactors.companyOutlook +
                              decisionFactors.taxEfficiency +
                              decisionFactors.timing) /
                              4 >=
                            0.5
                          ? "border-yellow-400"
                          : "border-red-400"
                      )}
                    >
                      <CardHeader>
                        <CardTitle>Decision Guidance</CardTitle>
                        <CardDescription>
                          Analysis based on your inputs and market factors
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DecisionFactorsVisual factors={decisionFactors} />
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">
                            Key Considerations
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {grantType === "ISO" &&
                              (result.amt?.netAMTDue || 0) > 0 && (
                                <li className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <span>
                                    AMT liability of{" "}
                                    {formatCurrency(result.amt?.netAMTDue || 0)}{" "}
                                    should be considered in your cash planning.
                                  </span>
                                </li>
                              )}
                            
                            {(result.exerciseCost || 0) > availableCash && (
                              <li className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>
                                  Exercise cost ({formatCurrency(result.exerciseCost || 0)}) exceeds your available cash ({formatCurrency(availableCash)}). Consider a partial exercise strategy.
                                </span>
                              </li>
                            )}
                            
                            {!result.isLongTerm && (
                              <li className="flex items-start gap-2">
                                <InfoIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>
                                  Holding for at least one year after exercise may qualify for lower long-term capital gains tax rates.
                                </span>
                              </li>
                            )}
                            
                            {exitPrice / currentFMV > 3 && (
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>
                                  Your projected exit value represents a{" "}
                                  {(exitPrice / currentFMV).toFixed(1)}x multiple of
                                  current FMV - solid upside potential.
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="pt-3 mt-3 border-t text-sm">
                          <h4 className="font-semibold mb-2">Recommendation</h4>
                          <p className="text-muted-foreground">
                            {(decisionFactors.financialCapacity +
                              decisionFactors.companyOutlook +
                              decisionFactors.taxEfficiency +
                              decisionFactors.timing) /
                              4 >=
                            0.7
                              ? "This appears to be a favorable opportunity to exercise. The potential upside outweighs the risks based on your inputs. Consider your personal financial situation and company outlook."
                              : (decisionFactors.financialCapacity +
                                  decisionFactors.companyOutlook +
                                  decisionFactors.taxEfficiency +
                                  decisionFactors.timing) /
                                  4 >=
                                0.5
                              ? "This represents a moderate opportunity. Consider a partial exercise strategy to balance risk and potential reward. Monitor company performance before committing fully."
                              : "Consider waiting or exercising a smaller portion. The current costs and tax implications are high relative to the potential gain based on your inputs."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {/* Tax planning tips - only shown in advanced & expert modes */}
              {calculatorMode !== "basic" && result && (
                <Card className="bg-muted/10">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle>Tax Planning Tips</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {grantType === "ISO" && (
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                          <h4 className="font-medium text-sm mb-2 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                            AMT Planning
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Consider exercising ISOs over multiple tax years to
                            minimize AMT impact. You might also exercise in December
                            and sell in January of a future year to spread the tax
                            impact across two years.
                          </p>
                        </div>
                      )}
                      
                      <div className="p-4 bg-white rounded-lg shadow-sm">
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Percent className="h-4 w-4 mr-1 text-blue-500" />
                          Holding Period Strategy
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          When possible, hold exercised options for at least 1 year
                          to qualify for long-term capital gains rates, which can be
                          significantly lower than ordinary income tax rates.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg shadow-sm">
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1 text-purple-500" />
                          Staged Exercise Approach
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Consider exercising in tranches rather than all at once.
                          This can reduce initial cash outlay and tax impact while
                          allowing you to benefit from potential appreciation.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground italic pt-2">
                      Note: These are general tips and not personalized tax advice.
                      Consult with a tax professional for guidance specific to your
                      situation.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}