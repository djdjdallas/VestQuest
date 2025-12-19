// src/components/education/InteractiveEducation.jsx

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip";
import {
  calculatorOptions,
  basicCalculations,
  advancedCalculations,
  isoTaxTreatment,
  nsoTaxTreatment,
  rsuTaxTreatment,
  vestingScheduleTypes,
} from "@/utils/enhanced-calculations";
import {
  calculateVestedShares,
  calculateExerciseCost,
  calculateTaxes,
} from "@/utils/calculations";
import {
  ArrowRight,
  Award,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Calculator,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

export function InteractiveEducation({
  educationLevel = 'beginner',
  markConceptViewed = () => {},
  saveQuizResults = () => {},
  quizResults = {},
}) {
  const [activeModule, setActiveModule] = useState("calculator");
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
    vestingSchedule: "monthly",
    cliffPeriod: 12, // months
    taxRate: 35,
    quizAnswers: {},
  });

  const [results, setResults] = useState(null);
  const [activeView, setActiveView] = useState("parameters");
  
  const [quizState, setQuizState] = useState({
    currentQuestion: 0,
    answers: {},
    showResults: false
  });
  
  const [simulationState, setSimulationState] = useState({
    step: 0,
    choices: {},
    outcome: null
  });

  // Define quiz questions
  const quizQuestions = [
    {
      id: "q1",
      question: "Which type of equity grant generally has the most favorable tax treatment?",
      options: [
        { id: "a", text: "NSO (Non-qualified Stock Options)" },
        { id: "b", text: "ISO (Incentive Stock Options)" },
        { id: "c", text: "RSU (Restricted Stock Units)" },
        { id: "d", text: "They all have identical tax treatment" }
      ],
      correctAnswer: "b",
      explanation: "ISOs generally have more favorable tax treatment because they can qualify for long-term capital gains treatment if certain holding requirements are met, whereas NSOs are taxed as ordinary income at exercise, and RSUs are taxed as ordinary income at vesting."
    },
    {
      id: "q2",
      question: "When does the tax obligation for RSUs typically occur?",
      options: [
        { id: "a", text: "At grant" },
        { id: "b", text: "At exercise" },
        { id: "c", text: "At vesting" },
        { id: "d", text: "Only when you sell the shares" }
      ],
      correctAnswer: "c",
      explanation: "RSUs are typically taxed at vesting, when they are considered income. This is different from stock options where taxation generally occurs at exercise (for NSOs) or at sale (for ISOs if holding periods are met)."
    },
    {
      id: "q3",
      question: "What is the purpose of a vesting cliff?",
      options: [
        { id: "a", text: "To increase the total number of shares granted" },
        { id: "b", text: "To require a minimum employment period before any equity vests" },
        { id: "c", text: "To accelerate vesting for executives" },
        { id: "d", text: "To reduce the company's tax liability" }
      ],
      correctAnswer: "b",
      explanation: "A vesting cliff is a period during which no shares vest, after which a portion vests immediately. This is typically used to ensure employees stay with the company for a minimum period (often 1 year) before receiving any equity benefits."
    },
    {
      id: "q4",
      question: "What is Alternative Minimum Tax (AMT) and when might it apply?",
      options: [
        { id: "a", text: "A tax applied to all stock sales regardless of holding period" },
        { id: "b", text: "A tax that only applies to RSUs" },
        { id: "c", text: "A parallel tax system that may be triggered when exercising ISOs" },
        { id: "d", text: "A tax that only applies to non-US employees" }
      ],
      correctAnswer: "c",
      explanation: "AMT is a parallel tax system designed to ensure taxpayers with significant income don't avoid taxes through deductions. It's particularly relevant for ISO exercises because while regular income tax isn't applied at exercise, the spread between exercise price and fair market value can trigger AMT liability."
    },
    {
      id: "q5",
      question: "What is the typical post-termination exercise window for most stock options?",
      options: [
        { id: "a", text: "30 days" },
        { id: "b", text: "90 days" },
        { id: "c", text: "1 year" },
        { id: "d", text: "Unlimited" }
      ],
      correctAnswer: "b",
      explanation: "Most companies provide a 90-day post-termination exercise window, meaning you have 90 days after leaving the company to exercise your vested options or they expire. Some companies have extended this period, but 90 days remains the most common timeframe."
    }
  ];
  
  // Define simulation scenarios
  const simulationScenarios = [
    {
      id: "early_exercise",
      title: "Early Exercise Decision",
      description: "You've just received a stock option grant at a startup. You need to decide whether to exercise early or wait.",
      steps: [
        {
          id: "step1",
          prompt: "You're granted 10,000 ISOs at a strike price of $1. The current 409A valuation is also $1. What would you do?",
          choices: [
            { id: "exercise_now", text: "Exercise all options immediately", next: "step2a" },
            { id: "wait", text: "Wait until shares vest before deciding", next: "step2b" },
            { id: "partial", text: "Exercise a portion now (2,500 shares)", next: "step2c" }
          ]
        },
        {
          id: "step2a",
          prompt: "You've exercised all options at $1/share, paying $10,000 plus filing an 83(b) election. Two years later, the company's value has increased to $10/share.",
          choices: [
            { id: "hold", text: "Continue holding all shares", next: "outcome1" },
            { id: "sell_half", text: "Sell half your shares", next: "outcome2" }
          ]
        },
        {
          id: "step2b",
          prompt: "You've waited, and after 1 year, 2,500 shares have vested. The share price is now $5.",
          choices: [
            { id: "exercise_vested", text: "Exercise only vested shares", next: "outcome3" },
            { id: "continue_waiting", text: "Continue waiting", next: "outcome4" }
          ]
        },
        {
          id: "step2c",
          prompt: "You've exercised 2,500 shares at $1 each ($2,500) and filed an 83(b) election. After 1 year, another 2,500 shares vest, and the price is now $5.",
          choices: [
            { id: "exercise_more", text: "Exercise the newly vested 2,500 shares", next: "outcome5" },
            { id: "hold_wait", text: "Hold early exercised shares, wait for others", next: "outcome6" }
          ]
        }
      ],
      outcomes: {
        "outcome1": {
          title: "Long-term Investment",
          description: "You hold all 10,000 shares worth $100,000. By exercising early and holding for >1 year after exercise and >2 years after grant, you may qualify for long-term capital gains treatment on the full appreciation ($90,000).",
          favorability: "good"
        },
        "outcome2": {
          title: "Partial Exit",
          description: "You sell 5,000 shares for $50,000, with potential long-term capital gains treatment on the $45,000 gain. You still hold 5,000 shares worth $50,000.",
          favorability: "good"
        },
        "outcome3": {
          title: "Higher Exercise Cost",
          description: "You exercise 2,500 shares at $1 each, but now face potential AMT tax implications on the spread of $4/share ($10,000 total spread). Future appreciation will start from the $5 basis.",
          favorability: "neutral"
        },
        "outcome4": {
          title: "Price Increase Risk",
          description: "By continuing to wait, you avoid the $2,500 exercise cost, but risk the share price increasing further, which could lead to higher exercise costs and tax implications later.",
          favorability: "neutral"
        },
        "outcome5": {
          title: "Mixed Strategy",
          description: "Your early exercised shares may qualify for favorable tax treatment. The newly exercised shares at $5 FMV have a $4/share spread ($10,000 total), potentially triggering AMT.",
          favorability: "neutral"
        },
        "outcome6": {
          title: "Balanced Approach",
          description: "You have 2,500 shares with favorable tax treatment potential. You've limited your initial cash outlay while preserving the option to exercise more later based on company performance.",
          favorability: "good"
        }
      }
    }
  ];

  // Update results when scenario changes
  const updateResults = () => {
    try {
      // Format dates for calculation
      const formattedScenario = {
        ...scenario,
        vesting_start_date: new Date(scenario.vestingStart),
        vesting_end_date: new Date(scenario.vestingEnd),
        vesting_cliff_date: new Date(
          new Date(scenario.vestingStart).getTime() + scenario.cliffPeriod * 30 * 24 * 60 * 60 * 1000
        ),
      };

      // Calculate vested shares
      const vestedShares = calculateVestedShares(formattedScenario);

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

      // Generate vesting timeline data for charts
      const vestingTimelineData = generateVestingTimelineData(
        scenario.shares,
        new Date(scenario.vestingStart),
        new Date(scenario.vestingEnd),
        new Date(formattedScenario.vesting_cliff_date),
        scenario.vestingSchedule
      );

      // Generate tax comparison data
      const taxComparisonData = [
        {
          name: "ISO (Qualified)",
          taxes: calculateQualifiedIsoTax(vestedShares, scenario.strikePrice, scenario.exitPrice),
        },
        {
          name: "ISO (Disqualified)",
          taxes: calculateDisqualifiedIsoTax(vestedShares, scenario.strikePrice, scenario.exitPrice, scenario.taxRate),
        },
        {
          name: "NSO",
          taxes: calculateNsoTax(vestedShares, scenario.strikePrice, scenario.exitPrice, scenario.taxRate),
        },
        {
          name: "RSU",
          taxes: calculateRsuTax(vestedShares, scenario.currentFMV, scenario.exitPrice, scenario.taxRate),
        },
      ];

      setResults({
        vestedShares,
        exerciseCost,
        taxResults,
        grossProceeds,
        netProceeds,
        isLongTerm,
        vestingTimelineData,
        taxComparisonData,
      });

      // Mark this concept as viewed in user progress
      markConceptViewed('equity_calculator');
    } catch (error) {
      // Calculation error - results will remain null
    }
  };

  // Helper function to create vesting timeline data for visualization
  const generateVestingTimelineData = (
    totalShares,
    startDate,
    endDate,
    cliffDate,
    schedule
  ) => {
    const data = [];
    const totalMonths = monthDiff(startDate, endDate);
    const cliffMonths = monthDiff(startDate, cliffDate);
    
    // Monthly vesting after cliff
    const monthlyVesting = Math.floor(totalShares / totalMonths);
    
    // For each month in the vesting period
    for (let i = 0; i <= totalMonths; i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + i);
      
      // Determine vested shares at this point
      let vestedShares = 0;
      
      if (i >= cliffMonths) {
        if (i === cliffMonths) {
          // At cliff, vest all shares that would have vested monthly up to this point
          vestedShares = monthlyVesting * cliffMonths;
        } else {
          // After cliff, add monthly vesting
          vestedShares = monthlyVesting * i;
        }
      }
      
      // Ensure we don't exceed total shares
      vestedShares = Math.min(vestedShares, totalShares);
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        vestedShares,
        vestedValue: vestedShares * scenario.currentFMV,
        month: i,
      });
    }
    
    return data;
  };

  // Helper function to calculate months between two dates
  const monthDiff = (startDate, endDate) => {
    return (
      endDate.getMonth() -
      startDate.getMonth() +
      12 * (endDate.getFullYear() - startDate.getFullYear())
    );
  };

  // Tax calculation functions
  const calculateQualifiedIsoTax = (shares, strikePrice, sellPrice) => {
    const basis = shares * strikePrice;
    const proceeds = shares * sellPrice;
    const gain = proceeds - basis;
    const longTermCapitalGainsTax = gain * 0.15; // Typical long-term rate
    return longTermCapitalGainsTax;
  };

  const calculateDisqualifiedIsoTax = (shares, strikePrice, sellPrice, taxRate) => {
    const basis = shares * strikePrice;
    const proceeds = shares * sellPrice;
    const gain = proceeds - basis;
    const ordinaryIncomeTax = gain * (taxRate / 100);
    return ordinaryIncomeTax;
  };

  const calculateNsoTax = (shares, strikePrice, sellPrice, taxRate) => {
    const basis = shares * strikePrice;
    const proceeds = shares * sellPrice;
    const spread = shares * (sellPrice - strikePrice);
    const ordinaryIncomeTax = spread * (taxRate / 100);
    return ordinaryIncomeTax;
  };

  const calculateRsuTax = (shares, vestPrice, sellPrice, taxRate) => {
    const ordinaryIncomeTax = shares * vestPrice * (taxRate / 100);
    const capitalGainsTax = shares * (sellPrice - vestPrice) * 0.15;
    return ordinaryIncomeTax + capitalGainsTax;
  };
  
  // Handle quiz answer selection
  const handleQuizAnswerSelect = (questionId, answerId) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answerId
      }
    }));
  };
  
  // Handle quiz navigation
  const handleQuizNext = () => {
    if (quizState.currentQuestion < quizQuestions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }));
    } else {
      // Show results if we're at the last question
      setQuizState(prev => ({
        ...prev,
        showResults: true
      }));
      
      // Calculate score and save results
      const score = calculateQuizScore();
      saveQuizResults('equity_basics_quiz', {
        score,
        totalQuestions: quizQuestions.length,
        answers: quizState.answers,
        completedAt: new Date().toISOString()
      });
    }
  };
  
  // Calculate quiz score
  const calculateQuizScore = () => {
    return quizQuestions.reduce((score, question) => {
      return score + (quizState.answers[question.id] === question.correctAnswer ? 1 : 0);
    }, 0);
  };
  
  // Handle quiz restart
  const handleQuizRestart = () => {
    setQuizState({
      currentQuestion: 0,
      answers: {},
      showResults: false
    });
  };
  
  // Handle simulation choice
  const handleSimulationChoice = (choiceId, nextStep) => {
    setSimulationState(prev => ({
      ...prev,
      step: prev.step + 1,
      choices: {
        ...prev.choices,
        [prev.step]: choiceId
      },
      outcome: nextStep.startsWith('outcome') ? nextStep : null
    }));
  };
  
  // Reset simulation
  const handleSimulationReset = () => {
    setSimulationState({
      step: 0,
      choices: {},
      outcome: null
    });
  };
  
  // Get current simulation step
  const getCurrentSimulationStep = () => {
    const scenario = simulationScenarios[0]; // Just using the first scenario for now
    
    if (simulationState.outcome) {
      return { type: 'outcome', data: scenario.outcomes[simulationState.outcome] };
    }
    
    if (simulationState.step === 0) {
      return { type: 'step', data: scenario.steps[0] };
    }
    
    const previousChoice = simulationState.choices[simulationState.step - 1];
    const previousStep = scenario.steps[simulationState.step - 1];
    const nextStepId = previousStep.choices.find(c => c.id === previousChoice)?.next;
    
    if (!nextStepId) return null;
    
    const nextStep = scenario.steps.find(s => s.id === nextStepId);
    return { type: 'step', data: nextStep };
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="calculator" className="flex items-center">
            <Calculator className="h-4 w-4 mr-2" /> 
            Equity Calculator
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center">
            <HelpCircle className="h-4 w-4 mr-2" /> 
            Equity Quiz
          </TabsTrigger>
          <TabsTrigger value="simulation" className="flex items-center">
            <LineChart className="h-4 w-4 mr-2" /> 
            Decision Simulation
          </TabsTrigger>
        </TabsList>

        {/* Equity Calculator Module */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Interactive Equity Calculator
              </CardTitle>
              <CardDescription>
                Adjust the parameters to see how they affect your equity outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="parameters" value={activeView} onValueChange={setActiveView}>
                <TabsList>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  <TabsTrigger value="visualization">Visualization</TabsTrigger>
                  <TabsTrigger value="explanation">Explanation</TabsTrigger>
                </TabsList>

                <TabsContent value="parameters" className="space-y-4">
                  {/* Input parameters UI */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Grant type selection */}
                    <div className="space-y-2">
                      <Label htmlFor="grantType" className="flex items-center">
                        Grant Type
                        <EnhancedTooltip
                          term="Grant Type"
                          basicDefinition="The type of equity award you received. Different types have different tax implications."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Select
                        value={scenario.grantType}
                        onValueChange={(value) =>
                          setScenario({ ...scenario, grantType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grant type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ISO">ISO - Incentive Stock Options</SelectItem>
                          <SelectItem value="NSO">NSO - Non-qualified Stock Options</SelectItem>
                          <SelectItem value="RSU">RSU - Restricted Stock Units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Number of shares */}
                    <div className="space-y-2">
                      <Label htmlFor="shares" className="flex items-center">
                        Number of Shares
                        <EnhancedTooltip
                          term="Shares"
                          basicDefinition="The total number of shares in your equity grant."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Input
                        id="shares"
                        type="number"
                        value={scenario.shares}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            shares: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Strike price - only for options */}
                    {(scenario.grantType === "ISO" || scenario.grantType === "NSO") && (
                      <div className="space-y-2">
                        <Label htmlFor="strikePrice" className="flex items-center">
                          Strike Price ($)
                          <EnhancedTooltip
                            term="Strike Price"
                            basicDefinition="The price you'll pay to exercise each option."
                          >
                            <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                          </EnhancedTooltip>
                        </Label>
                        <Input
                          id="strikePrice"
                          type="number"
                          step="0.01"
                          value={scenario.strikePrice}
                          onChange={(e) =>
                            setScenario({
                              ...scenario,
                              strikePrice: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    )}

                    {/* Current fair market value */}
                    <div className="space-y-2">
                      <Label htmlFor="currentFMV" className="flex items-center">
                        Current FMV ($)
                        <EnhancedTooltip
                          term="Fair Market Value"
                          basicDefinition="The current value of each share according to the company's latest 409A valuation."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Input
                        id="currentFMV"
                        type="number"
                        step="0.01"
                        value={scenario.currentFMV}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            currentFMV: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Vesting start date */}
                    <div className="space-y-2">
                      <Label htmlFor="vestingStart" className="flex items-center">
                        Vesting Start Date
                        <EnhancedTooltip
                          term="Vesting Start Date"
                          basicDefinition="The date your vesting period begins, often your start date at the company."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Input
                        id="vestingStart"
                        type="date"
                        value={new Date(scenario.vestingStart).toISOString().split('T')[0]}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            vestingStart: new Date(e.target.value),
                          })
                        }
                      />
                    </div>

                    {/* Vesting end date */}
                    <div className="space-y-2">
                      <Label htmlFor="vestingEnd" className="flex items-center">
                        Vesting End Date
                        <EnhancedTooltip
                          term="Vesting End Date"
                          basicDefinition="The date when all your shares will be fully vested."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Input
                        id="vestingEnd"
                        type="date"
                        value={new Date(scenario.vestingEnd).toISOString().split('T')[0]}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            vestingEnd: new Date(e.target.value),
                          })
                        }
                      />
                    </div>
                    
                    {/* Vesting schedule */}
                    <div className="space-y-2">
                      <Label htmlFor="vestingSchedule" className="flex items-center">
                        Vesting Schedule
                        <EnhancedTooltip
                          term="Vesting Schedule"
                          basicDefinition="How frequently shares vest after the cliff period."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Select
                        value={scenario.vestingSchedule}
                        onValueChange={(value) =>
                          setScenario({ ...scenario, vestingSchedule: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vesting schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Cliff period */}
                    <div className="space-y-2">
                      <Label htmlFor="cliffPeriod" className="flex items-center">
                        Cliff Period (months)
                        <EnhancedTooltip
                          term="Cliff Period"
                          basicDefinition="The period before your first shares vest. Typically 12 months (1 year) at most companies."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Input
                        id="cliffPeriod"
                        type="number"
                        value={scenario.cliffPeriod}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            cliffPeriod: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Exit price */}
                    <div className="space-y-2">
                      <Label htmlFor="exitPrice" className="flex items-center">
                        Assumed Exit Price ($)
                        <EnhancedTooltip
                          term="Exit Price"
                          basicDefinition="The estimated share price when you sell, used to calculate potential gains."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <Input
                        id="exitPrice"
                        type="number"
                        step="0.01"
                        value={scenario.exitPrice}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            exitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Tax rate */}
                    <div className="space-y-2">
                      <Label htmlFor="taxRate" className="flex items-center">
                        Estimated Tax Rate (%)
                        <EnhancedTooltip
                          term="Tax Rate"
                          basicDefinition="Your estimated marginal tax rate, used to calculate tax implications."
                        >
                          <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                        </EnhancedTooltip>
                      </Label>
                      <div className="pt-2">
                        <Slider 
                          id="taxRate"
                          min={0}
                          max={50}
                          step={1}
                          value={[scenario.taxRate]}
                          onValueChange={(value) => 
                            setScenario({
                              ...scenario,
                              taxRate: value[0],
                            })
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0%</span>
                          <span>{scenario.taxRate}%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={updateResults}
                    className="w-full"
                  >
                    Calculate Results
                  </Button>
                </TabsContent>

                <TabsContent value="visualization">
                  {results ? (
                    <div className="space-y-6">
                      {/* Tax impact visualization */}
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                          Financial Breakdown
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                {
                                  name: "Exercise Cost",
                                  value: results.exerciseCost,
                                },
                                {
                                  name: "Taxes",
                                  value: results.taxResults.total_tax,
                                },
                                {
                                  name: "Net Proceeds",
                                  value: results.netProceeds,
                                },
                              ]}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis 
                                tickFormatter={(value) => 
                                  `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                                }
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `$${value.toLocaleString()}`,
                                  "",
                                ]}
                              />
                              <Bar 
                                dataKey="value" 
                                fill={(entry) => entry.name === "Net Proceeds" ? "#4f46e5" : "#94a3b8"}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Vesting schedule visualization */}
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <LineChart className="h-5 w-5 mr-2 text-primary" />
                          Vesting Timeline
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsLineChart
                              data={results.vestingTimelineData}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                              />
                              <YAxis yAxisId="left" 
                                tickFormatter={(value) => 
                                  `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                                }
                              />
                              <YAxis yAxisId="right" orientation="right" 
                                tickFormatter={(value) => 
                                  `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                                }
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === 'vestedShares') {
                                    return [value.toLocaleString(), 'Vested Shares'];
                                  }
                                  return [`$${value.toLocaleString()}`, 'Vested Value'];
                                }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="stepAfter"
                                dataKey="vestedShares"
                                stroke="#4f46e5"
                                name="Vested Shares"
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                yAxisId="right"
                                type="stepAfter"
                                dataKey="vestedValue"
                                stroke="#10b981"
                                name="Vested Value"
                                strokeWidth={2}
                                dot={false}
                              />
                            </RechartsLineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Tax comparison by grant type */}
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <PieChart className="h-5 w-5 mr-2 text-primary" />
                          Tax Comparison by Grant Type
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={results.taxComparisonData}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis
                                tickFormatter={(value) => 
                                  `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                                }
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `$${value.toLocaleString()}`,
                                  "Estimated Tax",
                                ]}
                              />
                              <Bar
                                dataKey="taxes"
                                name="Estimated Tax"
                                fill={(entry) => {
                                  // Highlight the current grant type
                                  if (
                                    (entry.name === "ISO (Qualified)" && scenario.grantType === "ISO") ||
                                    (entry.name === "NSO" && scenario.grantType === "NSO") ||
                                    (entry.name === "RSU" && scenario.grantType === "RSU")
                                  ) {
                                    return "#4f46e5";
                                  }
                                  return "#94a3b8";
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <Calculator className="h-12 w-12 text-muted-foreground" />
                      <p className="text-center text-muted-foreground">
                        Click "Calculate Results" to see visualizations
                      </p>
                      <Button onClick={updateResults}>Calculate Now</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="explanation">
                  {results ? (
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">What This Means</h3>
                        <p>
                          Based on your parameters, you would have{" "}
                          {results.vestedShares.toLocaleString()} vested shares worth $
                          {(results.vestedShares * scenario.currentFMV).toLocaleString()}{" "}
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
                        <div className="space-y-2 border p-4 rounded-lg">
                          <h3 className="text-md font-medium flex items-center">
                            <Badge className="mr-2">ISO</Badge>
                            ISO Tax Considerations
                          </h3>
                          <p>
                            ISOs offer potential tax advantages, but come with AMT
                            implications:
                          </p>
                          <ul className="list-disc pl-5">
                            <li>No regular tax at exercise (but may trigger AMT)</li>
                            <li>
                              Long-term capital gains if held for &gt; 1 year after
                              exercise and &gt; 2 years after grant
                            </li>
                            <li>
                              AMT liability in this scenario: $
                              {results.taxResults.amt_liability.toLocaleString()}
                            </li>
                          </ul>
                          
                          <Alert className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>AMT Consideration</AlertTitle>
                            <AlertDescription>
                              Exercise of ISOs may trigger Alternative Minimum Tax (AMT) on the spread between exercise price and FMV at exercise.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {scenario.grantType === "NSO" && (
                        <div className="space-y-2 border p-4 rounded-lg">
                          <h3 className="text-md font-medium flex items-center">
                            <Badge className="mr-2">NSO</Badge>
                            NSO Tax Considerations
                          </h3>
                          <p>
                            NSOs have more straightforward but typically higher taxation:
                          </p>
                          <ul className="list-disc pl-5">
                            <li>The spread between strike price and FMV at exercise is taxed as ordinary income</li>
                            <li>Withholding is required at exercise (income + payroll taxes)</li>
                            <li>Any appreciation after exercise may qualify for capital gains treatment</li>
                            <li>No AMT implications</li>
                          </ul>
                        </div>
                      )}

                      {scenario.grantType === "RSU" && (
                        <div className="space-y-2 border p-4 rounded-lg">
                          <h3 className="text-md font-medium flex items-center">
                            <Badge className="mr-2">RSU</Badge>
                            RSU Tax Considerations
                          </h3>
                          <p>
                            RSUs have a simpler structure but are taxed at vesting:
                          </p>
                          <ul className="list-disc pl-5">
                            <li>Full value of shares taxed as ordinary income at vesting</li>
                            <li>Automatic withholding of shares for taxes typically occurs</li>
                            <li>No exercise decision needed (shares are simply delivered upon vesting)</li>
                            <li>Any appreciation after vesting may qualify for capital gains treatment</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Tax planning advice */}
                      <div className="border p-4 rounded-lg bg-primary/5">
                        <h3 className="text-md font-medium mb-2">Tax Planning Tips</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">Consider Exercise Timing</h4>
                              <p className="text-sm text-muted-foreground">
                                Exercising early when the FMV is close to the strike price can minimize tax impact.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">File 83(b) for Early Exercises</h4>
                              <p className="text-sm text-muted-foreground">
                                If you exercise unvested options, consider filing an 83(b) election within 30 days.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">Plan for AMT Impact</h4>
                              <p className="text-sm text-muted-foreground">
                                For ISOs, exercise in stages or late in the tax year to better manage AMT liability.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">Consider Holding Periods</h4>
                              <p className="text-sm text-muted-foreground">
                                Holding ISOs for at least 1 year after exercise and 2 years after grant may qualify for preferential tax treatment.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <Calculator className="h-12 w-12 text-muted-foreground" />
                      <p className="text-center text-muted-foreground">
                        Click "Calculate Results" to see explanations
                      </p>
                      <Button onClick={updateResults}>Calculate Now</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveView("parameters")}>
                Edit Parameters
              </Button>
              <Button onClick={updateResults}>Recalculate</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Equity Quiz Module */}
        <TabsContent value="quiz" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Equity Basics Quiz
              </CardTitle>
              <CardDescription>
                Test your knowledge of equity compensation concepts
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {quizState.showResults ? (
                // Quiz results view
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-medium">Quiz Complete!</h3>
                    <div className="mt-2 mb-4">
                      <Badge className="text-lg px-3 py-1">
                        Score: {calculateQuizScore()}/{quizQuestions.length}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      {calculateQuizScore() === quizQuestions.length ? (
                        <div className="flex items-center text-green-600">
                          <Award className="h-6 w-6 mr-2" />
                          <span className="text-lg">Perfect Score!</span>
                        </div>
                      ) : calculateQuizScore() >= quizQuestions.length * 0.7 ? (
                        <div className="flex items-center text-primary">
                          <Award className="h-6 w-6 mr-2" />
                          <span className="text-lg">Great job!</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600">
                          <AlertCircle className="h-6 w-6 mr-2" />
                          <span className="text-lg">Keep learning!</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Review Your Answers</h3>
                    
                    {quizQuestions.map((question, index) => {
                      const isCorrect = quizState.answers[question.id] === question.correctAnswer;
                      const userAnswer = question.options.find(opt => opt.id === quizState.answers[question.id])?.text;
                      const correctAnswer = question.options.find(opt => opt.id === question.correctAnswer)?.text;
                      
                      return (
                        <div 
                          key={question.id} 
                          className={`p-4 rounded-lg border ${
                            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="mr-2 mt-1">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{index + 1}. {question.question}</h4>
                              
                              <div className="mt-2 space-y-1">
                                <p className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                                  <span className="font-medium">Your answer:</span> {userAnswer}
                                </p>
                                
                                {!isCorrect && (
                                  <p className="text-green-800">
                                    <span className="font-medium">Correct answer:</span> {correctAnswer}
                                  </p>
                                )}
                              </div>
                              
                              <p className="mt-2 text-sm">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Quiz question view
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      Question {quizState.currentQuestion + 1} of {quizQuestions.length}
                    </Badge>
                    
                    {/* Progress bar */}
                    <div className="w-1/2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ 
                          width: `${((quizState.currentQuestion + 1) / quizQuestions.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      {quizQuestions[quizState.currentQuestion].question}
                    </h3>
                    
                    <RadioGroup 
                      value={quizState.answers[quizQuestions[quizState.currentQuestion].id] || ""}
                      onValueChange={(value) => {
                        handleQuizAnswerSelect(
                          quizQuestions[quizState.currentQuestion].id,
                          value
                        );
                      }}
                      className="space-y-3"
                    >
                      {quizQuestions[quizState.currentQuestion].options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={option.id} 
                            id={`option-${option.id}`} 
                            className="peer"
                          />
                          <Label 
                            htmlFor={`option-${option.id}`}
                            className="flex-1 p-3 border rounded-lg peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                          >
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {quizState.showResults ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleQuizRestart}
                  >
                    Restart Quiz
                  </Button>
                  <Button 
                    onClick={() => {
                      // Mark concept as viewed to track progress
                      markConceptViewed('equity_basics_quiz');
                    }}
                  >
                    Continue Learning
                  </Button>
                </>
              ) : (
                <>
                  <div></div> {/* Empty div to maintain space-between layout */}
                  <Button 
                    onClick={handleQuizNext}
                    disabled={!quizState.answers[quizQuestions[quizState.currentQuestion].id]}
                  >
                    {quizState.currentQuestion < quizQuestions.length - 1 ? (
                      <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      "Submit Answers"
                    )}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Decision Simulation Module */}
        <TabsContent value="simulation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Equity Decision Simulation
              </CardTitle>
              <CardDescription>
                Walk through common equity scenarios to practice decision-making
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {simulationScenarios.length > 0 && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium">{simulationScenarios[0].title}</h3>
                    <p className="text-muted-foreground mt-1">{simulationScenarios[0].description}</p>
                  </div>
                  
                  {/* Simulation content */}
                  <div className="min-h-[250px]">
                    {getCurrentSimulationStep()?.type === 'step' && (
                      <div className="space-y-6">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Scenario</AlertTitle>
                          <AlertDescription>
                            {getCurrentSimulationStep().data.prompt}
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">What would you do?</h4>
                          {getCurrentSimulationStep().data.choices.map(choice => (
                            <Button 
                              key={choice.id}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-3 px-4"
                              onClick={() => handleSimulationChoice(choice.id, choice.next)}
                            >
                              {choice.text}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {getCurrentSimulationStep()?.type === 'outcome' && (
                      <div className="space-y-6">
                        <div className={`p-6 rounded-lg ${
                          getCurrentSimulationStep().data.favorability === 'good' 
                            ? 'bg-green-50 border border-green-200' 
                            : getCurrentSimulationStep().data.favorability === 'neutral'
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <h3 className="text-lg font-medium mb-2">
                            {getCurrentSimulationStep().data.title}
                          </h3>
                          <p>{getCurrentSimulationStep().data.description}</p>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">Key takeaways:</h4>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Different exercise strategies have varying tax implications</li>
                            <li>Early exercise can provide tax advantages but comes with upfront costs and risks</li>
                            <li>Timing your exercise and sale can significantly impact your net proceeds</li>
                            <li>Consider your personal financial situation and risk tolerance when making equity decisions</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleSimulationReset}
              >
                Restart Simulation
              </Button>
              
              {getCurrentSimulationStep()?.type === 'outcome' && (
                <Button onClick={() => markConceptViewed('equity_simulation')}>
                  Complete Simulation
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}