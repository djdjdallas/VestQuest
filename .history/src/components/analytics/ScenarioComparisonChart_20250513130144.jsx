// src/components/analytics/ScenarioComparisonChart.jsx

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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/format-utils";

/**
 * Component that displays scenario net value comparison
 * @param {Array} data - Scenario comparison data
 */
export const ScenarioComparisonChart = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Net Value Comparison</CardTitle>
        <CardDescription>
          Comparing potential value across different exit scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value) => [formatCurrency(value), ""]} />
              <Legend />
              <Bar dataKey="netValue" name="Net Value" fill="#8884d8" />
              <Bar dataKey="taxes" name="Taxes" fill="#FF8042" />
              <Bar dataKey="exerciseCost" name="Exercise Cost" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioComparisonChart;
