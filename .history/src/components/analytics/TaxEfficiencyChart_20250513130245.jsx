// src/components/analytics/TaxEfficiencyChart.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLORS, formatCurrency } from "@/utils/format-utils";

/**
 * Component that displays tax efficiency analysis
 * @param {Array} data - Scenario comparison data
 */
export const TaxEfficiencyChart = ({ data }) => {
  // Data processing for tax efficiency
  const taxEfficiencyData = data.map((scenario) => ({
    name: scenario.name,
    value: scenario.grossValue > 0 ? scenario.taxes / scenario.grossValue : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Efficiency Analysis</CardTitle>
        <CardDescription>
          Tax impact across scenarios as a percentage of gross value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={taxEfficiencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taxEfficiencyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${(value * 100).toFixed(1)}%`,
                  "Tax Rate",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {data.length > 0 && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium mb-2">Tax Optimization Opportunities</h4>
            <p className="text-sm text-muted-foreground">
              Based on the analysis, consider optimizing your exit strategy for
              scenarios with lower tax rates. The
              <strong> {data[0].name} </strong>
              scenario appears to be the most tax-efficient option with a
              potential net value of
              <strong> {formatCurrency(data[0].netValue)}</strong>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxEfficiencyChart;
