// src/components/analytics/PortfolioTimeline.jsx
import React from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

/**
 * Portfolio Timeline Component
 * Displays historical and projected equity value over time
 */
const PortfolioTimeline = ({ portfolioData = [] }) => {
  // Format the data for the chart
  const formattedData = portfolioData.map((entry) => ({
    ...entry,
    // Format date as readable month/year
    date: entry.date
      ? new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        })
      : "Unknown",
    // Ensure values are numbers for the chart
    historicalValue: Number(entry.historicalValue || 0),
    projectedValue: Number(entry.projectedValue || 0),
  }));

  // Custom tooltip to format currency values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded shadow border border-gray-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Portfolio Value Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Historical and projected equity value
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                align="center"
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="historicalValue"
                name="Historical Value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="projectedValue"
                name="Projected Value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioTimeline;
