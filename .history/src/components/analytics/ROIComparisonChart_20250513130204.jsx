// src/components/analytics/ROIComparisonChart.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLORS, safeValue } from "@/utils/format-utils";

/**
 * Component that displays ROI comparison across scenarios
 * @param {Array} data - Scenario comparison data
 */
export const ROIComparisonChart = ({ data }) => {
  // Calculate ROI for each scenario
  const roiData = data.map((scenario) => ({
    name: scenario.name,
    roi:
      scenario.exerciseCost > 0
        ? (scenario.netValue / scenario.exerciseCost) * 100
        : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return on Investment</CardTitle>
        <CardDescription>Comparing ROI across scenarios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={roiData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
              <Tooltip
                formatter={(value) => [
                  `${safeValue(value).toFixed(1)}%`,
                  "ROI",
                ]}
              />
              <Bar
                dataKey="roi"
                name="Return on Investment"
                fill="#82ca9d"
                label={{
                  position: "top",
                  formatter: (value) => `${safeValue(value).toFixed(0)}%`,
                }}
              >
                {roiData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ROIComparisonChart;
