// src/components/analytics/VestingForecastChart.jsx

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
import { COLORS, customTooltipFormatter } from "@/utils/format-utils";

/**
 * Component that displays upcoming vesting forecast
 * @param {Array} data - The vesting forecast data
 * @param {Array} grants - All equity grants to derive companies
 */
export const VestingForecastChart = ({ data, grants }) => {
  // Get unique company names from grants
  const uniqueCompanies = grants
    .filter((g) => g && g.company_name)
    .map((grant) => grant.company_name)
    .filter(
      (company, index, self) => company && self.indexOf(company) === index
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Vesting</CardTitle>
        <CardDescription>
          Shares vesting over the next 12 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={customTooltipFormatter} />
                <Legend />
                {/* Create a bar for each company */}
                {uniqueCompanies.map((company, index) => (
                  <Bar
                    key={company}
                    dataKey={company}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No upcoming vesting events found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VestingForecastChart;
