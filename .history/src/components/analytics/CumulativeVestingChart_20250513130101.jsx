// src/components/analytics/CumulativeVestingChart.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, safeValue } from "@/utils/format-utils";

/**
 * Component that displays cumulative vesting projection
 * @param {Array} forecastData - The vesting forecast data
 * @param {number} vestedShares - Currently vested shares
 * @param {Array} valueForecast - Vesting value forecast data
 */
export const CumulativeVestingChart = ({
  forecastData,
  vestedShares,
  valueForecast,
}) => {
  // Calculate the total forecast value
  const totalForecastValue = valueForecast.reduce(
    (sum, item) => sum + safeValue(item.value),
    0
  );

  // Calculate the total forecast shares
  const totalForecastShares = forecastData.reduce(
    (sum, item) => sum + safeValue(item.value),
    0
  );

  // Create data for the cumulative chart
  const cumulativeData = [
    { date: "Now", value: vestedShares },
    ...forecastData.map((item, index) => ({
      date: item.date,
      value:
        vestedShares +
        forecastData
          .slice(0, index + 1)
          .reduce((sum, i) => sum + safeValue(i.value), 0),
    })),
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Cumulative Vesting Projection</CardTitle>
        <CardDescription>
          Projected equity accumulation over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forecastData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cumulativeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    value.toLocaleString(),
                    "Vested Shares",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No vesting projection data available
          </div>
        )}
        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
          <h4 className="font-medium mb-2">Vesting Projection Insights</h4>
          <p className="text-sm text-muted-foreground">
            Based on your current grants, you'll vest approximately
            <strong> {totalForecastShares.toLocaleString()} </strong>
            additional shares over the next year, with an estimated value of
            <strong> {formatCurrency(totalForecastValue)} </strong>
            at current share prices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CumulativeVestingChart;
