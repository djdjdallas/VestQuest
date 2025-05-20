"use client";

import { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  BarChart, 
  Calculator, 
  Calendar, 
  Check, 
  Clock, 
  DollarSign, 
  Edit, 
  HelpCircle,
  Info,
  Lightbulb, 
  LineChart, 
  PieChart, 
  Save, 
  TrendingUp 
} from "lucide-react";

import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { GRANT_TYPES, COMMON_SCENARIOS } from "@/utils/constants";
import { calculateComprehensiveTax } from "@/utils/enhancedTaxCalculations";
import { 
  calculateIPOTaxImpact,
  calculateAcquisitionTaxImpact,
  calculateSecondaryTaxImpact,
  analyzeExitStrategies
} from "@/utils/exitTaxCalculations";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Enhanced ScenarioBuilder component for exit planning
 * Supports modeling different exit scenarios (IPO, acquisition, secondary) with
 * comprehensive tax implications and visualization
 */
export default function ScenarioBuilder({ 
  grants = [], 
  financialProfile = {}, 
  onSaveScenario, 
  savedScenarios = [] 
}) {
  // State for scenario configuration
  const [scenarioName, setScenarioName] = useState("New Exit Scenario");
  const [activeTab, setActiveTab] = useState("exit");
  
  // Exit scenario state
  const [exitParams, setExitParams] = useState({
    type: "IPO",
    timing: "1-2",
    multiplier: 15,
    priceType: "multiple", // multiple or direct
    exitPrice: 0,
    timingSpecific: {
      years: 2,
      months: 0
    },
    useCustomMultiplier: false,
    liquidityEvent: "full", // full, partial, lockup
    liquidityRestriction: 180, // days
    probability: 70, // percentage
    dilution: 10, // percentage before exit
  });
  
  // Exercise strategy state
  const [exerciseParams, setExerciseParams] = useState({
    strategy: "partial", // all, partial, minimum, wait
    exercisePercentage: 50, // percentage of vested shares to exercise
    exerciseTiming: "now", // now, gradual, threshold
    isoDualQualification: true, // for ISO tax qualification
    exerciseBeforeIPOLockup: true, // exercise before lockup period
    exercisePlan: [ // for gradual exercise
      { month: 0, percentage: 20 },
      { month: 6, percentage: 30 },
      { month: 12, percentage: 50 },
    ],
  });
  
  // Tax strategy state
  const [taxParams, setTaxParams] = useState({
    filingStatus: "single",
    federalTaxRate: 35, // percentage
    stateTaxRate: 10, // percentage
    stateOfResidence: "California",
    stateAllocation: { // for multiple state allocation
      California: 100
    },
    capitalGainsRate: 20, // percentage
    includeAMT: true,
    amtRate: 26, // percentage
    otherIncome: financialProfile?.income || 150000,
    ltrStrategy: true, // long-term capital gains strategy
    sellTiming: "staggered", // all, staggered, 10b5-1
    sellPlan: [ // for staggered selling
      { month: 0, percentage: 30 },
      { month: 6, percentage: 30 },
      { month: 12, percentage: 40 },
    ],
  });
  
  // Comparison scenarios
  const [comparisonScenarios, setComparisonScenarios] = useState([
    { type: "IPO", name: "Conservative", multiplier: 10 },
    { type: "IPO", name: "Optimistic", multiplier: 25 },
  ]);
  
  // Results state
  const [scenarioResults, setScenarioResults] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [taxImpactData, setTaxImpactData] = useState([]);
  
  // Calculate base FMV from grants
  const baseFMV = useMemo(() => {
    if (!grants || grants.length === 0) return 1;
    return grants[0].current_fmv || 1;
  }, [grants]);
  
  // Calculate exit price based on parameters
  const calculateExitPrice = useMemo(() => {
    if (exitParams.priceType === "direct" && exitParams.exitPrice > 0) {
      return exitParams.exitPrice;
    }
    
    // If using a multiplier
    let multiplier = exitParams.useCustomMultiplier 
      ? exitParams.multiplier 
      : COMMON_SCENARIOS.find(s => s.name === `${exitParams.type} - Moderate`)?.multiplier || 15;
      
    return baseFMV * multiplier;
  }, [exitParams, baseFMV, COMMON_SCENARIOS]);
  
  // Calculate potential value of equity at exit
  const calculateEquityValue = useMemo(() => {
    if (!grants || grants.length === 0) return { current: 0, exit: 0 };
    
    const exitPrice = calculateExitPrice;
    const dilutionFactor = exitParams.dilution > 0 ? (100 - exitParams.dilution) / 100 : 1;
    
    // Current value calculation
    const currentValue = grants.reduce((sum, grant) => {
      const vestedShares = grant.vested_shares || 0;
      return sum + (vestedShares * grant.current_fmv);
    }, 0);
    
    // Exit value calculation
    const exitValue = grants.reduce((sum, grant) => {
      const totalShares = grant.shares || 0;
      // Assume all grants are fully vested at exit
      return sum + (totalShares * exitPrice * dilutionFactor);
    }, 0);
    
    return {
      current: currentValue,
      exit: exitValue,
      growthMultiple: currentValue > 0 ? exitValue / currentValue : 0
    };
  }, [grants, calculateExitPrice, exitParams.dilution]);
  
  // Calculate tax impact for different strategies with advanced exit-specific calculations
  const calculateTaxImpact = () => {
    if (!grants || grants.length === 0) return [];
    
    const exitPrice = calculateExitPrice;
    const exitDate = getExitDate(new Date(), exitParams.timing);
    const taxImpacts = [];
    
    const baseTaxSettings = {
      filingStatus: taxParams.filingStatus,
      stateOfResidence: taxParams.stateOfResidence,
      otherIncome: taxParams.otherIncome,
      includeAMT: taxParams.includeAMT,
      stateRate: taxParams.stateTaxRate / 100,
    };
    
    // Use specialized exit tax calculations based on exit type
    let exitSpecificResults;
    
    switch(exitParams.type) {
      case "IPO":
        exitSpecificResults = calculateIPOTaxImpact({
          grants,
          exerciseStrategy: exerciseParams.strategy,
          exerciseParams,
          exitParams: {
            exitPrice,
            lockupPeriod: exitParams.liquidityRestriction || 180,
            ipoDate: exitDate
          },
          taxParams: baseTaxSettings
        });
        break;
        
      case "Acquisition":
        exitSpecificResults = calculateAcquisitionTaxImpact({
          grants,
          exerciseParams,
          acquisitionParams: {
            exitPrice,
            cashPercentage: 70, // Default to 70% cash, 30% stock
            hasEarnout: false,
            acquisitionDate: exitDate
          },
          taxParams: baseTaxSettings
        });
        break;
        
      case "Secondary":
        exitSpecificResults = calculateSecondaryTaxImpact({
          grants,
          exerciseParams,
          secondaryParams: {
            exitPrice,
            discount: 20, // Default 20% discount to primary
            salePercentage: exerciseParams.exercisePercentage,
            saleDate: exitDate
          },
          taxParams: baseTaxSettings
        });
        break;
        
      default:
        // Fallback to basic calculation if no specific exit type
        // Calculate for each grant
        grants.forEach(grant => {
          if (grant.grant_type === GRANT_TYPES.ISO || grant.grant_type === GRANT_TYPES.NSO) {
            const vestedShares = grant.vested_shares || 0;
            
            // Strategy 1: Exercise now (early)
            const exerciseEarlySettings = {
              ...baseTaxSettings,
              exerciseDate: new Date(),
              saleDate: exitDate,
            };
            
            const sharesToExerciseEarly = Math.floor(vestedShares * (exerciseParams.exercisePercentage / 100));
            
            const earlyResult = calculateComprehensiveTax(
              grant,
              grant.strike_price,
              exitPrice,
              sharesToExerciseEarly,
              exerciseEarlySettings
            );
            
            // Strategy 2: Exercise at exit
            const exerciseAtExitSettings = {
              ...baseTaxSettings,
              exerciseDate: exitDate,
              saleDate: exitDate,
            };
            
            const exitResult = calculateComprehensiveTax(
              grant,
              grant.strike_price,
              exitPrice,
              vestedShares,
              exerciseAtExitSettings
            );
            
            // Add to results
            taxImpacts.push({
              grantId: grant.id,
              grantType: grant.grant_type,
              shares: vestedShares,
              strategies: [
                { 
                  name: "Exercise Now",
                  taxImpact: earlyResult.totals.totalTax,
                  netProceeds: earlyResult.totals.netProceeds,
                  roi: earlyResult.exerciseCost > 0 ? earlyResult.totals.netProceeds / earlyResult.exerciseCost : 0,
                  details: earlyResult
                },
                {
                  name: "Exercise at Exit",
                  taxImpact: exitResult.totals.totalTax,
                  netProceeds: exitResult.totals.netProceeds,
                  roi: exitResult.exerciseCost > 0 ? exitResult.totals.netProceeds / exitResult.exerciseCost : 0,
                  details: exitResult
                }
              ]
            });
          }
        });
    }
    
    // If we have exit-specific results, format them for the component
    if (exitSpecificResults) {
      // Process exit-specific results based on exit type
      switch(exitParams.type) {
        case "IPO":
          // For IPO, we have early exercise, exercise at exit, and staggered strategies
          exitSpecificResults.earlyExercise.details.forEach(detail => {
            taxImpacts.push({
              grantId: detail.grantId,
              grantType: detail.grantType,
              shares: detail.shares,
              strategies: [
                {
                  name: "Exercise Now",
                  taxImpact: detail.result.totals.totalTax,
                  netProceeds: detail.result.totals.netProceeds,
                  roi: detail.result.exerciseCost > 0 ? detail.result.totals.netProceeds / detail.result.exerciseCost : 0,
                  details: detail.result
                },
                {
                  name: "Exercise at Exit",
                  taxImpact: exitSpecificResults.exerciseAtExit.details.find(d => d.grantId === detail.grantId)?.result.totals.totalTax || 0,
                  netProceeds: exitSpecificResults.exerciseAtExit.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds || 0,
                  roi: exitSpecificResults.exerciseAtExit.details.find(d => d.grantId === detail.grantId)?.result.exerciseCost > 0 ? 
                       exitSpecificResults.exerciseAtExit.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds / 
                       exitSpecificResults.exerciseAtExit.details.find(d => d.grantId === detail.grantId)?.result.exerciseCost : 0,
                  details: exitSpecificResults.exerciseAtExit.details.find(d => d.grantId === detail.grantId)?.result || {}
                },
                {
                  name: "Staggered Exercise",
                  taxImpact: exitSpecificResults.staggeredExercise.details.find(d => d.grantId === detail.grantId)?.result.totals.totalTax || 0,
                  netProceeds: exitSpecificResults.staggeredExercise.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds || 0,
                  roi: 0, // Complex to calculate for staggered exercise
                  details: exitSpecificResults.staggeredExercise.details.find(d => d.grantId === detail.grantId)?.result || {}
                }
              ],
              // Add IPO-specific lockup considerations
              lockupConsiderations: exitSpecificResults.lockupConsiderations
            });
          });
          break;
          
        case "Acquisition":
          // For acquisition, we have cash deal, stock deal, and mixed deal strategies
          exitSpecificResults.cashDeal.details.forEach(detail => {
            taxImpacts.push({
              grantId: detail.grantId,
              grantType: detail.grantType,
              shares: detail.shares,
              strategies: [
                {
                  name: "Cash Deal",
                  taxImpact: detail.result.totals.totalTax,
                  netProceeds: detail.result.totals.netProceeds,
                  roi: detail.result.exerciseCost > 0 ? detail.result.totals.netProceeds / detail.result.exerciseCost : 0,
                  details: detail.result
                },
                {
                  name: "Stock Deal",
                  taxImpact: exitSpecificResults.stockDeal.details.find(d => d.grantId === detail.grantId)?.result.totals.totalTax || 0,
                  netProceeds: exitSpecificResults.stockDeal.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds || 0,
                  roi: exitSpecificResults.stockDeal.details.find(d => d.grantId === detail.grantId)?.result.exerciseCost > 0 ? 
                       exitSpecificResults.stockDeal.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds / 
                       exitSpecificResults.stockDeal.details.find(d => d.grantId === detail.grantId)?.result.exerciseCost : 0,
                  details: exitSpecificResults.stockDeal.details.find(d => d.grantId === detail.grantId)?.result || {}
                },
                {
                  name: "Mixed Deal (70/30)",
                  taxImpact: exitSpecificResults.mixedDeal.details.find(d => d.grantId === detail.grantId)?.result.totals.totalTax || 0,
                  netProceeds: exitSpecificResults.mixedDeal.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds || 0,
                  roi: 0, // Complex to calculate for mixed deals
                  details: exitSpecificResults.mixedDeal.details.find(d => d.grantId === detail.grantId)?.result || {}
                }
              ],
              // Add acquisition-specific considerations
              structuringOptions: exitSpecificResults.structuringOptions
            });
          });
          break;
          
        case "Secondary":
          // For secondary, we have sell all, sell partial, and staggered sales strategies
          exitSpecificResults.sellAll.details.forEach(detail => {
            taxImpacts.push({
              grantId: detail.grantId,
              grantType: detail.grantType,
              shares: detail.shares,
              strategies: [
                {
                  name: "Sell All",
                  taxImpact: detail.result.totals.totalTax,
                  netProceeds: detail.result.totals.netProceeds,
                  roi: detail.result.exerciseCost > 0 ? detail.result.totals.netProceeds / detail.result.exerciseCost : 0,
                  details: detail.result
                },
                {
                  name: "Sell Partial",
                  taxImpact: exitSpecificResults.sellPartial.details.find(d => d.grantId === detail.grantId)?.result.totals.totalTax || 0,
                  netProceeds: exitSpecificResults.sellPartial.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds || 0,
                  roi: exitSpecificResults.sellPartial.details.find(d => d.grantId === detail.grantId)?.result.exerciseCost > 0 ? 
                       exitSpecificResults.sellPartial.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds / 
                       exitSpecificResults.sellPartial.details.find(d => d.grantId === detail.grantId)?.result.exerciseCost : 0,
                  details: exitSpecificResults.sellPartial.details.find(d => d.grantId === detail.grantId)?.result || {}
                },
                {
                  name: "Staggered Sales",
                  taxImpact: exitSpecificResults.staggeredSales.details.find(d => d.grantId === detail.grantId)?.result.totals.totalTax || 0,
                  netProceeds: exitSpecificResults.staggeredSales.details.find(d => d.grantId === detail.grantId)?.result.totals.netProceeds || 0,
                  roi: 0, // Complex to calculate for staggered sales
                  details: exitSpecificResults.staggeredSales.details.find(d => d.grantId === detail.grantId)?.result || {}
                }
              ],
              // Add secondary-specific considerations
              specialConsiderations: exitSpecificResults.specialConsiderations
            });
          });
          break;
      }
    }
    
    return taxImpacts;
  };
  
  // Generate time series data for exit planning
  const generateTimeSeriesData = () => {
    if (!grants || grants.length === 0) return [];
    
    const timeSeriesData = [];
    const now = new Date();
    let exitTime;
    
    switch(exitParams.timing) {
      case "0-6":
        exitTime = { years: 0, months: 3 }; // middle of 0-6 months
        break;
      case "6-12":
        exitTime = { years: 0, months: 9 }; // middle of 6-12 months
        break;
      case "1-2":
        exitTime = { years: 1, months: 6 }; // middle of 1-2 years
        break;
      case "2+":
        exitTime = { years: 3, months: 0 }; // 3 years for 2+
        break;
      default:
        exitTime = { years: 1, months: 6 };
    }
    
    // Generate monthly data points
    const totalMonths = exitTime.years * 12 + exitTime.months + 6; // Add 6 more months after exit
    
    for (let month = 0; month <= totalMonths; month++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + month);
      
      const isPostExit = month > exitTime.years * 12 + exitTime.months;
      const isAtExit = month === exitTime.years * 12 + exitTime.months;
      
      // Simplified growth calculation
      const growthRate = 1 + (0.2 / 12); // 20% annual growth, monthly compound
      const growthFactor = Math.pow(growthRate, month);
      
      // At exit, apply the exit multiplier
      const exitMultiplier = isAtExit || isPostExit ? exitParams.multiplier : 1;
      
      const fmv = baseFMV * growthFactor * (isAtExit || isPostExit ? exitMultiplier : 1);
      
      // Calculate values for different strategies
      let earlyExerciseValue = 0;
      let exitExerciseValue = 0;
      let waitValue = 0;
      
      grants.forEach(grant => {
        if (grant.grant_type === GRANT_TYPES.ISO || grant.grant_type === GRANT_TYPES.NSO) {
          const vestedShares = grant.vested_shares || 0;
          
          // Early exercise strategy
          const earlyExerciseShares = Math.floor(vestedShares * (exerciseParams.exercisePercentage / 100));
          const earlyExerciseCost = earlyExerciseShares * grant.strike_price;
          
          // Only include exercise cost at month 0 for early exercise
          const earlyExerciseNet = earlyExerciseShares * fmv - (month === 0 ? earlyExerciseCost : 0);
          
          // Exit exercise strategy - only apply at or after exit
          const exitCost = isAtExit ? vestedShares * grant.strike_price : 0;
          const exitValue = vestedShares * fmv - (isAtExit ? exitCost : 0);
          
          earlyExerciseValue += earlyExerciseNet;
          exitExerciseValue += exitValue;
        }
      });
      
      timeSeriesData.push({
        month,
        date: date.toLocaleDateString(),
        isExit: isAtExit,
        fmv,
        "Early Exercise": earlyExerciseValue,
        "Exercise at Exit": exitExerciseValue,
      });
    }
    
    return timeSeriesData;
  };
  
  // Helper function to convert timing to date
  const getExitDate = (baseDate, timing) => {
    const date = new Date(baseDate);
    switch (timing) {
      case "0-6":
        date.setMonth(date.getMonth() + 3); // Middle of 0-6 range
        break;
      case "6-12":
        date.setMonth(date.getMonth() + 9); // Middle of 6-12 range
        break;
      case "1-2":
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(date.getMonth() + 6); // Middle of 1-2 years
        break;
      case "2+":
        date.setFullYear(date.getFullYear() + 3); // Default to 3 years
        break;
      default:
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(date.getMonth() + 6);
    }
    return date;
  };
  
  // Generate tax breakdown data with exit-specific strategies
  const generateTaxBreakdown = () => {
    if (!grants || grants.length === 0) return [];
    
    // Calculate tax impact for each strategy
    const taxImpact = calculateTaxImpact();
    if (!taxImpact.length) return [];
    
    // Extract data for charts
    const taxBreakdowns = [];
    const strategies = {};
    
    // Find all available strategies based on exit type
    taxImpact.forEach(grant => {
      grant.strategies.forEach(strategy => {
        if (!strategies[strategy.name]) {
          strategies[strategy.name] = {
            federal: 0,
            state: 0,
            amt: 0,
            total: 0
          };
        }
        
        strategies[strategy.name].federal += strategy.details.federal?.federalTax || 0;
        strategies[strategy.name].state += strategy.details.state?.stateTax || 0;
        strategies[strategy.name].amt += strategy.details.amt?.netAMTDue || 0;
      });
    });
    
    // Convert to array and calculate totals
    Object.entries(strategies).forEach(([name, breakdown]) => {
      const total = breakdown.federal + breakdown.state + breakdown.amt;
      taxBreakdowns.push({
        name,
        federal: breakdown.federal,
        state: breakdown.state,
        amt: breakdown.amt,
        total
      });
    });
    
    return taxBreakdowns;
  };
  
  // Save the scenario
  const handleSaveScenario = () => {
    // Calculate all the scenario data
    const taxImpact = calculateTaxImpact();
    const timeData = generateTimeSeriesData();
    const equityValue = calculateEquityValue;
    
    const scenarioData = {
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      exitType: exitParams.type,
      exitTiming: exitParams.timing,
      exitPrice: calculateExitPrice,
      currentValue: equityValue.current,
      exitValue: equityValue.exit,
      growthMultiple: equityValue.growthMultiple,
      exerciseStrategy: exerciseParams.strategy,
      exercisePercentage: exerciseParams.exercisePercentage,
      taxStrategy: {
        filingStatus: taxParams.filingStatus,
        stateOfResidence: taxParams.stateOfResidence,
        federalRate: taxParams.federalTaxRate,
        stateRate: taxParams.stateTaxRate,
        includeAMT: taxParams.includeAMT,
      },
      taxImpact,
      createdAt: new Date().toISOString(),
    };
    
    if (onSaveScenario) {
      onSaveScenario(scenarioData);
    }
  };
  
  // Handle exit parameter changes
  const handleExitParamChange = (key, value) => {
    setExitParams({
      ...exitParams,
      [key]: value
    });
  };
  
  // Handle exercise parameter changes
  const handleExerciseParamChange = (key, value) => {
    setExerciseParams({
      ...exerciseParams,
      [key]: value
    });
  };
  
  // Handle tax parameter changes
  const handleTaxParamChange = (key, value) => {
    setTaxParams({
      ...taxParams,
      [key]: value
    });
  };
  
  // Update all data points when parameters change with exit-specific analysis
  const calculateAllResults = () => {
    const taxImpact = calculateTaxImpact();
    setTaxImpactData(generateTaxBreakdown());
    setTimeSeriesData(generateTimeSeriesData());
    
    if (taxImpact.length > 0) {
      // Initialize strategy results for each exit type
      const strategySums = {};
      
      // Calculate sums for each available strategy
      taxImpact.forEach(grant => {
        grant.strategies.forEach(strategy => {
          if (!strategySums[strategy.name]) {
            strategySums[strategy.name] = {
              netProceeds: 0,
              taxImpact: 0
            };
          }
          
          strategySums[strategy.name].netProceeds += strategy.netProceeds || 0;
          strategySums[strategy.name].taxImpact += strategy.taxImpact || 0;
        });
      });
      
      // Find the optimal strategy with highest net proceeds
      let optimalStrategy = "";
      let maxProceeds = 0;
      
      Object.entries(strategySums).forEach(([name, data]) => {
        if (data.netProceeds > maxProceeds) {
          maxProceeds = data.netProceeds;
          optimalStrategy = name;
        }
      });
      
      // Find second best strategy for comparison
      let secondBestProceeds = 0;
      Object.entries(strategySums).forEach(([name, data]) => {
        if (name !== optimalStrategy && data.netProceeds > secondBestProceeds) {
          secondBestProceeds = data.netProceeds;
        }
      });
      
      const savingsDifference = maxProceeds - secondBestProceeds;
      
      // Create specific result object based on exit type
      let exitSpecificResults = {};
      switch(exitParams.type) {
        case "IPO":
          exitSpecificResults = {
            lockupConsiderations: taxImpact[0]?.lockupConsiderations || {}
          };
          break;
          
        case "Acquisition":
          exitSpecificResults = {
            structuringOptions: taxImpact[0]?.structuringOptions || {}
          };
          break;
          
        case "Secondary":
          exitSpecificResults = {
            specialConsiderations: taxImpact[0]?.specialConsiderations || {}
          };
          break;
      }
      
      // Set scenario results including all available strategies
      setScenarioResults({
        exitValue: calculateEquityValue.exit,
        strategies: strategySums,
        optimalStrategy,
        savingsDifference,
        taxImpact,
        exitType: exitParams.type,
        ...exitSpecificResults
      });
    }
  };
  
  // Recalculate results when parameters change
  useMemo(() => {
    calculateAllResults();
  }, [exitParams, exerciseParams, taxParams, grants]);
  
  // Add the current scenario to comparison
  const addToComparison = () => {
    setComparisonScenarios([
      ...comparisonScenarios,
      {
        type: exitParams.type,
        name: exitParams.useCustomMultiplier ? `Custom (${exitParams.multiplier}x)` : "Moderate",
        multiplier: exitParams.useCustomMultiplier ? exitParams.multiplier : 
          COMMON_SCENARIOS.find(s => s.name === `${exitParams.type} - Moderate`)?.multiplier || 15
      }
    ]);
  };
  
  // Remove a scenario from comparison
  const removeFromComparison = (index) => {
    setComparisonScenarios(comparisonScenarios.filter((_, i) => i !== index));
  };
  
  // UI Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="space-y-6">
      {/* Main scenario builder card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Exit Scenario Builder</CardTitle>
            <CardDescription>
              Model and compare different exit scenarios for your equity
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              className="w-48"
              placeholder="Scenario name" 
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            />
            <Button size="sm" onClick={handleSaveScenario}>
              <Save className="mr-2 h-4 w-4" />
              Save Scenario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="exit" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exit">
                <TrendingUp className="mr-2 h-4 w-4" />
                Exit Parameters
              </TabsTrigger>
              <TabsTrigger value="exercise">
                <Calculator className="mr-2 h-4 w-4" />
                Exercise Strategy
              </TabsTrigger>
              <TabsTrigger value="tax">
                <BarChart className="mr-2 h-4 w-4" />
                Tax Optimization
              </TabsTrigger>
            </TabsList>
            
            {/* Exit parameters tab */}
            <TabsContent value="exit" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exit Type</Label>
                    <RadioGroup
                      value={exitParams.type}
                      onValueChange={(value) => handleExitParamChange("type", value)}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="IPO" id="exit-ipo" />
                        <Label htmlFor="exit-ipo">IPO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Acquisition" id="exit-acquisition" />
                        <Label htmlFor="exit-acquisition">Acquisition</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Secondary" id="exit-secondary" />
                        <Label htmlFor="exit-secondary">Secondary Sale</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Expected Timing</Label>
                    <RadioGroup
                      value={exitParams.timing}
                      onValueChange={(value) => handleExitParamChange("timing", value)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0-6" id="timing-0-6" />
                        <Label htmlFor="timing-0-6">0-6 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="6-12" id="timing-6-12" />
                        <Label htmlFor="timing-6-12">6-12 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1-2" id="timing-1-2" />
                        <Label htmlFor="timing-1-2">1-2 years</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2+" id="timing-2+" />
                        <Label htmlFor="timing-2+">2+ years</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Valuation Multiple</Label>
                      <span className="text-sm font-medium">{exitParams.multiplier}x</span>
                    </div>
                    <Slider 
                      value={[exitParams.multiplier]} 
                      min={1} 
                      max={exitParams.type === "Secondary" ? 20 : 100} 
                      step={1}
                      onValueChange={(values) => 
                        handleExitParamChange("multiplier", values[0])
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1x</span>
                      <span>{exitParams.type === "Secondary" ? "10x" : "50x"}</span>
                      <span>{exitParams.type === "Secondary" ? "20x" : "100x"}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valuation Method</Label>
                    <RadioGroup
                      value={exitParams.priceType}
                      onValueChange={(value) => handleExitParamChange("priceType", value)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multiple" id="type-multiple" />
                        <Label htmlFor="type-multiple">Multiple of Current FMV</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="direct" id="type-direct" />
                        <Label htmlFor="type-direct">Specific Share Price</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {exitParams.priceType === "direct" && (
                    <div className="space-y-2">
                      <Label>Share Price at Exit ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={exitParams.exitPrice}
                        onChange={(e) =>
                          handleExitParamChange("exitPrice", parseFloat(e.target.value) || 0)
                        }
                        placeholder="Enter exit share price"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Post-Exit Liquidity</Label>
                    <RadioGroup
                      value={exitParams.liquidityEvent}
                      onValueChange={(value) => handleExitParamChange("liquidityEvent", value)}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="liquidity-full" />
                        <Label htmlFor="liquidity-full">Full liquidity at exit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id="liquidity-partial" />
                        <Label htmlFor="liquidity-partial">Partial liquidity (50% at exit)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lockup" id="liquidity-lockup" />
                        <Label htmlFor="liquidity-lockup">IPO Lockup period</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {exitParams.liquidityEvent === "lockup" && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Lockup Period (Days)</Label>
                        <span className="text-sm font-medium">{exitParams.liquidityRestriction} days</span>
                      </div>
                      <Slider 
                        value={[exitParams.liquidityRestriction]} 
                        min={90} 
                        max={360} 
                        step={30}
                        onValueChange={(values) => 
                          handleExitParamChange("liquidityRestriction", values[0])
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>90 days</span>
                        <span>180 days</span>
                        <span>360 days</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-muted/20">
                    <h3 className="font-medium text-lg mb-2">Exit Value Projection</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(calculateEquityValue.current)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Exit Value</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateEquityValue.exit)}
                        </p>
                        <p className="text-sm">
                          {calculateEquityValue.growthMultiple.toFixed(1)}x growth
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-6">
                      <h4 className="text-sm font-medium">Key Exit Parameters</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exit Type:</span>
                          <span className="font-medium">{exitParams.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected Timing:</span>
                          <span className="font-medium">{exitParams.timing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Share Price at Exit:</span>
                          <span className="font-medium">{formatCurrency(calculateExitPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valuation Multiple:</span>
                          <span className="font-medium">{exitParams.multiplier}x current FMV</span>
                        </div>
                        {exitParams.dilution > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dilution Adjustment:</span>
                            <span className="font-medium">{exitParams.dilution}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={addToComparison}
                      >
                        Add to Comparison
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-primary/5">
                    <h3 className="flex items-center gap-2 font-medium mb-3">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      {exitParams.type} Considerations
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {exitParams.type === "IPO" && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Standard IPO lockup periods of {exitParams.liquidityRestriction} days prevent insiders from selling immediately.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Share prices can be volatile after IPO, affecting your exit value.
                            </span>
                          </li>
                        </>
                      )}
                      
                      {exitParams.type === "Acquisition" && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Acquisitions may include cash and stock components with different tax implications.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Earnout provisions may tie some compensation to future performance.
                            </span>
                          </li>
                        </>
                      )}
                      
                      {exitParams.type === "Secondary" && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Secondary sales typically occur at a discount to primary valuation.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Company approval may be required to sell shares on secondary markets.
                            </span>
                          </li>
                        </>
                      )}
                      
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          With a projected {exitParams.multiplier}x exit multiple, proactive tax planning can significantly impact your net proceeds.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Exercise strategy tab */}
            <TabsContent value="exercise" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exercise Strategy</Label>
                    <RadioGroup
                      value={exerciseParams.strategy}
                      onValueChange={(value) => handleExerciseParamChange("strategy", value)}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="strategy-all" />
                        <Label htmlFor="strategy-all">Exercise All Vested Options Now</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id="strategy-partial" />
                        <Label htmlFor="strategy-partial">Exercise Partial Amount Now</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimum" id="strategy-minimum" />
                        <Label htmlFor="strategy-minimum">Exercise Minimum Amount (10%)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="wait" id="strategy-wait" />
                        <Label htmlFor="strategy-wait">Wait Until Exit to Exercise</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {exerciseParams.strategy === "partial" && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Percentage to Exercise</Label>
                        <span className="text-sm font-medium">{exerciseParams.exercisePercentage}%</span>
                      </div>
                      <Slider 
                        value={[exerciseParams.exercisePercentage]} 
                        min={10} 
                        max={90} 
                        step={10}
                        onValueChange={(values) => 
                          handleExerciseParamChange("exercisePercentage", values[0])
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10%</span>
                        <span>50%</span>
                        <span>90%</span>
                      </div>
                    </div>
                  )}
                  
                  {exerciseParams.strategy !== "wait" && (
                    <>
                      <div className="space-y-2">
                        <Label>Exercise Timing</Label>
                        <RadioGroup
                          value={exerciseParams.exerciseTiming}
                          onValueChange={(value) => handleExerciseParamChange("exerciseTiming", value)}
                          className="grid grid-cols-1 gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="now" id="ex-timing-now" />
                            <Label htmlFor="ex-timing-now">As Soon as Possible</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="gradual" id="ex-timing-gradual" />
                            <Label htmlFor="ex-timing-gradual">Gradually Over Time</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="threshold" id="ex-timing-threshold" />
                            <Label htmlFor="ex-timing-threshold">When Company Valuation Reaches Threshold</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {exerciseParams.exerciseTiming === "gradual" && (
                        <div className="space-y-3">
                          <Label>Exercise Schedule</Label>
                          <div className="space-y-2">
                            {exerciseParams.exercisePlan.map((plan, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm w-20">Month {plan.month}:</span>
                                <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                                  <div 
                                    className="h-full bg-primary"
                                    style={{ width: `${plan.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm w-12 text-right">{plan.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* ISO qualification checkbox */}
                      {grants.some(g => g.grant_type === GRANT_TYPES.ISO) && (
                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id="iso-qualification"
                            checked={exerciseParams.isoDualQualification}
                            onCheckedChange={(checked) =>
                              handleExerciseParamChange("isoDualQualification", checked)
                            }
                          />
                          <Label htmlFor="iso-qualification" className="text-sm font-normal">
                            Plan for ISO qualifying disposition (1 year post-exercise, 2 years post-grant)
                          </Label>
                        </div>
                      )}
                      
                      {/* IPO-specific settings */}
                      {exitParams.type === "IPO" && (
                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id="exercise-before-lockup"
                            checked={exerciseParams.exerciseBeforeIPOLockup}
                            onCheckedChange={(checked) =>
                              handleExerciseParamChange("exerciseBeforeIPOLockup", checked)
                            }
                          />
                          <Label htmlFor="exercise-before-lockup" className="text-sm font-normal">
                            Exercise before IPO lockup period to start capital gains clock
                          </Label>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="space-y-4">
                  {scenarioResults && (
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium text-lg mb-2">Strategy Comparison</h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Dynamically show strategy cards based on exit type */}
                        {Object.entries(scenarioResults.strategies || {}).map(([strategyName, data], index) => (
                          <div 
                            key={strategyName}
                            className={`p-3 rounded-md ${scenarioResults.optimalStrategy === strategyName ? "bg-green-50" : "bg-muted/30"}`}
                          >
                            <h4 className="font-medium">{strategyName}</h4>
                            <div className="mt-1 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Net Proceeds:</span>
                                <span className={scenarioResults.optimalStrategy === strategyName ? "font-medium" : ""}>
                                  {formatCurrency(data.netProceeds)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax Impact:</span>
                                <span>{formatCurrency(data.taxImpact)}</span>
                              </div>
                              {scenarioResults.optimalStrategy === strategyName && (
                                <div className="mt-1 text-xs text-green-600">
                                  ✓ Optimal strategy for {exitParams.type} exit
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 p-2 bg-muted/20 rounded-md text-sm">
                        <p>
                          <span className="font-medium">Optimal Strategy:</span> {scenarioResults.optimalStrategy}
                        </p>
                        <p>
                          <span className="font-medium">Potential Savings:</span> {formatCurrency(scenarioResults.savingsDifference)}
                        </p>
                        
                        {/* IPO-specific lockup considerations */}
                        {exitParams.type === "IPO" && scenarioResults.lockupConsiderations && (
                          <div className="mt-2 pt-2 border-t border-muted">
                            <p className="font-medium text-xs">IPO Lockup Considerations:</p>
                            <p className="text-xs mt-1">
                              Exercise before IPO could save approximately {formatCurrency(scenarioResults.lockupConsiderations.taxSavings || 0)} in taxes 
                              by converting ordinary income to capital gains.
                            </p>
                          </div>
                        )}
                        
                        {/* Acquisition-specific considerations */}
                        {exitParams.type === "Acquisition" && scenarioResults.structuringOptions && (
                          <div className="mt-2 pt-2 border-t border-muted">
                            <p className="font-medium text-xs">Deal Structure Considerations:</p>
                            <p className="text-xs mt-1">
                              {scenarioResults.structuringOptions.section1202Eligible ? 
                                "You may qualify for Section 1202 QSBS exclusion, potentially saving " + 
                                formatCurrency(scenarioResults.structuringOptions.estimatedSection1202Savings) + " in taxes." :
                                "Consider tax implications of cash vs. stock consideration in acquisition terms."}
                            </p>
                          </div>
                        )}
                        
                        {/* Secondary-specific considerations */}
                        {exitParams.type === "Secondary" && scenarioResults.specialConsiderations && (
                          <div className="mt-2 pt-2 border-t border-muted">
                            <p className="font-medium text-xs">Secondary Sale Considerations:</p>
                            <p className="text-xs mt-1">
                              Secondary market discount of {scenarioResults.specialConsiderations.discountImpact?.discountPercentage || 0}% 
                              reduces value by {formatCurrency(scenarioResults.specialConsiderations.discountImpact?.valueLoss || 0)} 
                              compared to primary valuation.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="h-72 p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Value Projection Timeline</h3>
                    {timeSeriesData.length > 0 && (
                      <ResponsiveContainer width="100%" height="85%">
                        <RechartsLineChart
                          data={timeSeriesData}
                          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            label={{ value: 'Months', position: 'insideBottomRight', offset: -5 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                          />
                          <RechartsTooltip
                            formatter={(value, name) => [formatCurrency(value), name]}
                            labelFormatter={(value) => `Month ${value}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="Early Exercise" 
                            stroke="#0088FE" 
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Exercise at Exit" 
                            stroke="#00C49F" 
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="5 5"
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  <div className="p-4 border rounded-md bg-primary/5">
                    <h3 className="flex items-center gap-2 font-medium mb-3">
                      <Clock className="h-4 w-4 text-primary" />
                      Exercise Timing Considerations
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {exerciseParams.strategy !== "wait" ? (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            Early exercise of options starts the capital gains holding period, potentially reducing tax rates from {taxParams.federalTaxRate}% to {taxParams.capitalGainsRate}%.
                          </span>
                        </li>
                      ) : (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            Waiting until exit minimizes upfront costs and risk, but typically results in higher tax rates on the spread.
                          </span>
                        </li>
                      )}
                      
                      {exitParams.type === "IPO" && exerciseParams.strategy !== "wait" && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            Exercise at least 12 months before anticipated IPO to qualify for long-term capital gains treatment when selling after the lockup period.
                          </span>
                        </li>
                      )}
                      
                      {exitParams.type === "Acquisition" && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            In acquisition scenarios, exercise decisions may need to be made quickly. Have a plan in place.
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Tax optimization tab */}
            <TabsContent value="tax" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filing Status</Label>
                    <Select
                      value={taxParams.filingStatus}
                      onValueChange={(value) => handleTaxParamChange("filingStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select filing status" />
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
                    <Label>State of Residence</Label>
                    <Select
                      value={taxParams.stateOfResidence}
                      onValueChange={(value) => handleTaxParamChange("stateOfResidence", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="California">California</SelectItem>
                        <SelectItem value="New York">New York</SelectItem>
                        <SelectItem value="Texas">Texas</SelectItem>
                        <SelectItem value="Florida">Florida</SelectItem>
                        <SelectItem value="Washington">Washington</SelectItem>
                        <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                        <SelectItem value="Illinois">Illinois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Federal Tax Rate (%)</Label>
                      <span className="text-sm font-medium">{taxParams.federalTaxRate}%</span>
                    </div>
                    <Slider 
                      value={[taxParams.federalTaxRate]} 
                      min={10} 
                      max={40} 
                      step={1}
                      onValueChange={(values) => 
                        handleTaxParamChange("federalTaxRate", values[0])
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10%</span>
                      <span>25%</span>
                      <span>40%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>State Tax Rate (%)</Label>
                      <span className="text-sm font-medium">{taxParams.stateTaxRate}%</span>
                    </div>
                    <Slider 
                      value={[taxParams.stateTaxRate]} 
                      min={0} 
                      max={15} 
                      step={0.5}
                      onValueChange={(values) => 
                        handleTaxParamChange("stateTaxRate", values[0])
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>7.5%</span>
                      <span>15%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Long-Term Capital Gains Rate (%)</Label>
                      <span className="text-sm font-medium">{taxParams.capitalGainsRate}%</span>
                    </div>
                    <Slider 
                      value={[taxParams.capitalGainsRate]} 
                      min={0} 
                      max={30} 
                      step={1}
                      onValueChange={(values) => 
                        handleTaxParamChange("capitalGainsRate", values[0])
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>15%</span>
                      <span>30%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Annual Income (excluding equity)</Label>
                      <span className="text-sm font-medium">{formatCurrency(taxParams.otherIncome)}</span>
                    </div>
                    <Slider 
                      value={[taxParams.otherIncome]} 
                      min={50000} 
                      max={500000} 
                      step={10000}
                      onValueChange={(values) => 
                        handleTaxParamChange("otherIncome", values[0])
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$50k</span>
                      <span>$250k</span>
                      <span>$500k</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-1">
                    <Switch
                      id="include-amt"
                      checked={taxParams.includeAMT}
                      onCheckedChange={(checked) =>
                        handleTaxParamChange("includeAMT", checked)
                      }
                    />
                    <Label htmlFor="include-amt" className="text-sm font-normal">
                      Include Alternative Minimum Tax (AMT) calculations
                    </Label>
                  </div>
                  
                  {taxParams.includeAMT && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>AMT Rate (%)</Label>
                        <span className="text-sm font-medium">{taxParams.amtRate}%</span>
                      </div>
                      <Slider 
                        value={[taxParams.amtRate]} 
                        min={0} 
                        max={35} 
                        step={1}
                        onValueChange={(values) => 
                          handleTaxParamChange("amtRate", values[0])
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>17.5%</span>
                        <span>35%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {taxImpactData.length > 0 && (
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium text-lg mb-3">Tax Breakdown</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {taxImpactData.map((data, index) => (
                          <div key={index} className="flex flex-col">
                            <h4 className="text-sm font-medium mb-2">{data.name}</h4>
                            <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie
                                    data={[
                                      { name: 'Federal', value: data.federal },
                                      { name: 'State', value: data.state },
                                      { name: 'AMT', value: data.amt },
                                    ]}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {[
                                      { name: 'Federal', value: data.federal },
                                      { name: 'State', value: data.state },
                                      { name: 'AMT', value: data.amt },
                                    ].map((entry, i) => (
                                      <Cell 
                                        key={`cell-${i}`} 
                                        fill={COLORS[i % COLORS.length]} 
                                      />
                                    ))}
                                  </Pie>
                                  <Legend />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-2 text-center text-sm">
                              Total: {formatCurrency(data.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>
                          {taxImpactData[0].total > taxImpactData[1].total 
                            ? "Exercising at exit has a lower tax impact in this scenario." 
                            : "Early exercise has a lower tax impact in this scenario."}
                        </p>
                        <p className="mt-1">
                          Potential tax savings: {formatCurrency(Math.abs(taxImpactData[0].total - taxImpactData[1].total))}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-3">Tax Rate Comparison</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ordinary Income</Label>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500"
                            style={{ width: `${taxParams.federalTaxRate + taxParams.stateTaxRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Combined Rate: {taxParams.federalTaxRate + taxParams.stateTaxRate}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Long-Term Capital Gains</Label>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${taxParams.capitalGainsRate + taxParams.stateTaxRate * 0.5}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Combined Rate: {taxParams.capitalGainsRate + taxParams.stateTaxRate * 0.5}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm">
                      <p className="font-medium">Potential Tax Savings</p>
                      <p className="text-muted-foreground">
                        Converting ordinary income to long-term capital gains could save approximately {taxParams.federalTaxRate - taxParams.capitalGainsRate}% in federal taxes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-primary/5">
                    <h3 className="flex items-center gap-2 font-medium mb-3">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Tax Optimization Tips
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {grants.some(g => g.grant_type === GRANT_TYPES.ISO) && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            For ISOs, exercise early enough to meet both holding requirements (1 year post-exercise and 2 years post-grant) to qualify for long-term capital gains treatment.
                          </span>
                        </li>
                      )}
                      
                      {exitParams.type === "IPO" && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            With an IPO {exitParams.timing}, consider exercising at least 12 months before the anticipated event to qualify for long-term capital gains when selling after the lockup period.
                          </span>
                        </li>
                      )}
                      
                      {taxParams.includeAMT && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>
                            Staggering exercise of ISOs across multiple tax years can help minimize AMT impact in any single year.
                          </span>
                        </li>
                      )}
                      
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          Consider exercising in years when your total income is lower to reduce potential AMT or ordinary income tax impact.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            This scenario builder provides hypothetical projections based on your inputs. Results are estimates and should not be considered financial advice.
            Always consult with a tax professional or financial advisor for personalized guidance.
          </p>
        </CardFooter>
      </Card>
      
      {/* Scenario comparison */}
      {comparisonScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Comparison</CardTitle>
            <CardDescription>Compare different exit scenarios to understand potential outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs border-b">
                    <th className="text-left py-2">Scenario</th>
                    <th className="text-right py-2">Multiplier</th>
                    <th className="text-right py-2">Share Price</th>
                    <th className="text-right py-2">Exit Value</th>
                    <th className="text-right py-2">Growth</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonScenarios.map((s, index) => {
                    const scenarioMultiplier = s.multiplier || 10;
                    const scenarioPrice = baseFMV * scenarioMultiplier;
                    const scenarioValue = calculateEquityValue.current * scenarioMultiplier;
                    
                    return (
                      <tr key={index} className="text-sm border-b hover:bg-muted/50">
                        <td className="py-2">
                          {s.type}: {s.name}
                        </td>
                        <td className="text-right py-2">
                          {scenarioMultiplier}x
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(scenarioPrice)}
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(scenarioValue)}
                        </td>
                        <td className="text-right py-2">
                          {scenarioMultiplier}x
                        </td>
                        <td className="text-right py-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFromComparison(index)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Current scenario */}
                  <tr className="text-sm font-medium bg-primary/5">
                    <td className="py-2">
                      Current Model: {exitParams.type}
                    </td>
                    <td className="text-right py-2">
                      {exitParams.multiplier}x
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(calculateExitPrice)}
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(calculateEquityValue.exit)}
                    </td>
                    <td className="text-right py-2">
                      {calculateEquityValue.growthMultiple.toFixed(1)}x
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={comparisonScenarios.map(s => {
                    const value = calculateEquityValue.current * s.multiplier;
                    return {
                      name: `${s.type.substring(0, 3)}: ${s.name.substring(0, 6)}`,
                      value,
                    };
                  }).concat([{
                    name: "Current",
                    value: calculateEquityValue.exit,
                  }])}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(value) => [formatCurrency(value), "Exit Value"]} />
                  <Bar dataKey="value" name="Exit Value">
                    {comparisonScenarios.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )).concat(
                      <Cell key="current" fill="#8884d8" />
                    )}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Educational tips for exit planning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              {exitParams.type} Exit Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {exitParams.type === "IPO" 
                ? "IPOs typically include a 180-day lockup period, but the share price may fluctuate significantly after going public. Having a clear selling strategy post-lockup is essential."
                : exitParams.type === "Acquisition" 
                ? "Acquisition deals may include cash, stock, or a combination. Each has different tax implications. Also be aware of any potential earnout provisions that tie additional compensation to post-acquisition performance."
                : "Secondary sales provide early liquidity but often at a discount to primary valuation. Company approval is typically required, and there may be restrictions on the percentage of your holdings you can sell."}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-primary" />
              Tax Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The difference between ordinary income tax rates (up to {taxParams.federalTaxRate}%) and long-term capital gains rates ({taxParams.capitalGainsRate}%) can significantly impact your net proceeds. 
              For ISOs, consider AMT implications of early exercise. For NSOs, the spread is taxed as ordinary income at exercise regardless of timing.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              When planning for a {exitParams.type.toLowerCase()} scenario, balance potential upside with risk management. Consider diversifying by selling a portion of shares post-exit, especially if equity represents a large percentage of your net worth. Factor in the probability of different exit outcomes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}