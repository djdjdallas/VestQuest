"use client";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

export function VestingProgressCard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: "Vested", value: 5208, color: "#0f56b3" },
    { name: "Unvested", value: 7292, color: "#e2e8f0" },
  ];

  if (!mounted) {
    return null;
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
          <p className="text-2xl font-bold">5,208</p>
          <p className="text-xs text-muted-foreground">41.7% of total</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Unvested</p>
          <p className="text-2xl font-bold">7,292</p>
          <p className="text-xs text-muted-foreground">58.3% of total</p>
        </div>
      </div>
      <div className="mt-6 w-full">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Start Date</span>
          <span className="text-muted-foreground">End Date</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: "41.7%" }}
          ></div>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="font-medium">Jan 2022</span>
          <span className="font-medium">Jan 2026</span>
        </div>
      </div>
    </div>
  );
}
