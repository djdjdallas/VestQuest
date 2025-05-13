// src/components/analytics/CompanyValueChart.jsx

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
import { COLORS } from "@/utils/format-utils";
import { formatCurrency } from "@/utils/format-utils";

/**
 * Component that displays a bar chart of value by company
 * @param {Array} data - The value by company data array
 */
export const CompanyValueChart = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Value by Company</CardTitle>
        <CardDescription>
          Distribution of your vested equity value by company
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Value"]}
                />
                <Bar
                  dataKey="value"
                  fill="#0088FE"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: "right",
                    formatter: (value) => formatCurrency(value),
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No data available for this view
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyValueChart;
