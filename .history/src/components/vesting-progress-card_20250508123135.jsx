import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export function VestingProgressCard({
  vestedShares = 0,
  unvestedShares = 0,
  vestedPercent = 0,
}) {
  // Convert inputs to numbers to prevent rendering issues
  const vested = Number(vestedShares) || 0;
  const unvested = Number(unvestedShares) || 0;
  const percent = Number(vestedPercent) || 0;

  // Create data for the pie chart
  const data = [
    { name: "Vested", value: vested },
    { name: "Unvested", value: unvested },
  ];

  // Only create chart data if we have valid values
  const hasValidData = data.some((item) => item.value > 0);

  // Filter out zero values to prevent empty pie segments
  const chartData = hasValidData
    ? data.filter((item) => item.value > 0)
    : [{ name: "No Data", value: 1 }];

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#ECEFF4"];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
          <p className="font-medium">{`${
            payload[0].name
          }: ${payload[0].value.toLocaleString()} shares`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      {!hasValidData ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No vesting data available</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="text-center mt-2">
            <p className="text-2xl font-bold">{percent.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Vested</p>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Vested</p>
              <p className="font-medium">{vested.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Unvested</p>
              <p className="font-medium">{unvested.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
