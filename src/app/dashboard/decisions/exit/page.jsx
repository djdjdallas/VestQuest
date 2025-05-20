// src/app/dashboard/decisions/exit/page.jsx
"use client";

import { useState, useMemo } from "react";
import { DecisionLayout } from "@/components/decisions/DecisionLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ChevronDown, ChevronUp, DollarSign, TrendingUp, Clock, Info } from "lucide-react";
import { useGrants } from "@/hooks/useGrants";
import { calculateComprehensiveTax } from "@/utils/enhancedTaxCalculations";
import { 
  calculateIPOTaxImpact,
  calculateAcquisitionTaxImpact,
  calculateSecondaryTaxImpact,
  analyzeExitStrategies
} from "@/utils/exitTaxCalculations";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { GRANT_TYPES, COMMON_SCENARIOS } from "@/utils/constants";

export default function ExitPlanningGuidePage() {
  const { grants, loading: grantsLoading } = useGrants();
  
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("ipo");
  
  // Exit strategy state
  const [exitScenario, setExitScenario] = useState({
    type: "IPO",
    timing: "6-12",
    customMultiplier: 10,
    selectedScenario: COMMON_SCENARIOS[1].name,
    priceType: "percent",
    exitPrice: 0,
  });
  
  // Tax strategy state
  const [taxStrategy, setTaxStrategy] = useState({
    exerciseBeforeExit: "some",
    exerciseTiming: "now",
    holdingPeriod: "1-year",
    sellTiming: "staggered",
    filingStatus: "single",
    stateOfResidence: "California",
    includeAMT: true,
  });
  
  // Advanced inputs state
  const [advancedSettings, setAdvancedSettings] = useState({
    otherIncome: 150000,
    federalTaxRate: 32,
    stateTaxRate: 10,
    priorAMTCredits: 0,
    includeNIIT: true,
    isMultiState: false,
    stateAllocation: {
      "California": 100
    },
    staggeredSales: [
      { months: 0, percentage: 25 },
      { months: 6, percentage: 25 },
      { months: 12, percentage: 50 },
    ],
    showAdvanced: false,
    useEnhancedCalculations: true,
    hasEarnout: false,
    earnoutPercentage: 20,
    cashPercentage: 70,
    secondaryDiscount: 20,
  });
  
  // Results state
  const [results, setResults] = useState(null);
  
  // Define the steps for the wizard
  const steps = ["Exit Scenario", "Tax Strategy", "Results & Recommendations"];

  // Calculate exit price from scenario
  const getExitPrice = useMemo(() => {
    // If direct price input is used
    if (exitScenario.priceType === "price" && exitScenario.exitPrice > 0) {
      return exitScenario.exitPrice;
    }
    
    // Otherwise use multiplier
    const multiplier = exitScenario.selectedScenario === "custom"
      ? exitScenario.customMultiplier
      : COMMON_SCENARIOS.find(s => s.name === exitScenario.selectedScenario)?.multiplier || 10;
      
    // Use first grant's FMV as base price if available, or default to $1
    const baseFMV = grants && grants.length > 0 
      ? grants[0].current_fmv 
      : 1;
      
    return baseFMV * multiplier;
  }, [exitScenario, grants]);

  // Handle next button click
  const handleNext = () => {
    if (currentStep === 1) {
      // Generate recommendations
      generateRecommendations();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle back button click
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Generate comprehensive exit recommendations with enhanced calculations
  const generateRecommendations = () => {
    if (!grants || grants.length === 0) return;
    
    const exitPrice = getExitPrice;
    
    // Calculate timing dates based on user selections
    const now = new Date();
    const exerciseDate = new Date();
    const exitDate = getExitDate(now, exitScenario.timing);
    
    // Set up tax settings based on the strategy
    const baseTaxSettings = {
      filingStatus: taxStrategy.filingStatus,
      stateOfResidence: taxStrategy.stateOfResidence,
      federalTaxRate: advancedSettings.federalTaxRate,
      stateTaxRate: advancedSettings.stateTaxRate,
      otherIncome: advancedSettings.otherIncome,
      priorAMTCredits: advancedSettings.priorAMTCredits,
      includeAMT: taxStrategy.includeAMT,
      includeNIIT: advancedSettings.includeNIIT,
      isMultiState: advancedSettings.isMultiState,
      stateAllocation: advancedSettings.stateAllocation,
    };
    
    // Variable to store strategies & results
    let strategies = [];
    let exitTypeSpecificData = {};
    
    // Use enhanced exit tax calculations if enabled
    if (advancedSettings.useEnhancedCalculations) {
      // Choose the appropriate exit calculation based on exit type
      let exitResults;
      
      switch(exitScenario.type) {
        case "IPO":
          exitResults = calculateIPOTaxImpact({
            grants,
            exerciseStrategy: taxStrategy.exerciseBeforeExit === "all" ? "all" : 
                              taxStrategy.exerciseBeforeExit === "some" ? "partial" : "wait",
            exerciseParams: {
              exercisePercentage: 50, // Default for "some"
              exerciseTiming: taxStrategy.exerciseTiming,
              isoDualQualification: true, // Assume we want to qualify ISOs
            },
            exitParams: {
              exitPrice,
              lockupPeriod: 180, // Standard IPO lockup
              ipoDate: exitDate
            },
            taxParams: baseTaxSettings
          });
          
          exitTypeSpecificData = {
            lockupConsiderations: exitResults.lockupConsiderations,
            optimalStrategy: exitResults.optimal.strategy
          };
          
          // Format results for display
          grants.forEach(grant => {
            if (grant.grant_type === GRANT_TYPES.ISO || grant.grant_type === GRANT_TYPES.NSO) {
              const earlyExerciseDetail = exitResults.earlyExercise.details.find(d => d.grantId === grant.id);
              const exitExerciseDetail = exitResults.exerciseAtExit.details.find(d => d.grantId === grant.id);
              const staggeredDetail = exitResults.staggeredExercise.details.find(d => d.grantId === grant.id);
              
              // Only proceed if we have details for this grant
              if (earlyExerciseDetail) {
                // Prepare all results in consistent format
                const allResults = [
                  { 
                    id: "early", 
                    name: "Exercise Early",
                    netProceeds: earlyExerciseDetail.result.totals.netProceeds,
                    effectiveRate: earlyExerciseDetail.result.totals.effectiveRate,
                    cashRequired: grant.shares * grant.strike_price,
                    results: earlyExerciseDetail.result
                  },
                  { 
                    id: "exit", 
                    name: "Exercise at IPO",
                    netProceeds: exitExerciseDetail?.result.totals.netProceeds || 0,
                    effectiveRate: exitExerciseDetail?.result.totals.effectiveRate || 0,
                    cashRequired: 0,
                    results: exitExerciseDetail?.result || {}
                  },
                  { 
                    id: "staggered", 
                    name: "Staggered Exercise",
                    netProceeds: staggeredDetail?.result.totals.netProceeds || 0,
                    effectiveRate: staggeredDetail?.result.totals.effectiveRate || 0,
                    cashRequired: grant.shares * grant.strike_price * 0.6, // Approximate for staggered
                    results: staggeredDetail?.result || {}
                  }
                ];
                
                // Sort by net proceeds (descending)
                allResults.sort((a, b) => b.netProceeds - a.netProceeds);
                
                // Add to strategies
                strategies.push({
                  grantId: grant.id,
                  grantType: grant.grant_type,
                  shares: grant.shares,
                  strategies: allResults,
                  recommendation: allResults[0].id,
                  potential: allResults[0].netProceeds,
                  bestStrategy: allResults[0].name,
                  taxSavings: allResults[0].netProceeds - allResults[1].netProceeds,
                  exitType: "IPO"
                });
              }
            }
          });
          break;
          
        case "Acquisition":
          exitResults = calculateAcquisitionTaxImpact({
            grants,
            exerciseParams: {
              strategy: taxStrategy.exerciseBeforeExit === "all" ? "all" : 
                       taxStrategy.exerciseBeforeExit === "some" ? "partial" : "wait",
              exercisePercentage: 50, // Default for "some"
              exerciseTiming: taxStrategy.exerciseTiming
            },
            acquisitionParams: {
              exitPrice,
              cashPercentage: advancedSettings.cashPercentage,
              hasEarnout: advancedSettings.hasEarnout,
              earnoutPercentage: advancedSettings.earnoutPercentage,
              acquisitionDate: exitDate
            },
            taxParams: baseTaxSettings
          });
          
          exitTypeSpecificData = {
            structuringOptions: exitResults.structuringOptions,
            optimalDealType: exitResults.optimal.dealType
          };
          
          // Format results for display
          grants.forEach(grant => {
            if (grant.grant_type === GRANT_TYPES.ISO || grant.grant_type === GRANT_TYPES.NSO) {
              const cashDealDetail = exitResults.cashDeal.details.find(d => d.grantId === grant.id);
              const stockDealDetail = exitResults.stockDeal.details.find(d => d.grantId === grant.id);
              const mixedDealDetail = exitResults.mixedDeal.details.find(d => d.grantId === grant.id);
              
              // Only proceed if we have details for this grant
              if (cashDealDetail) {
                // Prepare all results in consistent format
                const allResults = [
                  { 
                    id: "cash", 
                    name: "Cash Deal",
                    netProceeds: cashDealDetail.result.totals.netProceeds,
                    effectiveRate: cashDealDetail.result.totals.effectiveRate,
                    cashRequired: taxStrategy.exerciseBeforeExit !== "none" ? grant.shares * grant.strike_price : 0,
                    results: cashDealDetail.result
                  },
                  { 
                    id: "stock", 
                    name: "Stock Deal",
                    netProceeds: stockDealDetail?.result.totals.netProceeds || 0,
                    effectiveRate: stockDealDetail?.result.totals.effectiveRate || 0,
                    cashRequired: taxStrategy.exerciseBeforeExit !== "none" ? grant.shares * grant.strike_price : 0,
                    results: stockDealDetail?.result || {}
                  },
                  { 
                    id: "mixed", 
                    name: `Mixed Deal (${advancedSettings.cashPercentage}% Cash)`,
                    netProceeds: mixedDealDetail?.result.totals.netProceeds || 0,
                    effectiveRate: mixedDealDetail?.result.totals.effectiveRate || 0,
                    cashRequired: taxStrategy.exerciseBeforeExit !== "none" ? grant.shares * grant.strike_price : 0,
                    results: mixedDealDetail?.result || {}
                  }
                ];
                
                // Sort by net proceeds (descending)
                allResults.sort((a, b) => b.netProceeds - a.netProceeds);
                
                // Add to strategies
                strategies.push({
                  grantId: grant.id,
                  grantType: grant.grant_type,
                  shares: grant.shares,
                  strategies: allResults,
                  recommendation: allResults[0].id,
                  potential: allResults[0].netProceeds,
                  bestStrategy: allResults[0].name,
                  taxSavings: allResults[0].netProceeds - allResults[1].netProceeds,
                  exitType: "Acquisition"
                });
              }
            }
          });
          break;
          
        case "Secondary":
          exitResults = calculateSecondaryTaxImpact({
            grants,
            exerciseParams: {
              strategy: taxStrategy.exerciseBeforeExit === "all" ? "all" : 
                       taxStrategy.exerciseBeforeExit === "some" ? "partial" : "wait",
              exercisePercentage: 50, // Default for "some"
              exerciseTiming: taxStrategy.exerciseTiming
            },
            secondaryParams: {
              exitPrice,
              discount: advancedSettings.secondaryDiscount,
              salePercentage: taxStrategy.sellTiming === "all" ? 100 : 50,
              saleDate: exitDate,
              hasRightOfFirstRefusal: true,
              hasTransferRestrictions: true
            },
            taxParams: baseTaxSettings
          });
          
          exitTypeSpecificData = {
            specialConsiderations: exitResults.specialConsiderations,
            optimalStrategy: exitResults.optimal.strategy
          };
          
          // Format results for display
          grants.forEach(grant => {
            if (grant.grant_type === GRANT_TYPES.ISO || grant.grant_type === GRANT_TYPES.NSO) {
              const sellAllDetail = exitResults.sellAll.details.find(d => d.grantId === grant.id);
              const sellPartialDetail = exitResults.sellPartial.details.find(d => d.grantId === grant.id);
              const staggeredSalesDetail = exitResults.staggeredSales.details.find(d => d.grantId === grant.id);
              
              // Only proceed if we have details for this grant
              if (sellAllDetail) {
                // Prepare all results in consistent format
                const allResults = [
                  { 
                    id: "sellAll", 
                    name: "Sell All Shares",
                    netProceeds: sellAllDetail.result.totals.netProceeds,
                    effectiveRate: sellAllDetail.result.totals.effectiveRate,
                    cashRequired: taxStrategy.exerciseBeforeExit !== "none" ? grant.shares * grant.strike_price : 0,
                    results: sellAllDetail.result
                  },
                  { 
                    id: "sellPartial", 
                    name: "Sell Partial Shares",
                    netProceeds: sellPartialDetail?.result.totals.netProceeds || 0,
                    effectiveRate: sellPartialDetail?.result.totals.effectiveRate || 0,
                    cashRequired: taxStrategy.exerciseBeforeExit !== "none" ? grant.shares * grant.strike_price : 0,
                    results: sellPartialDetail?.result || {}
                  },
                  { 
                    id: "staggered", 
                    name: "Staggered Sales",
                    netProceeds: staggeredSalesDetail?.result.totals.netProceeds || 0,
                    effectiveRate: staggeredSalesDetail?.result.totals.effectiveRate || 0,
                    cashRequired: taxStrategy.exerciseBeforeExit !== "none" ? grant.shares * grant.strike_price : 0,
                    results: staggeredSalesDetail?.result || {}
                  }
                ];
                
                // Sort by net proceeds (descending)
                allResults.sort((a, b) => b.netProceeds - a.netProceeds);
                
                // Add to strategies
                strategies.push({
                  grantId: grant.id,
                  grantType: grant.grant_type,
                  shares: grant.shares,
                  strategies: allResults,
                  recommendation: allResults[0].id,
                  potential: allResults[0].netProceeds,
                  bestStrategy: allResults[0].name,
                  taxSavings: allResults[0].netProceeds - allResults[1].netProceeds,
                  exitType: "Secondary"
                });
              }
            }
          });
          break;
      }
    } else {
      // Use the original calculation method if enhanced calculations are disabled
      // Helper function to calculate future date
      function addMonths(date, months) {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + months);
        return newDate;
      }
      
      // Calculate for each grant using the original approach
      grants.forEach(grant => {
        if (grant.grant_type === GRANT_TYPES.ISO || grant.grant_type === GRANT_TYPES.NSO) {
          // Strategy 1: Exercise now, hold until exit
          const exerciseNowSettings = {
            ...baseTaxSettings,
            exerciseDate: new Date(),
            saleDate: exitDate,
          };
          
          const exerciseNowResults = calculateComprehensiveTax(
            grant,
            grant.strike_price,
            exitPrice,
            grant.shares,
            exerciseNowSettings
          );
          
          // Strategy 2: Exercise at exit
          const exerciseAtExitSettings = {
            ...baseTaxSettings,
            exerciseDate: exitDate,
            saleDate: exitDate,
          };
          
          const exerciseAtExitResults = calculateComprehensiveTax(
            grant,
            grant.strike_price,
            exitPrice,
            grant.shares,
            exerciseAtExitSettings
          );
          
          // Strategy 3: Exercise now, hold 1 year after exit
          const exerciseNowHoldSettings = {
            ...baseTaxSettings,
            exerciseDate: new Date(),
            saleDate: addMonths(exitDate, 12),
          };
          
          const exerciseNowHoldResults = calculateComprehensiveTax(
            grant,
            grant.strike_price,
            exitPrice * 1.1, // Assume 10% more growth in 1 year
            grant.shares,
            exerciseNowHoldSettings
          );
          
          // Strategy 4: Staggered sells after exit
          const staggeredResults = calculateStaggeredSaleResults(
            grant,
            exitPrice,
            advancedSettings.staggeredSales
          );
          
          // Find the best strategy
          const allResults = [
            { 
              id: "now", 
              name: "Exercise Now",
              netProceeds: exerciseNowResults.totals.netProceeds,
              effectiveRate: exerciseNowResults.totals.effectiveRate,
              cashRequired: grant.shares * grant.strike_price,
              results: exerciseNowResults
            },
            { 
              id: "exit", 
              name: "Exercise at Exit",
              netProceeds: exerciseAtExitResults.totals.netProceeds,
              effectiveRate: exerciseAtExitResults.totals.effectiveRate,
              cashRequired: 0,
              results: exerciseAtExitResults
            },
            { 
              id: "hold", 
              name: "Exercise Now, Hold 1 Year Post-Exit",
              netProceeds: exerciseNowHoldResults.totals.netProceeds,
              effectiveRate: exerciseNowHoldResults.totals.effectiveRate,
              cashRequired: grant.shares * grant.strike_price,
              results: exerciseNowHoldResults
            },
            { 
              id: "staggered", 
              name: "Staggered Sales After Exit",
              netProceeds: staggeredResults.netProceeds,
              effectiveRate: staggeredResults.effectiveRate,
              cashRequired: grant.shares * grant.strike_price * 
                (taxStrategy.exerciseBeforeExit === "all" ? 1 : 0.5),
              results: exerciseNowResults // Simplified for this example
            }
          ];
          
          // Sort by net proceeds (descending)
          allResults.sort((a, b) => b.netProceeds - a.netProceeds);
          
          // Add to strategies
          strategies.push({
            grantId: grant.id,
            grantType: grant.grant_type,
            shares: grant.shares,
            strategies: allResults,
            recommendation: allResults[0].id,
            potential: allResults[0].netProceeds,
            bestStrategy: allResults[0].name,
            taxSavings: allResults[0].netProceeds - allResults[1].netProceeds,
            exitType: exitScenario.type
          });
        }
      });
    }
    
    // Calculate total exit value with projected growth
    const totalCurrentValue = grants.reduce((sum, grant) => {
      return sum + grant.shares * grant.current_fmv;
    }, 0);
    
    const totalExitValue = grants.reduce((sum, grant) => {
      return sum + grant.shares * exitPrice;
    }, 0);
    
    // Generate recommendations based on exit type
    const recommendations = generateRecommendationList(strategies, exitScenario.type);
    const taxConsiderations = generateTaxConsiderations(strategies, exitScenario.type);
    
    // Calculate aggregate results
    const aggregateResults = {
      currentValue: totalCurrentValue,
      exitValue: totalExitValue,
      growthMultiple: totalCurrentValue > 0 ? totalExitValue / totalCurrentValue : 0,
      topStrategies: strategies.map(s => s.recommendation),
      strategies,
      recommendations,
      taxConsiderations,
      exitType: exitScenario.type,
      ...exitTypeSpecificData
    };
    
    setResults(aggregateResults);
  };
  
  // Helper functions
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
        date.setMonth(date.getMonth() + 18); // Middle of 1-2 years
        break;
      case "2+":
        date.setFullYear(date.getFullYear() + 3); // Default to 3 years
        break;
      default:
        date.setMonth(date.getMonth() + 9);
    }
    return date;
  };
  
  const calculateStaggeredSaleResults = (grant, exitPrice, staggeredSales) => {
    // This would be a more complex calculation in a real implementation
    // For this example, we'll use a simplified approach
    
    // Assume a slight price increase over time
    const averagePrice = exitPrice * 1.05; // 5% higher average price
    
    // Calculate weighted tax rate (simplified)
    const effectiveRate = 0.28; // Example rate
    
    // Calculate gross proceeds
    const grossProceeds = grant.shares * averagePrice;
    
    // Calculate tax
    const taxAmount = grossProceeds * effectiveRate;
    
    // Calculate net
    const netProceeds = grossProceeds - taxAmount - (grant.shares * grant.strike_price);
    
    return {
      netProceeds,
      effectiveRate,
      grossProceeds,
      taxAmount
    };
  };
  
  const generateRecommendationList = (strategies, exitType) => {
    // Generate exit-type specific recommendations
    const baseRecommendations = [];
    
    // Check if exercising early is generally better
    let earlyExerciseBetter = false;
    
    switch(exitType) {
      case "IPO":
        // For IPO, check early exercise recommendations
        earlyExerciseBetter = strategies.filter(s => 
          s.recommendation === "early" || s.recommendation === "staggered"
        ).length > strategies.length / 2;
        
        baseRecommendations.push(
          {
            title: "IPO Exercise Strategy",
            content: earlyExerciseBetter
              ? "Consider exercising options at least 12 months before expected IPO to qualify for long-term capital gains when selling after lockup."
              : "Given your situation, waiting until IPO may be optimal, especially if you're concerned about company valuation risk.",
          },
          {
            title: "Lockup Period Planning",
            content: "Plan for the standard 180-day lockup period where selling will be restricted. Consider setting up a 10b5-1 plan before lockup ends."
          },
          {
            title: "Post-IPO Strategy",
            content: "Consider diversifying after lockup ends - even public company stock carries concentration risk."
          }
        );
        break;
        
      case "Acquisition":
        // For acquisition, check deal structure preference
        const cashDealsPreferred = strategies.filter(s => 
          s.recommendation === "cash"
        ).length > strategies.length / 2;
        
        baseRecommendations.push(
          {
            title: "Deal Structure Considerations",
            content: cashDealsPreferred
              ? "Cash deals may be preferable in your situation as they provide immediate liquidity and certainty."
              : "Stock or mixed deals may offer tax advantages and additional upside potential in your situation.",
          },
          {
            title: "Exercise Timing",
            content: "For acquisitions, the timeline can be compressed. Have a strategy ready in case a deal is announced."
          },
          {
            title: "Tax Structuring",
            content: "Stock deals may qualify for tax-free reorganization treatment, deferring taxes until the acquirer's shares are sold."
          }
        );
        break;
        
      case "Secondary":
        // For secondary, check selling strategy preference
        const sellAllPreferred = strategies.filter(s => 
          s.recommendation === "sellAll"
        ).length > strategies.length / 2;
        
        baseRecommendations.push(
          {
            title: "Secondary Market Strategy",
            content: sellAllPreferred
              ? "Given the secondary market discount and pricing uncertainty, selling your entire position may optimize overall value."
              : "A partial sale strategy may balance immediate liquidity needs with future upside potential.",
          },
          {
            title: "Transfer Restrictions",
            content: "Verify company approval requirements for secondary transactions, which may include right of first refusal or other limitations."
          },
          {
            title: "Pricing Considerations",
            content: `Secondary transactions typically occur at a ${advancedSettings.secondaryDiscount}% discount to primary valuations. Evaluate if timing justifies this discount.`
          }
        );
        break;
        
      default:
        // Generic recommendations for any exit type
        earlyExerciseBetter = strategies.filter(s => 
          s.recommendation === "now" || s.recommendation === "hold" || s.recommendation === "early"
        ).length > strategies.length / 2;
        
        baseRecommendations.push({
          title: "Exercise Strategy",
          content: earlyExerciseBetter
            ? "Consider exercising your options before exit to qualify for long-term capital gains treatment when possible."
            : "For most of your grants, exercising at exit appears optimal given current projections and your tax situation.",
        });
    }
    
    // Common recommendations for all exit types
    baseRecommendations.push(
      {
        title: "Holding Period",
        content: "Hold ISOs for at least 1 year after exercise and 2 years after grant to qualify for favorable tax treatment when timing allows.",
      },
      {
        title: "Diversification",
        content: "Consider a staggered selling approach after exit to reduce risk and potentially capture additional upside.",
      },
      {
        title: "Tax Planning",
        content: `Work with a tax professional to manage AMT exposure${taxStrategy.includeAMT ? " which appears significant in your situation" : ""}. Consider tax-loss harvesting opportunities in other investments.`,
      }
    );
    
    return baseRecommendations;
  };
  
  const generateTaxConsiderations = (strategies, exitType) => {
    // Generate tax considerations based on analysis and exit type
    const baseConsiderations = [];
    
    // Check if AMT is a major concern
    const hasHighAMT = strategies.some(s => {
      // Adapt to handle different strategy IDs based on exit type
      const earlyStrategy = s.strategies.find(str => 
        str.id === "now" || str.id === "early" || str.id === "cash" || str.id === "sellAll"
      );
      return earlyStrategy?.results?.amt?.netAMTDue > 10000;
    });
    
    // Check if state tax is significant
    const hasHighStateTax = strategies.some(s => {
      const bestStrategy = s.strategies[0];
      return bestStrategy?.results?.state?.stateTax > 50000;
    });
    
    // Check for multi-state tax implications
    const hasMultiStateConsiderations = advancedSettings.isMultiState;
    
    // Common tax considerations for all exit types
    baseConsiderations.push(
      {
        title: "Alternative Minimum Tax (AMT)",
        impact: hasHighAMT ? "High" : "Medium",
        content: hasHighAMT
          ? "Early exercise of ISOs may trigger substantial AMT. Consider exercising gradually across tax years."
          : "AMT impact appears manageable, but monitor closely if company valuation increases rapidly.",
      },
      {
        title: "State Tax Considerations",
        impact: hasHighStateTax ? "High" : "Medium",
        content: hasHighStateTax
          ? `State taxes in ${taxStrategy.stateOfResidence} represent a significant portion of your tax liability. Consider timing of residency changes if applicable.`
          : "State tax impact is moderate; focus primarily on federal tax optimization.",
      }
    );
    
    // Add exit-type specific tax considerations
    switch(exitType) {
      case "IPO":
        baseConsiderations.push(
          {
            title: "IPO Lock-up Tax Planning",
            impact: "High",
            content: "Exercise timing relative to the IPO can significantly impact your tax situation. Early exercise may convert future gains to long-term capital gains."
          },
          {
            title: "83(b) Election Consideration",
            impact: "Medium",
            content: "For early-stage employees, consider 83(b) elections for unvested shares to start capital gains clock early."
          }
        );
        break;
        
      case "Acquisition":
        baseConsiderations.push(
          {
            title: "Stock vs. Cash Consideration",
            impact: "High",
            content: "The tax treatment of stock-for-stock exchanges in acquisitions may qualify for tax-free reorganization treatment under Section 368."
          },
          {
            title: advancedSettings.hasEarnout ? "Earnout Tax Timing" : "Acquisition Tax Timing",
            impact: "Medium",
            content: advancedSettings.hasEarnout 
              ? `With ${advancedSettings.earnoutPercentage}% as earnout, consider the tax timing implications - earnouts are typically taxed only when received.` 
              : "Acquisition payments are typically taxable in the year received, but structured payments may allow for tax deferral."
          }
        );
        break;
        
      case "Secondary":
        baseConsiderations.push(
          {
            title: "Secondary Sale Discount",
            impact: "Medium",
            content: `The ${advancedSettings.secondaryDiscount}% discount on secondary sales reduces your proceeds but may be worthwhile for immediate liquidity.`
          },
          {
            title: "Partial vs. Full Sale",
            impact: "Medium",
            content: "A partial sale may optimize tax consequences by spreading income across multiple tax years while retaining future upside."
          }
        );
        break;
    }
    
    // Add common tax considerations that apply to all exit types
    baseConsiderations.push(
      {
        title: "Long-term vs. Short-term Capital Gains",
        impact: "High",
        content: `The difference between long-term (${advancedSettings.federalTaxRate > 30 ? '20%' : '15%'} max) and short-term (up to ${advancedSettings.federalTaxRate}%) capital gains rates significantly impacts your after-tax proceeds.`,
      },
      {
        title: "Cashflow Planning",
        impact: "High",
        content: "Exercise costs and tax payments require careful cashflow planning. Consider liquidity needs and exercise timing accordingly.",
      }
    );
    
    // Add multi-state tax consideration if applicable
    if (hasMultiStateConsiderations) {
      baseConsiderations.push({
        title: "Multi-State Tax Allocation",
        impact: "Medium",
        content: "Your equity compensation may be subject to tax in multiple states based on where you worked during the vesting period."
      });
    }
    
    // Add NIIT consideration if applicable
    if (advancedSettings.includeNIIT) {
      baseConsiderations.push({
        title: "Net Investment Income Tax",
        impact: "Medium",
        content: "Your investment gains may be subject to an additional 3.8% NIIT if your income exceeds certain thresholds."
      });
    }
    
    return baseConsiderations;
  };

  return (
    <DecisionLayout
      title="Exit Strategy Planner"
      description="Optimize your exit strategy to maximize after-tax returns"
      steps={steps}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      isComplete={currentStep === steps.length - 1}
    >
      {currentStep === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Exit Scenario Modeling</h2>
          <p className="text-muted-foreground">
            Define the exit scenario you're planning for to model potential outcomes
          </p>

          <Tabs defaultValue="ipo" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="ipo" onClick={() => setExitScenario({...exitScenario, type: "IPO"})}>
                IPO
              </TabsTrigger>
              <TabsTrigger value="acquisition" onClick={() => setExitScenario({...exitScenario, type: "Acquisition"})}>
                Acquisition
              </TabsTrigger>
              <TabsTrigger value="secondary" onClick={() => setExitScenario({...exitScenario, type: "Secondary"})}>
                Secondary Sale
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ipo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    IPO Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Expected Timing</Label>
                    <RadioGroup
                      value={exitScenario.timing}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          timing: value,
                        })
                      }
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
                    <Label>Valuation Scenario</Label>
                    <Select
                      value={exitScenario.selectedScenario}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          selectedScenario: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SCENARIOS.filter(s => s.name.includes("IPO")).map((scenario) => (
                          <SelectItem key={scenario.name} value={scenario.name}>
                            {scenario.name} ({scenario.multiplier}x)
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Multiple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exitScenario.selectedScenario === "custom" && (
                    <div className="space-y-2">
                      <Label>Custom Multiple: {exitScenario.customMultiplier}x</Label>
                      <Slider
                        value={[exitScenario.customMultiplier]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(values) =>
                          setExitScenario({
                            ...exitScenario,
                            customMultiplier: values[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1x</span>
                        <span>25x</span>
                        <span>50x</span>
                        <span>75x</span>
                        <span>100x</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Valuation Method</Label>
                    <RadioGroup
                      value={exitScenario.priceType}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          priceType: value,
                        })
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percent" id="type-percent" />
                        <Label htmlFor="type-percent">Multiple of Current FMV</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="type-price" />
                        <Label htmlFor="type-price">Specific Share Price</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {exitScenario.priceType === "price" && (
                    <div className="space-y-2">
                      <Label>Share Price at Exit ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={exitScenario.exitPrice}
                        onChange={(e) =>
                          setExitScenario({
                            ...exitScenario,
                            exitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter exit share price"
                      />
                    </div>
                  )}
                  
                  <div className="p-3 bg-primary/5 rounded-md mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Estimated Exit Share Price:</span>
                      <span className="text-sm font-bold">{formatCurrency(getExitPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="acquisition" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Acquisition Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Expected Timing</Label>
                    <RadioGroup
                      value={exitScenario.timing}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          timing: value,
                        })
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0-6" id="timing-0-6-acq" />
                        <Label htmlFor="timing-0-6-acq">0-6 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="6-12" id="timing-6-12-acq" />
                        <Label htmlFor="timing-6-12-acq">6-12 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1-2" id="timing-1-2-acq" />
                        <Label htmlFor="timing-1-2-acq">1-2 years</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2+" id="timing-2+-acq" />
                        <Label htmlFor="timing-2+-acq">2+ years</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Valuation Scenario</Label>
                    <Select
                      value={exitScenario.selectedScenario}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          selectedScenario: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SCENARIOS.filter(s => s.name.includes("Acquisition")).map((scenario) => (
                          <SelectItem key={scenario.name} value={scenario.name}>
                            {scenario.name} ({scenario.multiplier}x)
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Multiple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exitScenario.selectedScenario === "custom" && (
                    <div className="space-y-2">
                      <Label>Custom Multiple: {exitScenario.customMultiplier}x</Label>
                      <Slider
                        value={[exitScenario.customMultiplier]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(values) =>
                          setExitScenario({
                            ...exitScenario,
                            customMultiplier: values[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1x</span>
                        <span>25x</span>
                        <span>50x</span>
                        <span>75x</span>
                        <span>100x</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Valuation Method</Label>
                    <RadioGroup
                      value={exitScenario.priceType}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          priceType: value,
                        })
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percent" id="type-percent-acq" />
                        <Label htmlFor="type-percent-acq">Multiple of Current FMV</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="type-price-acq" />
                        <Label htmlFor="type-price-acq">Specific Share Price</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {exitScenario.priceType === "price" && (
                    <div className="space-y-2">
                      <Label>Share Price at Exit ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={exitScenario.exitPrice}
                        onChange={(e) =>
                          setExitScenario({
                            ...exitScenario,
                            exitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter exit share price"
                      />
                    </div>
                  )}
                  
                  <div className="p-3 bg-primary/5 rounded-md mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Estimated Exit Share Price:</span>
                      <span className="text-sm font-bold">{formatCurrency(getExitPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="secondary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Secondary Sale Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Expected Timing</Label>
                    <RadioGroup
                      value={exitScenario.timing}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          timing: value,
                        })
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0-6" id="timing-0-6-sec" />
                        <Label htmlFor="timing-0-6-sec">0-6 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="6-12" id="timing-6-12-sec" />
                        <Label htmlFor="timing-6-12-sec">6-12 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1-2" id="timing-1-2-sec" />
                        <Label htmlFor="timing-1-2-sec">1-2 years</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2+" id="timing-2+-sec" />
                        <Label htmlFor="timing-2+-sec">2+ years</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Discount to Primary Valuation</Label>
                    <Select
                      value={exitScenario.selectedScenario}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          selectedScenario: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Secondary - Conservative">Minor Discount (5x)</SelectItem>
                        <SelectItem value="Secondary - Moderate">Moderate Discount (4x)</SelectItem>
                        <SelectItem value="Secondary - Significant">Significant Discount (3x)</SelectItem>
                        <SelectItem value="custom">Custom Valuation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exitScenario.selectedScenario === "custom" && (
                    <div className="space-y-2">
                      <Label>Custom Multiple: {exitScenario.customMultiplier}x</Label>
                      <Slider
                        value={[exitScenario.customMultiplier]}
                        min={1}
                        max={20}
                        step={0.1}
                        onValueChange={(values) =>
                          setExitScenario({
                            ...exitScenario,
                            customMultiplier: values[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1x</span>
                        <span>5x</span>
                        <span>10x</span>
                        <span>15x</span>
                        <span>20x</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Valuation Method</Label>
                    <RadioGroup
                      value={exitScenario.priceType}
                      onValueChange={(value) =>
                        setExitScenario({
                          ...exitScenario,
                          priceType: value,
                        })
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percent" id="type-percent-sec" />
                        <Label htmlFor="type-percent-sec">Multiple of Current FMV</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="type-price-sec" />
                        <Label htmlFor="type-price-sec">Specific Share Price</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {exitScenario.priceType === "price" && (
                    <div className="space-y-2">
                      <Label>Share Price at Exit ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={exitScenario.exitPrice}
                        onChange={(e) =>
                          setExitScenario({
                            ...exitScenario,
                            exitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter exit share price"
                      />
                    </div>
                  )}
                  
                  <div className="p-3 bg-primary/5 rounded-md mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Estimated Exit Share Price:</span>
                      <span className="text-sm font-bold">{formatCurrency(getExitPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Tax Strategy</h2>
          <p className="text-muted-foreground">
            Define your tax strategy to maximize after-tax returns
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exercise Before Exit</Label>
              <RadioGroup
                value={taxStrategy.exerciseBeforeExit}
                onValueChange={(value) =>
                  setTaxStrategy({
                    ...taxStrategy,
                    exerciseBeforeExit: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="exercise-all" />
                  <Label htmlFor="exercise-all">Exercise all options now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="some" id="exercise-some" />
                  <Label htmlFor="exercise-some">
                    Exercise some options now
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="exercise-none" />
                  <Label htmlFor="exercise-none">
                    Wait until exit to exercise
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {taxStrategy.exerciseBeforeExit !== "none" && (
              <div className="space-y-2">
                <Label>Exercise Timing</Label>
                <RadioGroup
                  value={taxStrategy.exerciseTiming}
                  onValueChange={(value) =>
                    setTaxStrategy({
                      ...taxStrategy,
                      exerciseTiming: value,
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="timing-now" />
                    <Label htmlFor="timing-now">As soon as possible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staggered" id="timing-staggered" />
                    <Label htmlFor="timing-staggered">
                      Staggered over time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="threshold" id="timing-threshold" />
                    <Label htmlFor="timing-threshold">
                      When company reaches valuation threshold
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Post-Exit Holding Period</Label>
              <RadioGroup
                value={taxStrategy.holdingPeriod}
                onValueChange={(value) =>
                  setTaxStrategy({
                    ...taxStrategy,
                    holdingPeriod: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="holding-immediate" />
                  <Label htmlFor="holding-immediate">Sell immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-year" id="holding-1-year" />
                  <Label htmlFor="holding-1-year">
                    Hold for 1 year after exit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="varied" id="holding-varied" />
                  <Label htmlFor="holding-varied">Varied holding periods</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Selling Strategy</Label>
              <RadioGroup
                value={taxStrategy.sellTiming}
                onValueChange={(value) =>
                  setTaxStrategy({
                    ...taxStrategy,
                    sellTiming: value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="sell-all" />
                  <Label htmlFor="sell-all">Sell all at once</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staggered" id="sell-staggered" />
                  <Label htmlFor="sell-staggered">Staggered sales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10b5-1" id="sell-10b5-1" />
                  <Label htmlFor="sell-10b5-1">10b5-1 plan</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={() => setAdvancedSettings({
                  ...advancedSettings,
                  showAdvanced: !advancedSettings.showAdvanced
                })}
              >
                {advancedSettings.showAdvanced ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Advanced Settings
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Advanced Settings
                  </>
                )}
              </Button>
            </div>
            
            {advancedSettings.showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-muted">
                <h3 className="text-lg font-medium mt-4">Advanced Tax Settings</h3>
                
                <div className="space-y-2">
                  <Label>Filing Status</Label>
                  <Select
                    value={taxStrategy.filingStatus}
                    onValueChange={(value) =>
                      setTaxStrategy({
                        ...taxStrategy,
                        filingStatus: value,
                      })
                    }
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
                    value={taxStrategy.stateOfResidence}
                    onValueChange={(value) =>
                      setTaxStrategy({
                        ...taxStrategy,
                        stateOfResidence: value,
                      })
                    }
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="other-income">Annual Income (excluding equity)</Label>
                    <span className="text-sm text-muted-foreground">{formatCurrency(advancedSettings.otherIncome)}</span>
                  </div>
                  <Input
                    id="other-income"
                    type="number"
                    min="0"
                    step="1000"
                    value={advancedSettings.otherIncome}
                    onChange={(e) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        otherIncome: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter annual income"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Federal Tax Rate (%)</Label>
                    <span className="text-sm font-medium">{advancedSettings.federalTaxRate}%</span>
                  </div>
                  <Slider 
                    value={[advancedSettings.federalTaxRate]} 
                    min={10} 
                    max={40} 
                    step={1}
                    onValueChange={(values) => 
                      setAdvancedSettings({
                        ...advancedSettings,
                        federalTaxRate: values[0],
                      })
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
                    <span className="text-sm font-medium">{advancedSettings.stateTaxRate}%</span>
                  </div>
                  <Slider 
                    value={[advancedSettings.stateTaxRate]} 
                    min={0} 
                    max={15} 
                    step={0.5}
                    onValueChange={(values) => 
                      setAdvancedSettings({
                        ...advancedSettings,
                        stateTaxRate: values[0],
                      })
                    }
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>7.5%</span>
                    <span>15%</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="include-amt"
                    checked={taxStrategy.includeAMT}
                    onCheckedChange={(checked) =>
                      setTaxStrategy({
                        ...taxStrategy,
                        includeAMT: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="include-amt" className="text-sm font-normal">
                    Include Alternative Minimum Tax (AMT) in calculations
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="include-niit"
                    checked={advancedSettings.includeNIIT}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        includeNIIT: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="include-niit" className="text-sm font-normal">
                    Include Net Investment Income Tax (3.8%)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="use-enhanced"
                    checked={advancedSettings.useEnhancedCalculations}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        useEnhancedCalculations: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="use-enhanced" className="text-sm font-normal">
                    Use exit-specific enhanced tax calculations
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="multi-state"
                    checked={advancedSettings.isMultiState}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        isMultiState: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="multi-state" className="text-sm font-normal">
                    Enable multi-state tax allocation
                  </Label>
                </div>
                
                {taxStrategy.includeAMT && (
                  <div className="space-y-2">
                    <Label htmlFor="amt-credits">Prior Year AMT Credits</Label>
                    <Input
                      id="amt-credits"
                      type="number"
                      min="0"
                      step="1000"
                      value={advancedSettings.priorAMTCredits}
                      onChange={(e) =>
                        setAdvancedSettings({
                          ...advancedSettings,
                          priorAMTCredits: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter AMT credits"
                    />
                  </div>
                )}
                
                {/* Exit Type-Specific Settings */}
                {exitScenario.type === "Acquisition" && (
                  <div className="space-y-4 mt-4 p-3 bg-muted/20 rounded-md">
                    <h4 className="font-medium">Acquisition-Specific Settings</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Cash Percentage</Label>
                        <span className="text-sm font-medium">{advancedSettings.cashPercentage}%</span>
                      </div>
                      <Slider 
                        value={[advancedSettings.cashPercentage]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(values) => 
                          setAdvancedSettings({
                            ...advancedSettings,
                            cashPercentage: values[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0% (All Stock)</span>
                        <span>50%</span>
                        <span>100% (All Cash)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="has-earnout"
                        checked={advancedSettings.hasEarnout}
                        onCheckedChange={(checked) =>
                          setAdvancedSettings({
                            ...advancedSettings,
                            hasEarnout: !!checked,
                          })
                        }
                      />
                      <Label htmlFor="has-earnout" className="text-sm font-normal">
                        Include earnout component
                      </Label>
                    </div>
                    
                    {advancedSettings.hasEarnout && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Earnout Percentage</Label>
                          <span className="text-sm font-medium">{advancedSettings.earnoutPercentage}%</span>
                        </div>
                        <Slider 
                          value={[advancedSettings.earnoutPercentage]} 
                          min={0} 
                          max={50} 
                          step={5}
                          onValueChange={(values) => 
                            setAdvancedSettings({
                              ...advancedSettings,
                              earnoutPercentage: values[0],
                            })
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {exitScenario.type === "Secondary" && (
                  <div className="space-y-4 mt-4 p-3 bg-muted/20 rounded-md">
                    <h4 className="font-medium">Secondary Sale Settings</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Secondary Market Discount</Label>
                        <span className="text-sm font-medium">{advancedSettings.secondaryDiscount}%</span>
                      </div>
                      <Slider 
                        value={[advancedSettings.secondaryDiscount]} 
                        min={0} 
                        max={50} 
                        step={5}
                        onValueChange={(values) => 
                          setAdvancedSettings({
                            ...advancedSettings,
                            secondaryDiscount: values[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0% (No Discount)</span>
                        <span>25%</span>
                        <span>50% (Deep Discount)</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {taxStrategy.sellTiming === "staggered" && (
                  <div className="space-y-3 pt-2">
                    <Label>Staggered Sale Schedule</Label>
                    <div className="space-y-3">
                      {advancedSettings.staggeredSales.map((sale, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1/3">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={sale.months}
                              onChange={(e) => {
                                const newSales = [...advancedSettings.staggeredSales];
                                newSales[index].months = parseInt(e.target.value) || 0;
                                setAdvancedSettings({
                                  ...advancedSettings,
                                  staggeredSales: newSales
                                });
                              }}
                              placeholder="Months after exit"
                            />
                          </div>
                          <Label className="whitespace-nowrap w-32">months after exit</Label>
                          <div className="w-1/4">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={sale.percentage}
                              onChange={(e) => {
                                const newSales = [...advancedSettings.staggeredSales];
                                newSales[index].percentage = parseInt(e.target.value) || 0;
                                setAdvancedSettings({
                                  ...advancedSettings,
                                  staggeredSales: newSales
                                });
                              }}
                              placeholder="% of shares"
                            />
                          </div>
                          <Label className="whitespace-nowrap w-20">% of shares</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 2 && results && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-center mb-4">
            Exit Strategy Recommendations
          </h2>

          <div className="grid gap-6 md:grid-cols-2 mb-2">
            <div className="p-4 border rounded-md bg-muted/30">
              <h3 className="font-medium mb-2">Current Value</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(results.currentValue)}
              </div>
            </div>
            
            <div className="p-4 border rounded-md bg-primary/5">
              <h3 className="font-medium mb-2">Projected Exit Value</h3>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(results.exitValue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {results.growthMultiple.toFixed(1)}x growth from current value
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                Grant-by-Grant Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[320px] overflow-y-auto">
              <div className="space-y-3">
                {results.strategies.map((strategy, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">
                        {strategy.grantType} - {strategy.shares} shares
                      </span>
                      <span
                        className="text-sm font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 
                            strategy.recommendation === "now" ? "rgba(22, 163, 74, 0.1)" : 
                            strategy.recommendation === "exit" ? "rgba(59, 130, 246, 0.1)" : 
                            strategy.recommendation === "hold" ? "rgba(217, 119, 6, 0.1)" :
                            "rgba(139, 92, 246, 0.1)",
                          color:
                            strategy.recommendation === "now" ? "rgb(22, 163, 74)" :
                            strategy.recommendation === "exit" ? "rgb(59, 130, 246)" :
                            strategy.recommendation === "hold" ? "rgb(217, 119, 6)" :
                            "rgb(139, 92, 246)"
                        }}
                      >
                        {strategy.bestStrategy}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Optimal strategy potential: {formatCurrency(strategy.potential)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tax savings vs. next best: {formatCurrency(strategy.taxSavings)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="recommendations">
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="tax">
                Tax Considerations
              </TabsTrigger>
              <TabsTrigger value="timing">
                Timing Strategies
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Key Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    {results.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-md">
                        <h4 className="font-medium mb-1 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          {rec.title}
                        </h4>
                        <p className="text-sm">{rec.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tax">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Considerations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    {results.taxConsiderations.map((consideration, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium">{consideration.title}</h4>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 
                                consideration.impact === "High" ? "rgba(239, 68, 68, 0.1)" : 
                                consideration.impact === "Medium" ? "rgba(245, 158, 11, 0.1)" : 
                                "rgba(45, 212, 191, 0.1)",
                              color:
                                consideration.impact === "High" ? "rgb(239, 68, 68)" :
                                consideration.impact === "Medium" ? "rgb(245, 158, 11)" :
                                "rgb(45, 212, 191)"
                            }}
                          >
                            {consideration.impact} Impact
                          </span>
                        </div>
                        <p className="text-sm">{consideration.content}</p>
                        
                        {/* Add special indicators for exit-specific tax considerations */}
                        {consideration.title.includes(results.exitType) && (
                          <div className="mt-2 text-xs text-primary font-medium">
                            ★ {results.exitType}-specific consideration
                          </div>
                        )}
                        
                        {consideration.title.includes("Earnout") && results.exitType === "Acquisition" && (
                          <div className="mt-2 text-xs text-primary font-medium">
                            ★ Important for acquisition earnout planning
                          </div>
                        )}
                        
                        {consideration.title.includes("Lock-up") && results.exitType === "IPO" && (
                          <div className="mt-2 text-xs text-primary font-medium">
                            ★ Critical for IPO planning
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timing">
              <Card>
                <CardHeader>
                  <CardTitle>Timing Strategies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        Exercise Timing
                      </h4>
                      <p className="text-sm mb-3">
                        {exitScenario.type === "IPO" 
                          ? "For IPOs, consider the 6-month lockup period after going public. Plan your exercise strategy accordingly."
                          : exitScenario.type === "Acquisition" 
                          ? "In acquisition scenarios, exercise decisions often need to be made quickly when the deal is announced."
                          : "Secondary sales may offer limited windows of opportunity. Be prepared to make decisions quickly."}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-background rounded-md">
                          <span className="font-medium block mb-1">Optimal for Tax Savings</span>
                          <span className="text-muted-foreground">
                            Exercise ISOs 12+ months before expected exit
                          </span>
                        </div>
                        <div className="p-2 bg-background rounded-md">
                          <span className="font-medium block mb-1">Optimal for Risk Reduction</span>
                          <span className="text-muted-foreground">
                            Exercise closer to exit when success is more certain
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="font-medium mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                        Post-Exit Selling Strategies
                      </h4>
                      <p className="text-sm mb-3">
                        {taxStrategy.sellTiming === "staggered" 
                          ? "Your selected staggered selling approach can help balance tax optimization with risk management."
                          : taxStrategy.sellTiming === "10b5-1" 
                          ? "A 10b5-1 plan provides a structured approach to selling shares that helps avoid insider trading concerns."
                          : "Selling all at once simplifies the process but may not be optimal from a tax perspective."}
                      </p>
                      
                      {exitScenario.type === "IPO" && (
                        <div className="flex items-center p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm mb-2">
                          <Info className="h-4 w-4 mr-2" />
                          Remember: The typical IPO lockup period is 180 days, during which you cannot sell shares.
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-background rounded-md">
                          <span className="font-medium block mb-1">Tax Efficiency</span>
                          <span className="text-muted-foreground">
                            Selling across multiple tax years can reduce overall tax burden
                          </span>
                        </div>
                        <div className="p-2 bg-background rounded-md">
                          <span className="font-medium block mb-1">Risk Management</span>
                          <span className="text-muted-foreground">
                            Consider selling some shares immediately to diversify your portfolio
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => window.print()}>
              Save & Print Strategy
            </Button>
            
            <Button>
              Schedule Advisor Consultation
            </Button>
          </div>
        </div>
      )}
    </DecisionLayout>
  );
}