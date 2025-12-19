// src/components/analytics/ScenariosTab.jsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart } from "lucide-react";
import ScenarioComparisonChart from "./ScenarioComparisonChart";
import ROIComparisonChart from "./ROIComparisonChart";
import ScenarioDetailsList from "./ScenarioDetailsList";
import TaxEfficiencyChart from "./TaxEfficiencyChart";

/**
 * Scenarios Comparison tab content
 * @param {Object} analytics - Analytics data object
 * @param {Array} scenarios - Scenarios data
 */
export const ScenariosTab = ({ analytics, scenarios }) => {
  // Check if we have scenario data
  const hasScenarios =
    analytics.comparisonData && analytics.comparisonData.length > 0;

  if (!hasScenarios) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
            <PieChart className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-medium">No scenarios available</h3>
            <p className="text-muted-foreground">
              Create scenarios to compare different exit strategies and optimize
              your equity decisions.
            </p>
            <Button asChild>
              <a href="/dashboard/scenarios/add">Create First Scenario</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <ScenarioComparisonChart data={analytics.comparisonData} />

      <div className="grid gap-6 md:grid-cols-2">
        <ROIComparisonChart data={analytics.comparisonData} />
        <ScenarioDetailsList data={analytics.comparisonData} />
      </div>

      <TaxEfficiencyChart data={analytics.comparisonData} />
    </div>
  );
};

export default ScenariosTab;
