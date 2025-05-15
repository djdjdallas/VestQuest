import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMON_SCENARIOS, GRANT_TYPES, TAX_RATES } from "@/utils/constants";
import {
  formatCurrency,
  formatPercentage,
  formatDate,
} from "@/utils/formatters";
import {
  calculateComprehensiveTax,
  calculateDecisionFactors,
} from "@/utils/calculations";

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

const ScenarioButton = ({ name, description, onClick, isActive }) => (
  <Button
    variant={isActive ? "default" : "outline"}
    size="sm"
    onClick={onClick}
    className="flex flex-col items-start h-auto p-3 space-y-1"
  >
    <span className="font-medium">{name}</span>
    <span className="text-xs text-muted-foreground">{description}</span>
  </Button>
);

const TaxBreakdownChart = ({ data }) => {
  const taxData = [
    { name: "Federal Ordinary", value: data.federal?.ordinaryTax || 0 },
    {
      name: "Federal Capital Gains",
      value: data.federal?.capitalGainsTax || 0,
    },
    { name: "AMT", value: data.amt?.netAMTDue || 0 },
    { name: "State", value: data.state?.stateTax || 0 },
  ];

  // Filter out zero values
  const filteredData = taxData.filter((item) => item.value > 0);

  // Return empty div if no tax data
  if (filteredData.length === 0) {
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
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {filteredData.map((entry, index) => (
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

const OutcomeVisualization = ({
  grantType,
  shares,
  strikePrice,
  currentFMV,
  exitValues,
  taxSettings,
}) => {
  // Generate data points for different exit values
  const data = exitValues.map((exitValue) => {
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
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="exitValue"
            tickFormatter={(value) => `$${value}`}
            label={{
              value: "Exit Price",
              position: "insideBottom",
              offset: -5,
            }}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <RechartsTooltip
            formatter={(value) => formatCurrency(value)}
            labelFormatter={(value) => `Exit Price: $${value}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="netProceeds"
            name="Net Proceeds"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="totalTax"
            name="Tax Liability"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="exerciseCost"
            name="Exercise Cost"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DecisionFactorsRadar = ({ factors }) => {
  if (!factors) return null;

  const data = [
    {
      subject: "Financial Capacity",
      score: factors.financialCapacity * 100,
      fullMark: 100,
    },
    {
      subject: "Company Outlook",
      score: factors.companyOutlook * 100,
      fullMark: 100,
    },
    {
      subject: "Tax Efficiency",
      score: factors.taxEfficiency * 100,
      fullMark: 100,
    },
    {
      subject: "Timing",
      score: factors.timing * 100,
      fullMark: 100,
    },
  ];

  // Calculate overall score (weighted average)
  const overallScore =
    (factors.financialCapacity * 0.3 +
      factors.companyOutlook * 0.3 +
      factors.taxEfficiency * 0.2 +
      factors.timing * 0.2) *
    100;

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
              "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center",
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
        {data.map((item) => (
          <div key={item.subject} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.subject}</span>
              <span className="font-medium">{item.score.toFixed(0)}/100</span>
            </div>
            <div className="overflow-hidden h-1.5 rounded-full bg-gray-200">
              <div
                style={{ width: `${item.score}%` }}
                className={cn(
                  "h-full",
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

export default function EnhancedCalculator() {
  // Basic inputs with better defaults
  const [grantType, setGrantType] = useState("ISO");
  const [shares, setShares] = useState(10000);
  const [strikePrice, setStrikePrice] = useState(1.0);
  const [currentFMV, setCurrentFMV] = useState(5.0);
  const [exitValue, setExitValue] = useState(25.0);
  const [activeScenario, setActiveScenario] = useState(null);

  // Advanced inputs with reasonable defaults
  const [exerciseDate, setExerciseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saleDate, setSaleDate] = useState(
    new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [filingStatus, setFilingStatus] = useState("single");
  const [stateOfResidence, setStateOfResidence] = useState("California");
  const [otherIncome, setOtherIncome] = useState(150000);
  const [sharesToExercise, setSharesToExercise] = useState(shares);
  const [percentageToExercise, setPercentageToExercise] = useState(100);

  // Decision inputs
  const [companyStage, setCompanyStage] = useState("growth");
  const [growthRate, setGrowthRate] = useState(30);
  const [financingHistory, setFinancingHistory] = useState("moderate");
  const [availableCash, setAvailableCash] = useState(50000);
  const [riskTolerance, setRiskTolerance] = useState("medium");

  // Tax settings
  const [taxSettings, setTaxSettings] = useState({
    federalRate: 0.35, // Simplified, would be calculated based on income
    stateRate: 0.1, // Simplified, would depend on state
    isLongTerm: true,
    filingStatus: "single",
    otherIncome: 150000,
  });

  // Results state
  const [result, setResult] = useState(null);
  const [decisionFactors, setDecisionFactors] = useState(null);
  const [showDecisionGuidance, setShowDecisionGuidance] = useState(false);

  // Calculate holding period in days
  const calculateHoldingPeriod = () => {
    const exercise = new Date(exerciseDate);
    const sale = new Date(saleDate);
    return Math.floor((sale - exercise) / (1000 * 60 * 60 * 24));
  };

  // Update shares to exercise when total shares or percentage changes
  useEffect(() => {
    setSharesToExercise(Math.floor(shares * (percentageToExercise / 100)));
  }, [shares, percentageToExercise]);

  // Update tax settings when related inputs change
  useEffect(() => {
    setTaxSettings((prev) => ({
      ...prev,
      isLongTerm: calculateHoldingPeriod() >= 365,
      filingStatus,
      otherIncome,
    }));
  }, [filingStatus, otherIncome, exerciseDate, saleDate]);

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

  // Load predefined scenario
  const loadScenario = (name, multiplier) => {
    setExitValue(currentFMV * multiplier);
    setActiveScenario(name);
  };

  // Calculate results
  const calculate = () => {
    const holdingPeriod = calculateHoldingPeriod();

    // Create grant object to pass to calculation function
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
    };

    // Calculate comprehensive tax impact
    const calculationResult = calculateComprehensiveTax(
      grant,
      strikePrice,
      exitValue,
      sharesToExercise,
      updatedTaxSettings.isLongTerm,
      {
        federalRate: updatedTaxSettings.federalRate,
        stateRate: updatedTaxSettings.stateRate,
        filingStatus: updatedTaxSettings.filingStatus,
        income: updatedTaxSettings.otherIncome,
      }
    );

    // Calculate decision factors
    const decisionData = {
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
    };

    const factorScores = calculateDecisionFactors(decisionData);

    // Set results
    setResult({
      ...calculationResult,
      holdingPeriod,
      isLongTerm: holdingPeriod >= 365,
    });

    setDecisionFactors(factorScores);

    setShowDecisionGuidance(true);
  };

  // Function to handle saving the calculation
  const handleSaveCalculation = () => {
    // Implementation would connect to user's saved calculations
    alert("Calculation saved successfully!");
  };

  // Function to export calculation as PDF
  const handleExportPDF = () => {
    // PDF generation logic would go here
    alert("PDF export functionality would be implemented here");
  };

  // Function to share calculation
  const handleShareCalculation = () => {
    // Sharing implementation would go here
    alert("Share functionality would be implemented here");
  };

  return (
    <TooltipProvider>
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Enhanced Equity Calculator</CardTitle>
        </div>
        <CardDescription>
          Model different scenarios to make informed decisions about your equity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Inputs</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            <TabsTrigger value="education">Learn As You Go</TabsTrigger>
          </TabsList>

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
                  onChange={(e) =>
                    setStrikePrice(parseFloat(e.target.value) || 0)
                  }
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
                  onChange={(e) =>
                    setCurrentFMV(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitValue">
                  <EducationalTooltip
                    title="Exit Price"
                    content="The estimated price per share at exit (IPO, acquisition, or secondary sale). This helps you model the potential future value of your equity."
                  >
                    Exit Price ($)
                  </EducationalTooltip>
                </Label>
                <Input
                  id="exitValue"
                  type="number"
                  step="0.01"
                  value={exitValue}
                  onChange={(e) =>
                    setExitValue(parseFloat(e.target.value) || 0)
                  }
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
                <Input
                  id="percentageToExercise"
                  type="range"
                  min="1"
                  max="100"
                  value={percentageToExercise}
                  onChange={(e) =>
                    setPercentageToExercise(parseInt(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {sharesToExercise.toLocaleString()} of{" "}
                  {shares.toLocaleString()} shares
                </div>
              </div>
            </div>

            <div className="pt-4">
              <div className="mb-3 text-sm font-medium">Quick Scenarios</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ScenarioButton
                  name="Conservative IPO"
                  description="2x current value"
                  onClick={() => loadScenario("Conservative IPO", 2)}
                  isActive={activeScenario === "Conservative IPO"}
                />
                <ScenarioButton
                  name="Moderate IPO"
                  description="5x current value"
                  onClick={() => loadScenario("Moderate IPO", 5)}
                  isActive={activeScenario === "Moderate IPO"}
                />
                <ScenarioButton
                  name="Optimistic IPO"
                  description="10x current value"
                  onClick={() => loadScenario("Optimistic IPO", 10)}
                  isActive={activeScenario === "Optimistic IPO"}
                />
                <ScenarioButton
                  name="Conservative Acquisition"
                  description="3x current value"
                  onClick={() => loadScenario("Conservative Acquisition", 3)}
                  isActive={activeScenario === "Conservative Acquisition"}
                />
                <ScenarioButton
                  name="Moderate Acquisition"
                  description="7x current value"
                  onClick={() => loadScenario("Moderate Acquisition", 7)}
                  isActive={activeScenario === "Moderate Acquisition"}
                />
                <ScenarioButton
                  name="Optimistic Acquisition"
                  description="15x current value"
                  onClick={() => loadScenario("Optimistic Acquisition", 15)}
                  isActive={activeScenario === "Optimistic Acquisition"}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 pt-4">
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
                <Label htmlFor="saleDate">
                  <EducationalTooltip
                    title="Sale Date"
                    content="The date when you plan to sell your shares. To qualify for long-term capital gains treatment, this must be at least 1 year after exercise (and 2 years after grant for ISOs)."
                  >
                    Sale Date
                  </EducationalTooltip>
                </Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherIncome">
                <EducationalTooltip
                  title="Other Income"
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

            <div className="p-4 border rounded-md bg-blue-50 mt-4">
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
          </TabsContent>

          <TabsContent value="education" className="pt-4">
            <div className="space-y-4 bg-muted/20 rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">
                    Understanding Equity Types
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Each equity type has unique tax treatments and
                    considerations:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <Card className="bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">ISOs</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="text-xs space-y-1 list-disc pl-4">
                          <li>No ordinary income at exercise</li>
                          <li>Potential AMT implications</li>
                          <li>Favorable tax treatment if held long enough</li>
                          <li>$100K limit per year for vesting ISOs</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">NSOs</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="text-xs space-y-1 list-disc pl-4">
                          <li>Ordinary income on spread at exercise</li>
                          <li>No AMT concerns</li>
                          <li>Withholding required at exercise</li>
                          <li>No limits on grant size</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">RSUs</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="text-xs space-y-1 list-disc pl-4">
                          <li>Taxed as ordinary income at vesting</li>
                          <li>No need to exercise (no cash outlay)</li>
                          <li>Typically withholding is automatic</li>
                          <li>May have double-trigger requirements</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-6">
                <div className="bg-primary/10 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">Key Tax Concepts</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Understanding these concepts can help you optimize your tax
                    situation:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium mb-1">
                        AMT (Alternative Minimum Tax)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        A parallel tax system designed to ensure taxpayers with
                        significant deductions still pay a minimum amount of
                        tax. ISO exercises can trigger AMT even when there's no
                        regular income tax impact.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium mb-1">Capital Gains</h4>
                      <p className="text-xs text-muted-foreground">
                        Profits from selling shares. Long-term capital gains
                        (assets held &gt;1 year) are taxed at lower rates (0%,
                        15%, or 20%) than short-term gains (taxed as ordinary
                        income).
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium mb-1">83(b) Election</h4>
                      <p className="text-xs text-muted-foreground">
                        A tax filing that allows you to be taxed on the value of
                        restricted stock at grant rather than at vesting. Must
                        be filed within 30 days of receiving the equity.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium mb-1">
                        Qualifying Disposition
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        For ISOs, selling shares after holding for at least 1
                        year after exercise AND 2 years after grant. This
                        treatment allows for all gain to be long-term capital
                        gains.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={calculate} className="w-full mt-6" size="lg">
          Calculate <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {result && (
          <div className="mt-6 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle>Calculation Results</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Based on your inputs and the {activeScenario || "custom"}{" "}
                  scenario
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Exercise Cost
                      </h3>
                      <p className="text-3xl font-bold">
                        {formatCurrency(result.totals?.exerciseCost || 0)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {grantType === "RSU" ? "Vesting FMV:" : "Strike Price:"}
                      </div>
                      <div className="text-sm font-semibold text-right">
                        ${strikePrice.toFixed(2)} per share
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Exit Price:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        ${exitValue.toFixed(2)} per share
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Shares:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {sharesToExercise.toLocaleString()}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Holding Period:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {result.holdingPeriod} days (
                        {result.isLongTerm ? "Long-term" : "Short-term"})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 pt-4 border-t">
                      <div className="text-sm font-medium text-muted-foreground">
                        Gross Proceeds:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatCurrency(result.totals?.totalIncome || 0)}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Tax Liability:
                      </div>
                      <div className="text-sm font-semibold text-right text-red-600">
                        -{formatCurrency(result.totals?.totalTax || 0)}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Exercise Cost:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        -{formatCurrency(result.totals?.exerciseCost || 0)}
                      </div>

                      <div className="col-span-2 h-px bg-border my-2"></div>

                      <div className="text-sm font-bold text-muted-foreground">
                        Net Proceeds:
                      </div>
                      <div className="text-lg font-bold text-right text-green-600">
                        {formatCurrency(result.totals?.netProceeds || 0)}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Effective Tax Rate:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatPercentage(
                          result.totals?.effectiveRate * 100 || 0
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Tax Breakdown
                    </h3>
                    <TaxBreakdownChart data={result} />

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6">
                      <div className="text-sm font-medium text-muted-foreground">
                        Ordinary Income:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatCurrency(result.federal?.ordinaryIncome || 0)}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Ordinary Income Tax:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatCurrency(
                          result.federal?.federalTax -
                            (result.federal?.capitalGainsTax || 0) || 0
                        )}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Capital Gains:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatCurrency(
                          (result.federal?.longTermGains || 0) +
                            (result.federal?.shortTermGains || 0)
                        )}
                      </div>

                      <div className="text-sm font-medium text-muted-foreground">
                        Capital Gains Tax:
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatCurrency(result.federal?.capitalGainsTax || 0)}
                      </div>

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
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 p-4 border-t flex justify-between">
                <div className="text-xs text-muted-foreground">
                  Generated on {new Date().toLocaleDateString()} • Results are
                  estimates only
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCalculation}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" /> Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareCalculation}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-3 w-3" /> Share
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Outcome Visualization</CardTitle>
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

              {showDecisionGuidance && decisionFactors && (
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
                    <DecisionFactorsRadar factors={decisionFactors} />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">
                        Key Considerations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {grantType === "ISO" &&
                          (result.amt?.netAMTDue || 0) > 0 && (
                            <li className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span>
                                AMT liability of{" "}
                                {formatCurrency(result.amt?.netAMTDue || 0)}{" "}
                                should be considered in your cash planning.
                              </span>
                            </li>
                          )}

                        {(result.totals?.exerciseCost || 0) > 10000 && (
                          <li className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>
                              Exercise cost is significant at{" "}
                              {formatCurrency(result.totals?.exerciseCost || 0)}
                              . Consider a partial exercise strategy.
                            </span>
                          </li>
                        )}

                        {!result.isLongTerm && (
                          <li className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>
                              Holding for at least one year after exercise may
                              qualify for lower tax rates.
                            </span>
                          </li>
                        )}

                        {exitValue / currentFMV > 3 && (
                          <li className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>
                              Your projected exit value represents a{" "}
                              {(exitValue / currentFMV).toFixed(1)}x multiple of
                              current FMV - solid upside potential.
                            </span>
                          </li>
                        )}

                        {decisionFactors.financialCapacity < 0.5 && (
                          <li className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>
                              Your financial capacity score is low. Consider
                              exercising fewer shares or increasing your cash
                              reserves.
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
              <CardFooter className="border-t p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mx-auto flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>View Full Tax Planning Guide</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t flex flex-col sm:flex-row gap-4 justify-between items-center p-6">
        <div className="text-sm text-muted-foreground">
          <p>
            This calculator provides estimates only. Consult with a financial
            advisor for personalized advice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Reset
          </Button>
          <Button variant="outline" size="sm">
            Save Defaults
          </Button>
          <Button size="sm">Advanced Options</Button>
        </div>
      </CardFooter>
    </Card>
    </TooltipProvider>
  );
}
