// src/components/analytics/ScenarioDetailsList.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LineChart, Share2, BarChart3 } from "lucide-react";
import { COLORS, formatCurrency } from "@/utils/format-utils";

/**
 * Component that displays detailed information about scenarios
 * @param {Array} data - Scenario comparison data
 */
export const ScenarioDetailsList = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Details</CardTitle>
        <CardDescription>
          Comparative analysis of exit scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((scenario, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                    style={{
                      backgroundColor: `${COLORS[index % COLORS.length]}20`,
                    }}
                  >
                    {scenario.exit_type === "IPO" ? (
                      <LineChart
                        className="h-4 w-4"
                        style={{
                          color: COLORS[index % COLORS.length],
                        }}
                      />
                    ) : scenario.exit_type === "Acquisition" ? (
                      <Share2
                        className="h-4 w-4"
                        style={{
                          color: COLORS[index % COLORS.length],
                        }}
                      />
                    ) : (
                      <BarChart3
                        className="h-4 w-4"
                        style={{
                          color: COLORS[index % COLORS.length],
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{scenario.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {scenario.exit_type}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">
                  {formatCurrency(scenario.netValue)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Exercise Cost</p>
                  <p>{formatCurrency(scenario.exerciseCost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gross Value</p>
                  <p>{formatCurrency(scenario.grossValue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax Estimate</p>
                  <p>{formatCurrency(scenario.taxes)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioDetailsList;
