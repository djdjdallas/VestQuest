"use client";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

export function VestingProgressCard({
  vestedShares = 0,
  unvestedShares = 0,
  vestedPercent = 0,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: "Vested", value: vestedShares, color: "#0f56b3" },
    { name: "Unvested", value: unvestedShares, color: "#e2e8f0" },
  ];

  if (!mounted) {
    return null;
  }

  // If there are no shares, show a placeholder
  if (vestedShares === 0 && unvestedShares === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground text-center">
          No vesting data available. Add equity grants to see your vesting
          progress.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <Card className="p-2 shadow-lg border border-border bg-background">
                      <p className="font-medium">{payload[0].name}</p>
                      <p className="text-primary font-bold">
                        {payload[0].value.toLocaleString()} shares
                      </p>
                    </Card>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Vested</p>
          <p className="text-2xl font-bold">{vestedShares.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {vestedPercent.toFixed(1)}% of total
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Unvested</p>
          <p className="text-2xl font-bold">
            {unvestedShares.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {(100 - vestedPercent).toFixed(1)}% of total
          </p>
        </div>
      </div>
      <div className="mt-6 w-full">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">0%</span>
          <span className="text-muted-foreground">100%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${vestedPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
