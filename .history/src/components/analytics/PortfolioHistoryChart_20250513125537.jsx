// src/components/analytics/PortfolioHistoryChart.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/format-utils";

/**
 * Component that displays portfolio value history over time
 * @param {Array} data - The portfolio history data
 * @param {string} className - Additional CSS classes
 */
export const PortfolioHistoryChart = ({ data, className = "" }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Portfolio Value Over Time</CardTitle>
        <CardDescription>Historical and projected equity value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const [year, month] = value.split("-");
                  return `${
                    ["Jan", "Apr", "Jul", "Oct"][parseInt(month) / 3 - 1]
                  } ${year.slice(2)}`;
                }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Value"]}
                labelFormatter={(value) => {
                  const [year, month] = value.split("-");
                  return `${
                    ["January", "April", "July", "October"][
                      parseInt(month) / 3 - 1
                    ]
                  } ${year}`;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={(dataPoint) =>
                  dataPoint.projected ? "#82ca9d" : "#0088FE"
                }
                fillOpacity={1}
                fill={(dataPoint) =>
                  dataPoint.projected
                    ? "url(#colorProjected)"
                    : "url(#colorValue)"
                }
                activeDot={{ r: 8 }}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center space-x-8">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
            <span className="text-sm">Historical Value</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
            <span className="text-sm">Projected Value</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioHistoryChart;
