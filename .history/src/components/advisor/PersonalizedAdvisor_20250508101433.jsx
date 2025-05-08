// src/components/advisor/PersonalizedAdvisor.jsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { generatePersonalizedAdvice } from "@/utils/advisorEngine";
import { formatCurrency } from "@/utils/formatters";

export function PersonalizedAdvisor({
  grants,
  userFinancialData,
  calculationResults,
}) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate advice when component mounts or when inputs change
  useEffect(() => {
    if (grants && userFinancialData) {
      setLoading(true);
      // Simulate AI processing time
      setTimeout(() => {
        const generatedAdvice = generatePersonalizedAdvice(
          grants,
          userFinancialData,
          calculationResults
        );
        setAdvice(generatedAdvice);
        setLoading(false);
      }, 1500);
    }
  }, [grants, userFinancialData, calculationResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 space-x-2">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span>Analyzing your financial situation...</span>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">
          Add more financial information to get personalized advice.
        </p>
        <Button variant="outline" className="mt-4">
          Update Financial Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="bg-primary/20 p-2 rounded-full">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Financial Snapshot</h3>
            <p className="text-sm mt-1">{advice.summary}</p>
          </div>
        </div>
      </div>

      {/* Key insights */}
      <div className="space-y-3">
        {advice.insights.map((insight, index) => (
          <Alert
            key={index}
            className={`border-l-4 ${getPriorityBorderColor(insight.priority)}`}
          >
            <div className="flex items-start gap-2">
              <Lightbulb className={getPriorityIconColor(insight.priority)} />
              <div>
                <AlertTitle>{insight.title}</AlertTitle>
                <AlertDescription>{insight.content}</AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </div>

      {/* Recommended actions */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="font-medium flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          Recommended Actions
        </h3>
        <div className="space-y-2">
          {advice.recommendedActions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-md"
            >
              <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                <ArrowRight className="h-3 w-3 text-primary" />
              </div>
              <p className="text-sm flex-1">{action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper functions for styling based on priority
function getPriorityBorderColor(priority) {
  switch (priority) {
    case "high":
      return "border-red-400";
    case "medium":
      return "border-yellow-400";
    case "low":
      return "border-blue-400";
    default:
      return "border-gray-400";
  }
}

function getPriorityIconColor(priority) {
  switch (priority) {
    case "high":
      return "h-5 w-5 text-red-500";
    case "medium":
      return "h-5 w-5 text-yellow-500";
    case "low":
      return "h-5 w-5 text-blue-500";
    default:
      return "h-5 w-5 text-gray-500";
  }
}
