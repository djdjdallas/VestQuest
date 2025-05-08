"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowUpRight,
  DownloadCloud,
} from "lucide-react";

export function AIScenarioInsights({ scenarios, financialData, companyData }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!scenarios || scenarios.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
          <p className="text-muted-foreground text-center">
            No scenarios available for analysis. Create scenarios to receive
            AI-powered insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null) {
      return "$0";
    }
    return `$${parseFloat(value)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Find best performing scenario by ROI
  const bestScenario = [...scenarios].sort(
    (a, b) => (b.roi_percentage || 0) - (a.roi_percentage || 0)
  )[0];

  // Generate recommendations based on scenarios
  const generateRecommendations = () => {
    const recommendations = [];

    // Tax optimization recommendation
    if (scenarios.some((s) => s.tax_liability > 100000)) {
      recommendations.push({
        type: "tax",
        title: "Tax Planning Opportunity",
        description:
          "High tax liability detected. Consider spreading exercises across tax years or utilizing tax-advantaged accounts.",
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      });
    }

    // Timing recommendation
    recommendations.push({
      type: "timing",
      title: "Optimal Exercise Timing",
      description: `Based on your scenarios, ${
        bestScenario.scenario_name
      } offers the best ROI at ${(bestScenario.roi_percentage || 0).toFixed(
        1
      )}%.`,
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    });

    // Diversification recommendation
    if (scenarios.some((s) => s.net_proceeds > 500000)) {
      recommendations.push({
        type: "diversification",
        title: "Consider Diversification",
        description:
          "Significant equity value detected. Consider diversifying a portion of proceeds after exercising.",
        icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Generate AI-powered text analysis of scenarios
  const getAIAnalysis = () => {
    // In a real implementation, this would call an AI service
    // Here we'll generate static text based on scenario data

    const highestROI = Math.max(...scenarios.map((s) => s.roi_percentage || 0));
    const lowestROI = Math.min(...scenarios.map((s) => s.roi_percentage || 0));
    const avgTaxRate =
      scenarios.reduce(
        (sum, s) => sum + (s.tax_liability / s.gross_proceeds) * 100,
        0
      ) / scenarios.length;

    return (
      <>
        <p className="mb-3">
          Analysis of your {scenarios.length} scenarios shows a potential ROI
          range from {lowestROI.toFixed(1)}% to {highestROI.toFixed(1)}%. The
          scenario "{bestScenario.scenario_name}" offers the strongest financial
          outcome with estimated net proceeds of{" "}
          {formatCurrency(bestScenario.net_proceeds)}.
        </p>

        <p className="mb-3">
          Your effective tax rate across scenarios averages{" "}
          {avgTaxRate.toFixed(1)}%.
          {avgTaxRate > 30
            ? " This is relatively high, suggesting potential for tax optimization strategies."
            : " This appears reasonable, but continued tax planning is recommended as your equity value grows."}
        </p>

        {expanded && (
          <>
            <p className="mb-3">
              Based on the exit values in your scenarios, establishing a
              systematic exercise strategy now could significantly reduce your
              overall tax burden. Consider exercising a portion of shares each
              year to spread the tax impact while positioning for long-term
              capital gains treatment.
            </p>

            <p>
              The most favorable scenario assumes a {bestScenario.exit_type}{" "}
              exit at ${bestScenario.exit_value} per share. While this
              represents an optimistic outcome, balancing this scenario with
              more conservative projections provides a more comprehensive view
              of your potential outcomes.
            </p>
          </>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/20 p-1">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">AI Scenario Analysis</CardTitle>
            </div>
            <Badge variant="outline" className="bg-primary/10">
              AI Powered
            </Badge>
          </div>
          <CardDescription>
            Personalized insights based on your scenario data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-3">
            {getAIAnalysis()}

            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Read full analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start pb-3 border-b last:border-b-0 last:pb-0"
                >
                  <div className="mt-0.5">{rec.icon}</div>
                  <div>
                    <h4 className="text-sm font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Scenario Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Key metrics across your {scenarios.length} scenarios:
            </p>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">
                  Best Performer
                </div>
                <div className="text-md font-medium">
                  {bestScenario.scenario_name}
                </div>
                <div className="text-sm">
                  ROI: {(bestScenario.roi_percentage || 0).toFixed(1)}%
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Avg. Net Proceeds
                  </div>
                  <div className="text-md font-medium">
                    {formatCurrency(
                      scenarios.reduce(
                        (sum, s) => sum + (s.net_proceeds || 0),
                        0
                      ) / scenarios.length
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Avg. Tax Rate
                  </div>
                  <div className="text-md font-medium">
                    {(
                      scenarios.reduce(
                        (sum, s) =>
                          sum +
                          ((s.tax_liability || 0) / (s.gross_proceeds || 1)) *
                            100,
                        0
                      ) / scenarios.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/dashboard/decisions/exit">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Generate Exit Strategy
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled={loading}>
          <DownloadCloud className="mr-2 h-4 w-4" />
          {loading ? "Generating..." : "Download Full Analysis"}
        </Button>
      </div>
    </div>
  );
}
