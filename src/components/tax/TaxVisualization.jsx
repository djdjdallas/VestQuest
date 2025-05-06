import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sankey,
  Treemap,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export function TaxVisualization({ data, options = {} }) {
  const [activeView, setActiveView] = useState("breakdown");
  const [showAMT, setShowAMT] = useState(true);
  const [showStateTax, setShowStateTax] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Format numbers for display
  const formatCurrency = (value) => {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Transform data for visualization
  const taxBreakdownData = [
    { name: "Federal Income Tax", value: data?.federal?.federalTax || 0 },
    { name: "AMT", value: showAMT ? data?.amt?.netAMTDue || 0 : 0 },
    { name: "State Tax", value: showStateTax ? data?.state?.stateTax || 0 : 0 },
  ].filter((item) => item.value > 0);

  // Data for the flow visualization
  const sankeyData = {
    nodes: [
      { name: "Gross Proceeds" },
      { name: "Exercise Cost" },
      { name: "Federal Tax" },
      { name: "AMT" },
      { name: "State Tax" },
      { name: "Net Proceeds" },
    ],
    links: [
      { source: 0, target: 1, value: data?.exerciseCost || 0 },
      { source: 0, target: 2, value: data?.federal?.federalTax || 0 },
      { source: 0, target: 3, value: data?.amt?.netAMTDue || 0 },
      { source: 0, target: 4, value: data?.state?.stateTax || 0 },
      { source: 0, target: 5, value: data?.totals?.netProceeds || 0 },
    ].filter((link) => link.value > 0),
  };

  // Data for comparative scenario analysis
  const incomeTypeData = [
    { name: "Ordinary Income", value: data?.federal?.ordinaryIncome || 0 },
    { name: "Short-Term Gains", value: data?.federal?.shortTermGains || 0 },
    { name: "Long-Term Gains", value: data?.federal?.longTermGains || 0 },
  ].filter((item) => item.value > 0);

  // State tax breakdown if multi-state
  const stateBreakdownData =
    data?.state?.stateBreakdown?.map((item) => ({
      name: item.stateCode,
      value: item.stateTax,
    })) || [];

  // Handle no data case
  if (!data || !data.totals) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">
              No tax data available. Run a calculation to see tax visualization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label || payload[0].name}</p>
          <p className="text-primary">{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.percentage && (
            <p className="text-sm text-muted-foreground">
              {formatPercentage(payload[0].payload.percentage)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tax Impact Analysis</CardTitle>
        <CardDescription>
          Visualize the tax implications of your equity transaction
        </CardDescription>
        <div className="flex gap-2 pt-2">
          <Toggle
            pressed={showAMT}
            onPressedChange={setShowAMT}
            aria-label="Toggle AMT"
          >
            Show AMT
          </Toggle>
          <Toggle
            pressed={showStateTax}
            onPressedChange={setShowStateTax}
            aria-label="Toggle State Tax"
          >
            Show State Tax
          </Toggle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="breakdown"
          onValueChange={setActiveView}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
            <TabsTrigger value="incomeTypes">Income Types</TabsTrigger>
            {stateBreakdownData.length > 0 && (
              <TabsTrigger value="stateBreakdown">State Breakdown</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taxBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {taxBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tax</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.totals.totalTax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Effective Rate
                    </p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(data.totals.effectiveRate)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {taxBreakdownData.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>

                {data.amt && data.amt.amtCredit > 0 && (
                  <div className="mt-4 p-3 border rounded-md bg-muted/50">
                    <p className="text-sm font-medium">AMT Credit Generated</p>
                    <p className="font-bold">
                      {formatCurrency(data.amt.amtCredit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This credit can be used in future years to offset regular
                      tax.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="incomeTypes" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={incomeTypeData.map((item) => ({
                    ...item,
                    percentage: item.value / (data.totals.totalIncome || 1),
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Amount" fill="#0088FE">
                    {incomeTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Understanding Income Types</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1"
                    style={{ backgroundColor: COLORS[0] }}
                  />
                  <div>
                    <span className="font-medium">Ordinary Income:</span> Taxed
                    at your marginal tax rate.
                    {data.federal.ordinaryIncome > 0 && (
                      <span className="ml-1">
                        You have {formatCurrency(data.federal.ordinaryIncome)}{" "}
                        of ordinary income.
                      </span>
                    )}
                  </div>
                </li>
                <li className="flex gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1"
                    style={{ backgroundColor: COLORS[1] }}
                  />
                  <div>
                    <span className="font-medium">
                      Short-Term Capital Gains:
                    </span>{" "}
                    For holdings less than 1 year, taxed as ordinary income.
                    {data.federal.shortTermGains > 0 && (
                      <span className="ml-1">
                        You have {formatCurrency(data.federal.shortTermGains)}{" "}
                        of short-term gains.
                      </span>
                    )}
                  </div>
                </li>
                <li className="flex gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1"
                    style={{ backgroundColor: COLORS[2] }}
                  />
                  <div>
                    <span className="font-medium">
                      Long-Term Capital Gains:
                    </span>{" "}
                    For holdings over 1 year, taxed at lower rates (typically
                    15-20%).
                    {data.federal.longTermGains > 0 && (
                      <span className="ml-1">
                        You have {formatCurrency(data.federal.longTermGains)} of
                        long-term gains.
                      </span>
                    )}
                  </div>
                </li>
              </ul>
            </div>
          </TabsContent>

          {stateBreakdownData.length > 0 && (
            <TabsContent value="stateBreakdown" className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stateBreakdownData.map((item) => ({
                      ...item,
                      percentage: item.value / (data.state.stateTax || 1),
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <YAxis type="category" dataKey="name" width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="State Tax"
                      fill="#8884d8"
                      radius={[0, 4, 4, 0]}
                    >
                      {stateBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-muted/50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Multi-State Tax Allocation</h4>
                <p className="text-sm mb-3">
                  Your equity income is allocated across states based on your
                  residency and work location during the vesting period.
                </p>
                <div className="space-y-1">
                  {data.state.stateBreakdown.map((state, index) => (
                    <div key={index} className="grid grid-cols-3 text-sm">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span>{state.stateCode}</span>
                      </div>
                      <div>{formatPercentage(state.allocation)}</div>
                      <div className="text-right">
                        {formatCurrency(state.stateTax)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {showDetails && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-2">Tax Calculation Details</h4>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="text-muted-foreground">Total Income:</div>
                <div>{formatCurrency(data.totals.totalIncome || 0)}</div>

                <div className="text-muted-foreground">
                  Federal Ordinary Income:
                </div>
                <div>{formatCurrency(data.federal.ordinaryIncome || 0)}</div>

                <div className="text-muted-foreground">
                  Federal Capital Gains:
                </div>
                <div>
                  {formatCurrency(
                    (data.federal.shortTermGains || 0) +
                      (data.federal.longTermGains || 0)
                  )}
                </div>

                {data.amt && data.amt.amtIncome > 0 && (
                  <>
                    <div className="text-muted-foreground">AMT Income:</div>
                    <div>{formatCurrency(data.amt.amtIncome || 0)}</div>

                    <div className="text-muted-foreground">AMT Exemption:</div>
                    <div>{formatCurrency(data.amt.exemption || 0)}</div>
                  </>
                )}

                <div className="text-muted-foreground">Effective Tax Rate:</div>
                <div>{formatPercentage(data.totals.effectiveRate || 0)}</div>
              </div>

              {data.assumptions && (
                <div className="mt-4">
                  <p className="font-medium">Assumptions Used:</p>
                  <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                    {data.assumptions.federalRate && (
                      <li>
                        Federal Rate:{" "}
                        {formatPercentage(data.assumptions.federalRate)}
                      </li>
                    )}
                    {data.assumptions.stateRate && (
                      <li>
                        State Rate:{" "}
                        {formatPercentage(data.assumptions.stateRate)}
                      </li>
                    )}
                    {data.assumptions.capitalGainsRate && (
                      <li>
                        Capital Gains Rate:{" "}
                        {formatPercentage(data.assumptions.capitalGainsRate)}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm"
          >
            {showDetails ? "Hide Details" : "Show Calculation Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
