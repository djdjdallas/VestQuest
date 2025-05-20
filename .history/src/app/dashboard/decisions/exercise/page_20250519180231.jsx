"use client";

import { useState, useEffect } from "react";
import { DecisionLayout } from "@/components/decisions/DecisionLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Download,
  HelpCircle,
  Info,
  TrendingUp,
  Lightbulb,
  Save,
} from "lucide-react";
import { useGrants } from "@/hooks/useGrants";
import { useCalculator } from "@/hooks/useCalculator";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { GRANT_TYPES } from "@/utils/constants";
import {
  calculateDecisionFactors,
  calculateTaxes,
  calculateComprehensiveTax,
} from "@/utils/calculations";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { ScenarioBuilder } from "@/components/decisions/ScenarioBuilder";
import { BarChart } from "lucide-react";
export default function ExerciseDecisionGuidePage() {
  const { grants, loading: grantsLoading } = useGrants();
  const { calculateTax, isLoading: calculationLoading } = useCalculator();

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("summary");
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [financialInfo, setFinancialInfo] = useState({
    cashAvailable: 50000,
    otherIncome: 150000,
    otherLiquidAssets: 100000,
    monthlyExpenses: 5000,
    emergencyFundMonths: 6,
    debt: 50000,
    riskTolerance: 3, // 1-5 scale
    timeHorizon: "medium", // short, medium, long
    taxBracket: "high",
    filingStatus: "single",
    stateOfResidence: "California",
    hasTaxAdvisor: false,
  });
  const [companyOutlook, setCompanyOutlook] = useState({
    confidence: "moderate", // low, moderate, high
    timeToExit: "unknown", // 1-2 years, 3-5 years, 5+ years, unknown
    expectedValuation: 1000000000, // $1B
    expectedMultiple: 3, // Default to 3x current value
    hasInsiderInfo: false,
    equityStake: 0.01, // 0.01%
    fundingStage: "Series C",
    competitors: "moderate",
    industryOutlook: "positive",
  });
  const [exerciseScenarios, setExerciseScenarios] = useState({
    fullExercise: {
      name: "Exercise All Vested Options",
      shares: 0,
      cost: 0,
      potentialValue: 0,
      taxImpact: 0,
      netReturn: 0,
      roi: 0,
      risk: "high",
    },
    partialExercise: {
      name: "Exercise 50% of Vested Options",
      shares: 0,
      cost: 0,
      potentialValue: 0,
      taxImpact: 0,
      netReturn: 0,
      roi: 0,
      risk: "medium",
    },
    minimumExercise: {
      name: "Exercise Minimum (10%)",
      shares: 0,
      cost: 0,
      potentialValue: 0,
      taxImpact: 0,
      netReturn: 0,
      roi: 0,
      risk: "low",
    },
    waitAndExercise: {
      name: "Wait and Exercise Later",
      shares: 0,
      cost: 0,
      potentialValue: 0,
      taxImpact: 0,
      netReturn: 0,
      roi: 0,
      risk: "unknown",
    },
  });
  const [decisionFactors, setDecisionFactors] = useState({
    financialCapacity: 0,
    companyOutlook: 0,
    taxEfficiency: 0,
    timing: 0,
    total: 0,
  });

  const [result, setResult] = useState(null);
  const [alternativeStrategies, setAlternativeStrategies] = useState([]);
  const [taxAnalysis, setTaxAnalysis] = useState(null);
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);

  const steps = [
    "Select Grant",
    "Financial Profile",
    "Company Outlook",
    "Decision Analysis",
  ];

  useEffect(() => {
    if (selectedGrant && !calculationLoading) {
      calculateScenarios();
    }
  }, [selectedGrant, financialInfo, companyOutlook]);

  const calculateScenarios = () => {
    if (!selectedGrant) return;

    const grant = selectedGrant;
    const vestedShares = grant.vested_shares;

    // Calculate full exercise scenario
    const fullExerciseCost = vestedShares * grant.strike_price;
    const fullPotentialValue =
      vestedShares * grant.current_fmv * companyOutlook.expectedMultiple;

    // Calculate tax impact for full exercise
    const fullTaxSettings = {
      federalRate: financialInfo.taxBracket === "high" ? 0.37 : 0.24,
      stateRate: financialInfo.stateOfResidence === "California" ? 0.13 : 0.05,
      filingStatus: financialInfo.filingStatus,
      income: financialInfo.otherIncome,
    };

    const fullTaxImpact = calculateTaxes(
      grant,
      grant.strike_price,
      grant.current_fmv,
      vestedShares,
      false, // not long-term yet
      fullTaxSettings
    ).total_tax;

    // Calculate partial exercise (50%)
    const partialShares = Math.floor(vestedShares * 0.5);
    const partialCost = partialShares * grant.strike_price;
    const partialValue =
      partialShares * grant.current_fmv * companyOutlook.expectedMultiple;
    const partialTaxImpact = calculateTaxes(
      grant,
      grant.strike_price,
      grant.current_fmv,
      partialShares,
      false,
      fullTaxSettings
    ).total_tax;

    // Calculate minimum exercise (10%)
    const minShares = Math.floor(vestedShares * 0.1);
    const minCost = minShares * grant.strike_price;
    const minValue =
      minShares * grant.current_fmv * companyOutlook.expectedMultiple;
    const minTaxImpact = calculateTaxes(
      grant,
      grant.strike_price,
      grant.current_fmv,
      minShares,
      false,
      fullTaxSettings
    ).total_tax;

    // For wait and exercise, assume 20% higher FMV but potential for long-term capital gains
    const futureShares = vestedShares;
    const futureFMV = grant.current_fmv * 1.2;
    const futureCost = futureShares * grant.strike_price;
    const futureValue =
      futureShares * futureFMV * companyOutlook.expectedMultiple;
    const futureTaxImpact = calculateTaxes(
      grant,
      grant.strike_price,
      futureFMV,
      futureShares,
      true, // long-term capital gains
      fullTaxSettings
    ).total_tax;

    // Update scenarios
    setExerciseScenarios({
      fullExercise: {
        name: "Exercise All Vested Options",
        shares: vestedShares,
        cost: fullExerciseCost,
        potentialValue: fullPotentialValue,
        taxImpact: fullTaxImpact,
        netReturn: fullPotentialValue - fullExerciseCost - fullTaxImpact,
        roi:
          (fullPotentialValue - fullExerciseCost - fullTaxImpact) /
          fullExerciseCost,
        risk: "high",
      },
      partialExercise: {
        name: "Exercise 50% of Vested Options",
        shares: partialShares,
        cost: partialCost,
        potentialValue: partialValue,
        taxImpact: partialTaxImpact,
        netReturn: partialValue - partialCost - partialTaxImpact,
        roi: (partialValue - partialCost - partialTaxImpact) / partialCost,
        risk: "medium",
      },
      minimumExercise: {
        name: "Exercise Minimum (10%)",
        shares: minShares,
        cost: minCost,
        potentialValue: minValue,
        taxImpact: minTaxImpact,
        netReturn: minValue - minCost - minTaxImpact,
        roi: (minValue - minCost - minTaxImpact) / minCost,
        risk: "low",
      },
      waitAndExercise: {
        name: "Wait and Exercise Later",
        shares: futureShares,
        cost: futureCost,
        potentialValue: futureValue,
        taxImpact: futureTaxImpact,
        netReturn: futureValue - futureCost - futureTaxImpact,
        roi: (futureValue - futureCost - futureTaxImpact) / futureCost,
        risk: "medium-high",
      },
    });

    // Calculate decision factors
    const decisionData = {
      strikePrice: grant.strike_price,
      currentFMV: grant.current_fmv,
      vestedShares,
      optionType: grant.grant_type,
      availableCash: financialInfo.cashAvailable,
      otherLiquidAssets: financialInfo.otherLiquidAssets,
      currentDebt: financialInfo.debt,
      monthlyExpenses: financialInfo.monthlyExpenses,
      riskTolerance:
        financialInfo.riskTolerance === 5
          ? "very_high"
          : financialInfo.riskTolerance === 4
          ? "high"
          : financialInfo.riskTolerance === 3
          ? "medium"
          : financialInfo.riskTolerance === 2
          ? "low"
          : "very_low",
      companyStage:
        companyOutlook.fundingStage === "Series A"
          ? "early"
          : companyOutlook.fundingStage === "Series B"
          ? "growth"
          : companyOutlook.fundingStage === "Series C"
          ? "growth"
          : companyOutlook.fundingStage === "Series D+"
          ? "late"
          : "pre_ipo",
      growthRate: 30, // Assumed
      financingHistory:
        companyOutlook.fundingStage === "Series C" ||
        companyOutlook.fundingStage === "Series D+"
          ? "strong"
          : "moderate",
      exitTimeline:
        companyOutlook.timeToExit === "1-2"
          ? "1-2_years"
          : companyOutlook.timeToExit === "3-5"
          ? "3-5_years"
          : companyOutlook.timeToExit === "5+"
          ? "5+_years"
          : "unknown",
      currentIncome: financialInfo.otherIncome,
      stateOfResidence: financialInfo.stateOfResidence,
    };

    const factors = calculateDecisionFactors(decisionData);
    const totalScore =
      factors.financialCapacity * 0.35 +
      factors.companyOutlook * 0.3 +
      factors.taxEfficiency * 0.25 +
      factors.timing * 0.1;

    setDecisionFactors({
      ...factors,
      total: totalScore,
    });

    // Generate alternative strategies
    generateAlternativeStrategies(grant, factors, totalScore);

    // Generate tax analysis
    generateTaxAnalysis(grant, decisionData);

    // Generate sensitivity analysis
    generateSensitivityAnalysis(grant);
  };

  const generateAlternativeStrategies = (grant, factors, totalScore) => {
    const strategies = [];

    // Early exercise with 83(b) election (if applicable)
    if (grant.allows_early_exercise && grant.grant_type === GRANT_TYPES.ISO) {
      strategies.push({
        name: "Early Exercise with 83(b) Election",
        description:
          "Exercise unvested shares and file 83(b) election to start capital gains clock early",
        applicability: "High (for early-stage companies)",
        benefit:
          "Potential tax savings if company value increases significantly",
        risk: "Loss of funds if you leave before vesting or company fails",
      });
    }

    // Staggered exercise
    strategies.push({
      name: "Staggered Exercise Plan",
      description:
        "Exercise options gradually over multiple tax years to spread out AMT impact",
      applicability: "Medium to High",
      benefit: "Reduces concentrated tax impact and diversifies timing risk",
      risk: "May miss optimal exercise window for some portions",
    });

    // Exercise + immediate sale
    if (grant.grant_type === GRANT_TYPES.NSO) {
      strategies.push({
        name: "Exercise and Sell (secondary market)",
        description:
          "Exercise options and sell shares immediately if secondary market exists",
        applicability: factors.companyOutlook > 0.7 ? "Medium" : "Low",
        benefit: "Immediate liquidity and reduced holding risk",
        risk: "Likely higher tax burden as ordinary income and potential restrictive terms",
      });
    }

    // Exercise near year end
    if (grant.grant_type === GRANT_TYPES.ISO) {
      strategies.push({
        name: "Year-End Exercise Strategy",
        description:
          "Exercise near year end to maximize AMT planning opportunities",
        applicability: "Medium",
        benefit:
          "More time to plan for tax implications and possibly spread over two tax years",
        risk: "Potentially missing optimal pricing windows earlier in the year",
      });
    }

    // Low-AMT year exercise
    if (grant.grant_type === GRANT_TYPES.ISO) {
      strategies.push({
        name: "Low-Income Year Exercise",
        description:
          "Time exercise during a year with lower other income to reduce AMT impact",
        applicability: "Situational",
        benefit: "Potentially significant AMT savings",
        risk: "Uncertain timing of low-income years, may delay exercise too long",
      });
    }

    setAlternativeStrategies(strategies);
  };

  const generateTaxAnalysis = (grant, decisionData) => {
    // Generate comprehensive tax analysis for different scenarios
    const taxAnalysisData = {
      now: {
        title: "Exercise Now",
        exerciseDate: new Date(),
        saleDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years later
        ordinary:
          grant.grant_type === GRANT_TYPES.NSO
            ? (grant.current_fmv - grant.strike_price) * grant.vested_shares
            : 0,
        amt:
          grant.grant_type === GRANT_TYPES.ISO
            ? (grant.current_fmv - grant.strike_price) *
              grant.vested_shares *
              0.26
            : 0,
        capitalGains:
          (grant.current_fmv * companyOutlook.expectedMultiple -
            grant.current_fmv) *
          grant.vested_shares *
          0.15,
        totalTax: 0,
        effectiveRate: 0,
      },
      exit: {
        title: "Wait Until Exit",
        exerciseDate: "At Exit",
        saleDate: "Immediate",
        ordinary:
          (grant.current_fmv * companyOutlook.expectedMultiple -
            grant.strike_price) *
          grant.vested_shares *
          (financialInfo.taxBracket === "high" ? 0.37 : 0.24),
        amt: 0,
        capitalGains: 0,
        totalTax: 0,
        effectiveRate: 0,
      },
      longTerm: {
        title: "Exercise for Long-Term",
        exerciseDate: new Date(),
        saleDate: "After 1+ Year",
        ordinary:
          grant.grant_type === GRANT_TYPES.NSO
            ? (grant.current_fmv - grant.strike_price) * grant.vested_shares
            : 0,
        amt:
          grant.grant_type === GRANT_TYPES.ISO
            ? (grant.current_fmv - grant.strike_price) *
              grant.vested_shares *
              0.26
            : 0,
        capitalGains:
          (grant.current_fmv * companyOutlook.expectedMultiple -
            grant.current_fmv) *
          grant.vested_shares *
          0.15,
        totalTax: 0,
        effectiveRate: 0,
      },
    };

    // Calculate totals
    taxAnalysisData.now.totalTax =
      taxAnalysisData.now.ordinary +
      taxAnalysisData.now.amt +
      taxAnalysisData.now.capitalGains;
    taxAnalysisData.exit.totalTax = taxAnalysisData.exit.ordinary;
    taxAnalysisData.longTerm.totalTax =
      taxAnalysisData.longTerm.ordinary +
      taxAnalysisData.longTerm.amt +
      taxAnalysisData.longTerm.capitalGains;

    // Calculate effective rates
    const totalGain =
      (grant.current_fmv * companyOutlook.expectedMultiple -
        grant.strike_price) *
      grant.vested_shares;
    taxAnalysisData.now.effectiveRate =
      totalGain > 0 ? taxAnalysisData.now.totalTax / totalGain : 0;
    taxAnalysisData.exit.effectiveRate =
      totalGain > 0 ? taxAnalysisData.exit.totalTax / totalGain : 0;
    taxAnalysisData.longTerm.effectiveRate =
      totalGain > 0 ? taxAnalysisData.longTerm.totalTax / totalGain : 0;

    setTaxAnalysis(taxAnalysisData);
  };

  const generateSensitivityAnalysis = (grant) => {
    // Generate sensitivity analysis for different exit multiples and time horizons
    const sensitivityData = {
      exitMultiples: [1, 2, 3, 5, 10],
      timeHorizons: [1, 2, 3, 5],
      results: {},
    };

    // Calculate ROI for each combination
    sensitivityData.exitMultiples.forEach((multiple) => {
      sensitivityData.results[multiple] = {};

      sensitivityData.timeHorizons.forEach((years) => {
        const exerciseCost = grant.vested_shares * grant.strike_price;
        const exitValue = grant.vested_shares * grant.current_fmv * multiple;
        const taxSettings = {
          federalRate: financialInfo.taxBracket === "high" ? 0.37 : 0.24,
          stateRate:
            financialInfo.stateOfResidence === "California" ? 0.13 : 0.05,
          filingStatus: financialInfo.filingStatus,
          exerciseDate: new Date(),
          saleDate: new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000),
        };

        const isLongTerm = years >= 1;

        // Calculate tax impact
        const taxImpact = calculateTaxes(
          grant,
          grant.strike_price,
          grant.current_fmv,
          grant.vested_shares,
          isLongTerm,
          taxSettings
        ).total_tax;

        // Calculate ROI
        const netReturn = exitValue - exerciseCost - taxImpact;
        const roi = exerciseCost > 0 ? netReturn / exerciseCost : 0;

        sensitivityData.results[multiple][years] = {
          roi: roi,
          netReturn: netReturn,
        };
      });
    });

    setSensitivityAnalysis(sensitivityData);
  };

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

    // Get optimal strategy based on decision factors
    const factors = decisionFactors;
    let strategy;

    if (factors.total >= 0.75) {
      strategy = "fullExercise";
    } else if (factors.total >= 0.6) {
      strategy = "partialExercise";
    } else if (factors.total >= 0.45) {
      strategy = "minimumExercise";
    } else {
      strategy = "waitAndExercise";
    }

    // Get the selected strategy details
    const recommendedStrategy = exerciseScenarios[strategy];

    // Timeframe recommendation based on factors
    let timeframe = "";

    if (selectedGrant.expiration_date) {
      const expirationDate = new Date(selectedGrant.expiration_date);
      const now = new Date();
      const monthsToExpiration =
        (expirationDate - now) / (30 * 24 * 60 * 60 * 1000);

      if (monthsToExpiration <= 6) {
        timeframe = "As soon as possible (expiration approaching)";
      } else if (
        strategy === "fullExercise" ||
        strategy === "partialExercise"
      ) {
        timeframe = "Within the next 3-6 months";
      } else if (strategy === "minimumExercise") {
        timeframe = "Within the next year";
      } else {
        timeframe = "Reassess in 6 months";
      }
    } else {
      if (strategy === "fullExercise") {
        timeframe = "Within the next 3 months";
      } else if (strategy === "partialExercise") {
        timeframe = "Within the next 6 months";
      } else if (strategy === "minimumExercise") {
        timeframe = "Consider end of the tax year";
      } else {
        timeframe = "Reassess in 6-12 months";
      }
    }

    // Get best tax strategy
    const bestTaxStrategy = Object.keys(taxAnalysis).reduce((a, b) => {
      return taxAnalysis[a].effectiveRate < taxAnalysis[b].effectiveRate
        ? a
        : b;
    });

    // Generate explanation based on the factors
    let explanation = "";
    let considerations = [];

    if (factors.financialCapacity < 0.5) {
      explanation +=
        "Your financial capacity suggests exercising the full amount may stretch your resources. ";
      considerations.push(
        "Consider how much cash you're comfortable allocating to this investment"
      );
    } else {
      explanation +=
        "Your financial position allows for a significant option exercise. ";
    }

    if (factors.companyOutlook < 0.5) {
      explanation +=
        "There's uncertainty about the company's future trajectory. ";
      considerations.push(
        "Monitor company progress and funding rounds closely"
      );
    } else {
      explanation +=
        "The company outlook appears positive, supporting an exercise decision. ";
    }

    if (factors.taxEfficiency < 0.5) {
      explanation +=
        "Tax considerations suggest a cautious or staged approach. ";
      considerations.push(
        "Consult with a tax professional about AMT implications"
      );
    } else {
      explanation += "The tax situation appears favorable for exercise. ";
    }

    if (selectedGrant.grant_type === GRANT_TYPES.ISO) {
      considerations.push(
        "Hold for at least 1 year after exercise and 2 years after grant date for qualifying disposition treatment"
      );
    }

    if (factors.timing > 0.7) {
      considerations.push(
        "Consider option expiration timing when planning your exercise strategy"
      );
    }

    // Set the recommendation
    setResult({
      recommendation: recommendedStrategy.name,
      explanation: explanation,
      timeframe: timeframe,
      strategies: exerciseScenarios,
      bestStrategy: strategy,
      bestTaxStrategy: bestTaxStrategy,
      considerations: considerations,
      factors: factors,
      details: {
        exerciseCost: recommendedStrategy.cost,
        potentialValue: recommendedStrategy.potentialValue,
        taxImpact: recommendedStrategy.taxImpact,
        netReturn: recommendedStrategy.netReturn,
        roi: recommendedStrategy.roi,
      },
    });
  };

  // Handle saving a scenario from the scenario builder
  const handleSaveScenario = (scenario) => {
    setSavedScenarios((prevScenarios) => [...prevScenarios, scenario]);

    // After saving show a notification or message
    // In a real app, you might use toast or some other notification mechanism
    alert(`Scenario "${scenario.name}" saved successfully!`);
  };

  const getBadgeForRisk = (risk) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-500">Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case "high":
        return <Badge className="bg-red-500">High Risk</Badge>;
      case "medium-high":
        return <Badge className="bg-orange-500">Medium-High Risk</Badge>;
      default:
        return <Badge>Unknown Risk</Badge>;
    }
  };

  const ExerciseDecisionCard = ({
    title,
    strategy,
    isRecommended,
    factors,
    onClick,
  }) => (
    <Card
      className={`overflow-hidden hover:shadow-md transition-all ${
        isRecommended ? "border-primary border-2" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {getBadgeForRisk(strategy.risk)}
            {isRecommended && <Badge className="bg-primary">Recommended</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Exercise Cost</p>
            <p className="font-medium">{formatCurrency(strategy.cost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Potential Value</p>
            <p className="font-medium">
              {formatCurrency(strategy.potentialValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Est. Tax Impact</p>
            <p className="font-medium">{formatCurrency(strategy.taxImpact)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net Return</p>
            <p className="font-medium">{formatCurrency(strategy.netReturn)}</p>
          </div>
        </div>

        <div className="space-y-1 mt-3">
          <p className="text-xs text-muted-foreground">ROI Potential</p>
          <div className="flex items-center gap-2">
            <Progress
              value={Math.min(100, strategy.roi * 100)}
              className="h-2"
            />
            <span className="text-xs font-medium">
              {formatPercentage(strategy.roi * 100)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setActiveAnalysisTab("scenarios")}
        >
          Compare Scenarios
        </Button>
      </CardFooter>
    </Card>
  );

  const FactorScoreCard = ({ title, score, icon, description }) => (
    <div className="p-3 bg-muted/50 rounded-md">
      <div className="flex justify-between mb-1">
        <h4 className="flex items-center font-medium text-sm">
          {icon}
          <span className="ml-1">{title}</span>
        </h4>
        <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
      </div>
      <div className="mb-1.5">
        <Progress value={score * 100} className="h-1.5" />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <DecisionLayout
      title="Exercise Decision Analyzer"
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

                  {selectedGrant?.id === grant.id && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Vested Shares</p>
                          <p className="font-medium">
                            {grant.vested_shares.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vested Value</p>
                          <p className="font-medium">
                            {formatCurrency(
                              grant.vested_shares * grant.current_fmv
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Exercise Cost</p>
                          <p className="font-medium">
                            {formatCurrency(
                              grant.vested_shares * grant.strike_price
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Remaining Unvested
                          </p>
                          <p className="font-medium">
                            {(
                              grant.shares - grant.vested_shares
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNext()}
                        >
                          Continue with this grant
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md bg-muted/50">
              <p>You don't have any grants yet.</p>
              <Button className="mt-4" asChild>
                <a href="/dashboard/grants/add">Add a Grant</a>
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
              <p className="text-xs text-muted-foreground">
                Liquid cash you can use for exercise costs and taxes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Other liquid assets</Label>
              <Input
                type="number"
                value={financialInfo.otherLiquidAssets}
                onChange={(e) =>
                  setFinancialInfo({
                    ...financialInfo,
                    otherLiquidAssets: parseFloat(e.target.value),
                  })
                }
                prefix="$"
              />
              <p className="text-xs text-muted-foreground">
                Assets that could be quickly converted to cash if needed
              </p>
            </div>

            <div className="space-y-2">
              <Label>Current debt</Label>
              <Input
                type="number"
                value={financialInfo.debt}
                onChange={(e) =>
                  setFinancialInfo({
                    ...financialInfo,
                    debt: parseFloat(e.target.value),
                  })
                }
                prefix="$"
              />
              <p className="text-xs text-muted-foreground">
                Total outstanding debt obligations
              </p>
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
              <p className="text-xs text-muted-foreground">
                Your income from other sources
              </p>
            </div>

            <div className="space-y-2">
              <Label>Monthly expenses</Label>
              <Input
                type="number"
                value={financialInfo.monthlyExpenses}
                onChange={(e) =>
                  setFinancialInfo({
                    ...financialInfo,
                    monthlyExpenses: parseFloat(e.target.value),
                  })
                }
                prefix="$"
              />
              <p className="text-xs text-muted-foreground">
                Your average monthly expenses
              </p>
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

            <div className="space-y-2">
              <Label>Filing Status</Label>
              <RadioGroup
                value={financialInfo.filingStatus}
                onValueChange={(value) =>
                  setFinancialInfo({
                    ...financialInfo,
                    filingStatus: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="filing-single" />
                  <Label htmlFor="filing-single">Single</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="married_joint" id="filing-joint" />
                  <Label htmlFor="filing-joint">Married Filing Jointly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="head_household" id="filing-hoh" />
                  <Label htmlFor="filing-hoh">Head of Household</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>State of Residence</Label>
              <Input
                value={financialInfo.stateOfResidence}
                onChange={(e) =>
                  setFinancialInfo({
                    ...financialInfo,
                    stateOfResidence: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Your primary state of residence (for tax purposes)
              </p>
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

            <div className="space-y-2">
              <Label>Company's Current Funding Stage</Label>
              <RadioGroup
                value={companyOutlook.fundingStage}
                onValueChange={(value) =>
                  setCompanyOutlook({
                    ...companyOutlook,
                    fundingStage: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Series A" id="funding-a" />
                  <Label htmlFor="funding-a">Series A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Series B" id="funding-b" />
                  <Label htmlFor="funding-b">Series B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Series C" id="funding-c" />
                  <Label htmlFor="funding-c">Series C</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Series D+" id="funding-d" />
                  <Label htmlFor="funding-d">Series D or later</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Industry/Market Outlook</Label>
              <RadioGroup
                value={companyOutlook.industryOutlook}
                onValueChange={(value) =>
                  setCompanyOutlook({
                    ...companyOutlook,
                    industryOutlook: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="negative" id="industry-negative" />
                  <Label htmlFor="industry-negative">Negative/Declining</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="industry-neutral" />
                  <Label htmlFor="industry-neutral">Neutral/Stable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="positive" id="industry-positive" />
                  <Label htmlFor="industry-positive">Positive/Growing</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Do you have insider information?</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-insider"
                  checked={companyOutlook.hasInsiderInfo}
                  onCheckedChange={(checked) =>
                    setCompanyOutlook({
                      ...companyOutlook,
                      hasInsiderInfo: checked,
                    })
                  }
                />
                <Label htmlFor="has-insider">
                  I have access to non-public information about the company
                </Label>
              </div>
              {companyOutlook.hasInsiderInfo && (
                <p className="text-amber-600 text-sm flex items-center mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Consult your company's insider trading policy before
                  exercising
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <Tabs
            defaultValue="summary"
            value={activeAnalysisTab}
            onValueChange={setActiveAnalysisTab}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="tax">Tax Analysis</TabsTrigger>
              <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
              <TabsTrigger value="what-if">What-If</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 pt-4">
              {result && (
                <>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-primary flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Recommendation
                      </h3>
                      {getBadgeForRisk(
                        exerciseScenarios[result.bestStrategy].risk
                      )}
                    </div>
                    <p className="mt-2 font-medium text-xl">
                      {result.recommendation}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Optimal timeframe: {result.timeframe}
                    </p>
                    <p className="mt-3">{result.explanation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ExerciseDecisionCard
                      title={exerciseScenarios[result.bestStrategy].name}
                      strategy={exerciseScenarios[result.bestStrategy]}
                      isRecommended={true}
                      factors={result.factors}
                      onClick={() => setActiveAnalysisTab("scenarios")}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle>Decision Factors Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <FactorScoreCard
                          title="Financial Capacity"
                          score={result.factors.financialCapacity}
                          icon={<DollarSign className="h-4 w-4 text-primary" />}
                          description="Your ability to afford exercise costs and potential tax implications"
                        />

                        <FactorScoreCard
                          title="Company Outlook"
                          score={result.factors.companyOutlook}
                          icon={<TrendingUp className="h-4 w-4 text-primary" />}
                          description="Assessment of company growth potential and exit scenarios"
                        />

                        <FactorScoreCard
                          title="Tax Efficiency"
                          score={result.factors.taxEfficiency}
                          icon={<BarChart className="h-4 w-4 text-primary" />}
                          description="Tax implications and strategies for minimizing tax burden"
                        />

                        <FactorScoreCard
                          title="Timing Considerations"
                          score={result.factors.timing}
                          icon={<Clock className="h-4 w-4 text-primary" />}
                          description="Optimal timing based on expiration and other factors"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Key Considerations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.considerations.map((consideration, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="mt-1">
                              <Info className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-sm">{consideration}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-muted-foreground">
                        This analysis is based on your inputs and should not be
                        considered financial advice. Consult with a financial
                        advisor or tax professional for personalized guidance.
                      </p>
                    </CardFooter>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="scenarios" className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(exerciseScenarios).map((key) => (
                    <ExerciseDecisionCard
                      key={key}
                      title={exerciseScenarios[key].name}
                      strategy={exerciseScenarios[key]}
                      isRecommended={result && result.bestStrategy === key}
                      factors={decisionFactors}
                      onClick={() => {}}
                    />
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Table</CardTitle>
                    <CardDescription>
                      Side-by-side comparison of different exercise strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-muted">
                          <tr>
                            <th className="px-4 py-2">Strategy</th>
                            <th className="px-4 py-2">Shares</th>
                            <th className="px-4 py-2">Cost</th>
                            <th className="px-4 py-2">Est. Tax</th>
                            <th className="px-4 py-2">Net Return</th>
                            <th className="px-4 py-2">ROI</th>
                            <th className="px-4 py-2">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(exerciseScenarios).map((key) => {
                            const scenario = exerciseScenarios[key];
                            return (
                              <tr key={key} className="border-b">
                                <td className="px-4 py-3 font-medium">
                                  {scenario.name}
                                </td>
                                <td className="px-4 py-3">
                                  {scenario.shares.toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  {formatCurrency(scenario.cost)}
                                </td>
                                <td className="px-4 py-3">
                                  {formatCurrency(scenario.taxImpact)}
                                </td>
                                <td className="px-4 py-3">
                                  {formatCurrency(scenario.netReturn)}
                                </td>
                                <td className="px-4 py-3">
                                  {formatPercentage(scenario.roi * 100)}
                                </td>
                                <td className="px-4 py-3">{scenario.risk}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {sensitivityAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sensitivity Analysis</CardTitle>
                      <CardDescription>
                        How different exit multiples and time horizons affect
                        returns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm">
                        The table below shows potential ROI across different
                        exit multiples and holding periods:
                      </p>
                      <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs bg-muted">
                            <tr>
                              <th className="px-3 py-2">Exit Multiple</th>
                              {sensitivityAnalysis.timeHorizons.map((year) => (
                                <th key={year} className="px-3 py-2">
                                  {year} {year === 1 ? "Year" : "Years"}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sensitivityAnalysis.exitMultiples.map(
                              (multiple) => (
                                <tr key={multiple} className="border-b">
                                  <td className="px-3 py-2 font-medium">
                                    {multiple}x
                                  </td>
                                  {sensitivityAnalysis.timeHorizons.map(
                                    (year) => (
                                      <td key={year} className="px-3 py-2">
                                        {formatPercentage(
                                          sensitivityAnalysis.results[multiple][
                                            year
                                          ].roi * 100
                                        )}
                                      </td>
                                    )
                                  )}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Note: This analysis assumes holding until the specified
                        time period and then selling at the given multiple of
                        current FMV.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tax" className="pt-4">
              <div className="space-y-4">
                {taxAnalysis && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Tax Strategy Comparison</CardTitle>
                        <CardDescription>
                          Compare tax impacts across different exercise
                          strategies
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-muted">
                              <tr>
                                <th className="px-4 py-2">Strategy</th>
                                <th className="px-4 py-2">Exercise Date</th>
                                <th className="px-4 py-2">Sale Date</th>
                                <th className="px-4 py-2">
                                  Ordinary Income Tax
                                </th>
                                <th className="px-4 py-2">AMT</th>
                                <th className="px-4 py-2">Capital Gains Tax</th>
                                <th className="px-4 py-2">Total Tax</th>
                                <th className="px-4 py-2">Effective Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(taxAnalysis).map((key) => {
                                const strategy = taxAnalysis[key];
                                return (
                                  <tr key={key} className="border-b">
                                    <td className="px-4 py-3 font-medium">
                                      {strategy.title}
                                    </td>
                                    <td className="px-4 py-3">
                                      {strategy.exerciseDate instanceof Date
                                        ? strategy.exerciseDate.toLocaleDateString()
                                        : strategy.exerciseDate}
                                    </td>
                                    <td className="px-4 py-3">
                                      {strategy.saleDate instanceof Date
                                        ? strategy.saleDate.toLocaleDateString()
                                        : strategy.saleDate}
                                    </td>
                                    <td className="px-4 py-3">
                                      {formatCurrency(strategy.ordinary)}
                                    </td>
                                    <td className="px-4 py-3">
                                      {formatCurrency(strategy.amt)}
                                    </td>
                                    <td className="px-4 py-3">
                                      {formatCurrency(strategy.capitalGains)}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                      {formatCurrency(strategy.totalTax)}
                                    </td>
                                    <td className="px-4 py-3">
                                      {formatPercentage(
                                        strategy.effectiveRate * 100
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex items-start text-sm">
                          <div className="mr-2 mt-0.5">
                            {key === result?.bestTaxStrategy ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Info className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm">
                            {selectedGrant?.grant_type === GRANT_TYPES.ISO
                              ? "For ISOs, exercise at least 1 year before sale and 2 years after grant date to qualify for long-term capital gains treatment."
                              : "For NSOs, tax is due on the spread between FMV and strike price at exercise as ordinary income."}
                          </p>
                        </div>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                          Important Tax Considerations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedGrant?.grant_type === GRANT_TYPES.ISO && (
                          <div className="p-3 bg-muted rounded-md">
                            <h4 className="font-medium mb-1">
                              Alternative Minimum Tax (AMT)
                            </h4>
                            <p className="text-sm">
                              When exercising ISOs, you may be subject to AMT on
                              the spread between the fair market value and
                              strike price. This can significantly increase your
                              tax liability in the year of exercise, even though
                              you haven't sold the shares.
                            </p>
                          </div>
                        )}

                        <div className="p-3 bg-muted rounded-md">
                          <h4 className="font-medium mb-1">
                            Tax Treatment by Grant Type
                          </h4>
                          <p className="text-sm">
                            {selectedGrant?.grant_type === GRANT_TYPES.ISO
                              ? "ISOs can qualify for favorable tax treatment (long-term capital gains) if you hold the shares for at least 1 year after exercise and 2 years after the grant date."
                              : selectedGrant?.grant_type === GRANT_TYPES.NSO
                              ? "NSOs are taxed as ordinary income on the spread between FMV and strike price at exercise. Any subsequent appreciation is taxed as capital gains."
                              : "RSUs are typically taxed as ordinary income at vesting. Any subsequent appreciation is taxed as capital gains."}
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded-md">
                          <h4 className="font-medium mb-1">
                            Multi-Year Tax Planning
                          </h4>
                          <p className="text-sm">
                            Consider spreading exercises across multiple tax
                            years to manage AMT and income tax liabilities. This
                            can be especially important for large grants where a
                            single exercise might trigger significant tax
                            consequences.
                          </p>
                        </div>

                        <div className="p-3 bg-muted rounded-md">
                          <h4 className="font-medium mb-1">
                            Estimated Tax Payments
                          </h4>
                          <p className="text-sm">
                            After exercising options, you may need to make
                            estimated tax payments to avoid underpayment
                            penalties. Consult with a tax professional to
                            determine your estimated tax obligations.
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <p className="text-sm flex items-center text-amber-600">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          This is a simplified tax analysis. Consult with a tax
                          professional for comprehensive advice.
                        </p>
                      </CardFooter>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="alternatives" className="pt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Alternative Exercise Strategies</CardTitle>
                    <CardDescription>
                      Consider these strategies based on your specific situation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alternativeStrategies.map((strategy, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <h3 className="font-medium mb-1">{strategy.name}</h3>
                          <p className="text-sm mb-2">{strategy.description}</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Applicability
                              </p>
                              <p className="font-medium">
                                {strategy.applicability}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Potential Benefit
                              </p>
                              <p className="font-medium">{strategy.benefit}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Risk</p>
                              <p className="font-medium">{strategy.risk}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Decision Framework</CardTitle>
                    <CardDescription>
                      Factors to consider when deciding on an exercise strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-md">
                        <h3 className="font-medium mb-1 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-primary" />
                          Financial Health Assessment
                        </h3>
                        <p className="text-sm">
                          Only exercise options when you can comfortably afford
                          it without jeopardizing your emergency fund or taking
                          on significant debt. Ideally, exercise costs should be
                          less than 10-20% of your liquid assets.
                        </p>
                      </div>

                      <div className="p-3 bg-muted rounded-md">
                        <h3 className="font-medium mb-1 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1 text-primary" />
                          Company Trajectory Analysis
                        </h3>
                        <p className="text-sm">
                          Assess the company's growth trajectory, market
                          position, and funding status. Exercise is most
                          beneficial when you have high confidence in continued
                          growth and a viable path to liquidity.
                        </p>
                      </div>

                      <div className="p-3 bg-muted rounded-md">
                        <h3 className="font-medium mb-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-primary" />
                          Time Horizon Planning
                        </h3>
                        <p className="text-sm">
                          Match your exercise strategy to your time horizon. If
                          you plan to remain with the company long-term, early
                          exercise with qualifying disposition strategies may be
                          beneficial. For shorter horizons, more conservative
                          approaches like partial exercises are often better.
                        </p>
                      </div>

                      <div className="p-3 bg-muted rounded-md">
                        <h3 className="font-medium mb-1 flex items-center">
                          <BarChart className="h-4 w-4 mr-1 text-primary" />
                          Portfolio Diversification
                        </h3>
                        <p className="text-sm">
                          Consider how your equity position fits within your
                          overall investment portfolio. Avoid having an
                          excessive percentage of your net worth tied to a
                          single company, especially if it's also your employer.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expert Consultation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Equity decisions involve complex financial, tax, and legal
                      considerations. Consider consulting these professionals:
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Tax Advisor</p>
                          <p className="text-sm text-muted-foreground">
                            For personalized tax strategy, AMT planning, and
                            multi-year tax optimization
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Financial Planner</p>
                          <p className="text-sm text-muted-foreground">
                            For integrating equity decisions into your broader
                            financial plan and goals
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Securities Attorney</p>
                          <p className="text-sm text-muted-foreground">
                            For navigating complex legal restrictions like
                            transfer limitations or lockup periods
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="what-if" className="pt-4">
              <div className="space-y-4">
                <ScenarioBuilder
                  grant={selectedGrant}
                  financialInfo={financialInfo}
                  companyOutlook={companyOutlook}
                  onSaveScenario={handleSaveScenario}
                  savedScenarios={savedScenarios}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DecisionLayout>
  );
}
