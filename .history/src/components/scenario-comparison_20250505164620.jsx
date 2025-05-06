"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ScenarioComparison() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scenarios = [
    {
      name: "IPO at $50/share",
      grossValue: 625000,
      exerciseCost: 40000,
      taxCost: 146250,
      netValue: 438750,
      color: "#0f56b3",
    },
    {
      name: "Acquisition at $40/share",
      grossValue: 500000,
      exerciseCost: 40000,
      taxCost: 115000,
      netValue: 345000,
      color: "#06b6d4",
    },
    {
      name: "Secondary at $35/share",
      grossValue: 437500,
      exerciseCost: 40000,
      taxCost: 99375,
      netValue: 298125,
      color: "#6366f1",
    },
  ];

  const comparisonData = [
    {
      name: "Gross Value",
      "IPO at $50/share": 625000,
      "Acquisition at $40/share": 500000,
      "Secondary at $35/share": 437500,
    },
    {
      name: "Exercise Cost",
      "IPO at $50/share": 40000,
      "Acquisition at $40/share": 40000,
      "Secondary at $35/share": 40000,
    },
    {
      name: "Tax Cost",
      "IPO at $50/share": 146250,
      "Acquisition at $40/share": 115000,
      "Secondary at $35/share": 99375,
    },
    {
      name: "Net Value",
      "IPO at $50/share": 438750,
      "Acquisition at $40/share": 345000,
      "Secondary at $35/share": 298125,
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{scenario.name}</CardTitle>
              <CardDescription>12,500 shares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Gross Value</p>
                  <p className="text-2xl font-bold">
                    ${scenario.grossValue.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Exercise Cost
                    </p>
                    <p className="text-base font-medium">
                      -${scenario.exerciseCost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Cost</p>
                    <p className="text-base font-medium">
                      -${scenario.taxCost.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Net Value</p>
                  <p className="text-2xl font-bold">
                    ${scenario.netValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Comparison Chart</TabsTrigger>
          <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
        </TabsList>
        <TabsContent value="comparison" className="pt-4">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, ""]}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Card className="p-2 shadow-lg border border-border bg-background">
                          <p className="font-medium">{label}</p>
                          {payload.map((entry, index) => (
                            <div
                              key={`item-${index}`}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <p className="text-sm">
                                {entry.name}: ${entry.value.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="IPO at $50/share" fill="#0f56b3" />
                <Bar dataKey="Acquisition at $40/share" fill="#06b6d4" />
                <Bar dataKey="Secondary at $35/share" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        <TabsContent value="breakdown" className="pt-4">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {scenarios.map((scenario, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Federal Tax (22%)</span>
                        <span className="font-medium">
                          ${(scenario.grossValue * 0.22).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">State Tax (5%)</span>
                        <span className="font-medium">
                          ${(scenario.grossValue * 0.05).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Medicare (1.45%)</span>
                        <span className="font-medium">
                          ${(scenario.grossValue * 0.0145).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Total Tax</span>
                        <span className="font-medium">
                          ${scenario.taxCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Effective Rate</span>
                        <span className="font-medium">
                          {(
                            (scenario.taxCost / scenario.grossValue) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
