"use client";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

export function EquityOverviewChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { month: "Jan", value: 52000 },
    { month: "Feb", value: 58000 },
    { month: "Mar", value: 61000 },
    { month: "Apr", value: 75000 },
    { month: "May", value: 85000 },
    { month: "Jun", value: 92000 },
    { month: "Jul", value: 105000 },
    { month: "Aug", value: 120000 },
    { month: "Sep", value: 135000 },
    { month: "Oct", value: 145000 },
    { month: "Nov", value: 152000 },
    { month: "Dec", value: 156240 },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0f56b3" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0f56b3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2 shadow-lg border border-border bg-background">
                  <p className="font-medium">{label}</p>
                  <p className="text-primary font-bold">
                    ${payload[0].value.toLocaleString()}
                  </p>
                </Card>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#0f56b3"
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
