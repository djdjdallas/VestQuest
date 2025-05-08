import React, { useState, useEffect } from "react";
import { Info, AlertCircle, Check, Clock, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generatePersonalizedAdvice } from "@/utils/advisorEngine";

export function PersonalizedAdvisor({ grants = [], userFinancialData = {} }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate personalized advice using the advisor engine
    const generateAdvice = () => {
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
              ? estimateAMTImpact(grants, userFinancialData.income || 150000)
              : 0,
          },
        };

        const adviceResult = generatePersonalizedAdvice(
          grants,
          userFinancialData,
          calculationResults
        );
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
      } finally {
        setLoading(false);
      }
    };

    generateAdvice();
  }, [grants, userFinancialData]);

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {advice?.insights?.length > 0 ? (
        <>
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
