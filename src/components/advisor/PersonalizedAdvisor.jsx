import React, { useState, useEffect } from "react";
import { Info, AlertCircle, Check, Clock, ArrowRight, RefreshCw, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generatePersonalizedAdvice } from "@/utils/advisorEngine";

export function PersonalizedAdvisor({ grants = [], userFinancialData = null }) {
  // Ensure we always have an object for financial data
  const financialData = userFinancialData || {};
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingAI, setUsingAI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Generate personalized advice using the advisor engine
    const generateAdvice = async () => {
      try {
        setLoading(true);
        // Use the advisor engine to generate advice based on the grants and financial data
        const calculationResults = {
          totals: {
            exerciseCost: grants.reduce(
              (sum, grant) =>
                sum + (grant.vested_shares || 0) * grant.strike_price,
              0
            ),
            netProceeds: grants.reduce(
              (sum, grant) =>
                sum + (grant.vested_shares || 0) * grant.current_fmv,
              0
            ),
          },
          amt: {
            netAMTDue: grants.some((g) => g.grant_type === "ISO")
              ? estimateAMTImpact(grants, financialData.income || 150000)
              : 0,
          },
        };

        // The advisorEngine now returns a Promise
        const adviceResult = await generatePersonalizedAdvice(
          grants,
          financialData,
          calculationResults
        );
        
        // Determine if AI was used based on data structure or properties
        setUsingAI(adviceResult.powered_by_claude || adviceResult.insights.length > 2);
        setAdvice(adviceResult);
      } catch (error) {
        console.error("Error generating advice:", error);
        // Set fallback advice if generation fails
        setAdvice({
          insights: [
            {
              type: "general",
              title: "Consider your financial goals",
              content:
                "Your equity strategy should align with your overall financial goals. Consider factors like diversification, tax implications, and your time horizon.",
              priority: "medium",
            },
          ],
          summary:
            "Make decisions about your equity based on your personal financial situation and goals.",
          recommendedActions: [
            "Review your vesting schedule and upcoming events",
            "Consider consulting with a financial advisor about your equity",
          ],
        });
        setUsingAI(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    generateAdvice();
  }, [grants, userFinancialData, refreshing]);

  // Simple estimate of potential AMT impact for ISOs
  const estimateAMTImpact = (grants, income = 150000) => {
    const isoGrants = grants.filter((g) => g.grant_type === "ISO");
    const totalSpread = isoGrants.reduce(
      (sum, grant) =>
        sum +
        (grant.vested_shares || 0) * (grant.current_fmv - grant.strike_price),
      0
    );

    // Very simplified AMT calculation for demonstration purposes
    const amtRate = 0.26; // Simplified AMT rate
    return Math.max(0, totalSpread * amtRate);
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <Clock className="h-10 w-10 text-primary mx-auto mb-3 animate-pulse" />
        <p className="text-muted-foreground">
          Generating personalized recommendations...
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Using advanced AI to analyze your equity portfolio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {advice?.insights?.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-base">Strategic Insights</h3>
              
              {usingAI && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>AI Powered</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        These recommendations are generated using Claude, an advanced AI assistant
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              onClick={() => setRefreshing(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {advice.insights.map((insight, index) => (
              <Card
                key={index}
                className={`border-l-4 ${getPriorityBorderColor(
                  insight.priority
                )}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div>{getInsightIcon(insight.type)}</div>
                    <div>
                      <h3 className="font-medium text-base">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="font-medium text-base mb-2">Recommended Actions</h3>
            <ul className="space-y-2">
              {advice.recommendedActions ? (
                advice.recommendedActions.map((action, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <ArrowRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))
              ) : (
                <li className="flex gap-2 items-start">
                  <ArrowRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-sm">
                    Review your equity portfolio regularly and consider
                    consulting with a financial advisor.
                  </span>
                </li>
              )}
            </ul>
          </div>
          
          {advice.summary && (
            <CardFooter className="px-0 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Summary:</span> {advice.summary}
              </p>
            </CardFooter>
          )}
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Financial Profile Incomplete</AlertTitle>
          <AlertDescription>
            Complete your financial profile to get personalized recommendations
            for your equity grants.
          </AlertDescription>
          <Button size="sm" className="mt-3">
            Update Financial Profile
          </Button>
        </Alert>
      )}
      
      {usingAI && (
        <div className="text-xs text-right text-muted-foreground mt-2">
          Powered by Claude AI
        </div>
      )}
    </div>
  );
}

// Helper function to get the border color based on priority
function getPriorityBorderColor(priority) {
  switch (priority) {
    case "high":
      return "border-red-500";
    case "medium":
      return "border-amber-500";
    case "low":
      return "border-blue-500";
    default:
      return "border-gray-300";
  }
}

// Helper function to get the appropriate icon based on insight type
function getInsightIcon(type) {
  switch (type) {
    case "diversification":
      return <Info className="h-5 w-5 text-blue-500" />;
    case "tax":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case "liquidity":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "retirement":
      return <Clock className="h-5 w-5 text-green-500" />;
    case "debt":
      return <Check className="h-5 w-5 text-purple-500" />;
    default:
      return <Info className="h-5 w-5 text-primary" />;
  }
}
