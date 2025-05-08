"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InfoIcon,
  DownloadIcon,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#8dd1e1",
];
import { AIScenarioInsights } from "@/components/scenario/ai-scenario-insights";

export function EnhancedScenarioComparison({ scenarios = [] }) {
  const [comparisonMetric, setComparisonMetric] = useState("net_proceeds");
  const [chartType, setChartType] = useState("bar");
  const [includeDetails, setIncludeDetails] = useState(false);

  // Filter out scenarios with missing data
  const validScenarios = scenarios.filter(
    (scenario) => scenario && scenario.scenario_name && scenario.exit_value
  );

  if (validScenarios.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            No valid scenarios to compare. Create at least one scenario with
            complete data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const chartData = validScenarios.map((scenario) => ({
    name: scenario.scenario_name || "Unnamed",
    "Gross Proceeds": scenario.gross_proceeds || 0,
    "Exercise Cost": scenario.exercise_cost || 0,
    "Tax Liability": scenario.tax_liability || 0,
    "Net Proceeds": scenario.net_proceeds || 0,
    ROI: scenario.roi_percentage || 0,
    "Exit Value": scenario.exit_value || 0,
    scenarioId: scenario.id,
  }));

  // Prepare data for percentage breakdown chart
  const breakdownData = validScenarios.map((scenario) => {
    const total = scenario.gross_proceeds || 0;
    const exercisePct = total
      ? ((scenario.exercise_cost || 0) / total) * 100
      : 0;
    const taxPct = total ? ((scenario.tax_liability || 0) / total) * 100 : 0;
    const netPct = total ? ((scenario.net_proceeds || 0) / total) * 100 : 0;

    return {
      name: scenario.scenario_name || "Unnamed",
      "Exercise Cost": exercisePct,
      "Tax Liability": taxPct,
      "Net Proceeds": netPct,
      total: total,
    };
  });

  // Prepare data for pie chart (for a selected scenario)
  const selectedScenario = validScenarios[0];
  const pieData = [
    { name: "Exercise Cost", value: selectedScenario.exercise_cost || 0 },
    { name: "Tax Liability", value: selectedScenario.tax_liability || 0 },
    { name: "Net Proceeds", value: selectedScenario.net_proceeds || 0 },
  ];

  // Custom tooltip formatter
  const tooltipFormatter = (value, name) => {
    if (name === "ROI") return [`${value.toFixed(1)}%`, name];
    return [`$${value.toLocaleString()}`, name];
  };

  // For percentage breakdown chart
  const percentageFormatter = (value) => `${value.toFixed(1)}%`;

  // Helper function to calculate and format cost basis per share
  const getCostBasisPerShare = (scenario) => {
    if (!scenario.shares_exercised || scenario.shares_exercised === 0)
      return "$0.00";
    const costBasis = scenario.exercise_cost / scenario.shares_exercised;
    return `$${costBasis.toFixed(2)}`;
  };

  // Calculate metrics for scenario comparison table
  const getScenarioMetrics = (scenario) => {
    const costBasis = scenario.shares_exercised
      ? scenario.exercise_cost / scenario.shares_exercised
      : 0;

    const effectiveTaxRate = scenario.gross_proceeds
      ? (scenario.tax_liability / scenario.gross_proceeds) * 100
      : 0;

    const netValuePerShare = scenario.shares_exercised
      ? scenario.net_proceeds / scenario.shares_exercised
      : 0;

    return {
      costBasis,
      effectiveTaxRate,
      netValuePerShare,
    };
  };

  // Prepare time-based comparison data (simulation of future value)
  const timelineData = [];
  const years = 5;

  for (let year = 0; year <= years; year++) {
    const yearData = { year: `Year ${year}` };

    validScenarios.forEach((scenario) => {
      // Simple compounding growth estimate - this would be replaced with more sophisticated models
      const growthRate = 1.15; // 15% annual growth
      const baseValue = scenario.exit_value || 0;
      const projectedValue = baseValue * Math.pow(growthRate, year);

      yearData[scenario.scenario_name] = projectedValue;
    });

    timelineData.push(yearData);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scenario Comparison</CardTitle>
            <CardDescription>
              Compare your exit scenarios to make better decisions
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select
              value={comparisonMetric}
              onValueChange={setComparisonMetric}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="net_proceeds">Net Proceeds</SelectItem>
                <SelectItem value="gross_proceeds">Gross Proceeds</SelectItem>
                <SelectItem value="tax_liability">Tax Impact</SelectItem>
                <SelectItem value="roi_percentage">ROI</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md p-0.5">
              <Button
                variant={chartType === "bar" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType("bar")}
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "pie" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType("pie")}
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "line" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType("line")}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comparison">Value Comparison</TabsTrigger>
            <TabsTrigger value="breakdown">Percentage Breakdown</TabsTrigger>
            <TabsTrigger value="timeline">Time Projection</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="aiInsights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="pt-4">
            <div className="h-[400px]">
              {chartType === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                      width={80}
                    />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    {comparisonMetric === "net_proceeds" && (
                      <Bar
                        dataKey="Net Proceeds"
                        fill="#22c55e"
                        name="Net Proceeds"
                      />
                    )}
                    {comparisonMetric === "gross_proceeds" && (
                      <Bar
                        dataKey="Gross Proceeds"
                        fill="#3b82f6"
                        name="Gross Proceeds"
                      />
                    )}
                    {comparisonMetric === "tax_liability" && (
                      <Bar
                        dataKey="Tax Liability"
                        fill="#ef4444"
                        name="Tax Liability"
                      />
                    )}
                    {comparisonMetric === "roi_percentage" && (
                      <Bar dataKey="ROI" fill="#8884d8" name="ROI (%)" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "pie" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value, percent }) =>
                        `${name}: $${value.toLocaleString()} (${(
                          percent * 100
                        ).toFixed(0)}%)`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === "line" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                      width={80}
                    />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Bar dataKey="Net Proceeds" fill="#22c55e" />
                    <Bar dataKey="Tax Liability" fill="#ef4444" />
                    <Bar dataKey="Exercise Cost" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <InfoIcon className="h-4 w-4" />
                <p>
                  This visualization compares the value outcomes of different
                  exit scenarios. Adjust the metric selector to focus on
                  different aspects of each scenario.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="pt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdownData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 70 }}
                  layout="vertical"
                  stackOffset="expand"
                  barGap={0}
                  barCategoryGap={30}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={percentageFormatter}
                    domain={[0, 100]}
                  />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip formatter={percentageFormatter} />
                  <Legend />
                  <Bar dataKey="Net Proceeds" stackId="a" fill="#22c55e" />
                  <Bar dataKey="Tax Liability" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Exercise Cost" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <InfoIcon className="h-4 w-4" />
                <p>
                  This shows the percentage breakdown of your gross proceeds,
                  helping you understand how much goes to exercise costs, taxes,
                  and net proceeds.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="pt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timelineData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    width={80}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  {validScenarios.map((scenario, index) => (
                    <Line
                      key={scenario.id || index}
                      type="monotone"
                      dataKey={scenario.scenario_name}
                      stroke={COLORS[index % COLORS.length]}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <InfoIcon className="h-4 w-4" />
                <p>
                  Estimated future value projection based on 15% annual growth.
                  This illustrates how different scenarios might perform over
                  time.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Scenario</th>
                    <th className="text-right py-2 px-3">
                      <div className="flex items-center justify-end gap-1">
                        Exit Value
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-48">
                                Price per share at exit time
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    <th className="text-right py-2 px-3">
                      <div className="flex items-center justify-end gap-1">
                        Cost Basis
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-48">
                                Your cost per share including exercise price
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    <th className="text-right py-2 px-3">
                      <div className="flex items-center justify-end gap-1">
                        Tax Rate
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-48">
                                Effective tax rate as a percentage of gross
                                proceeds
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    <th className="text-right py-2 px-3">
                      <div className="flex items-center justify-end gap-1">
                        Net Value/Share
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-48">
                                Net value per share after costs and taxes
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    <th className="text-right py-2 px-3">
                      <div className="flex items-center justify-end gap-1">
                        ROI
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-48">
                                Return on investment percentage
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validScenarios.map((scenario, index) => {
                    const metrics = getScenarioMetrics(scenario);
                    return (
                      <tr
                        key={scenario.id || index}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-3 font-medium">
                          {scenario.scenario_name}
                        </td>
                        <td className="text-right py-3 px-3">
                          ${(scenario.exit_value || 0).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-3">
                          ${metrics.costBasis.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-3">
                          {metrics.effectiveTaxRate.toFixed(1)}%
                        </td>
                        <td className="text-right py-3 px-3">
                          ${metrics.netValuePerShare.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-3">
                          {(scenario.roi_percentage || 0).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="aiInsights" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Personalized Scenario Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered insights based on your financial situation and these
                scenarios
              </p>

              <AIScenarioInsights
                scenarios={scenarios}
                financialData={userFinancialData}
                companyData={companyData}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {validScenarios.length} scenario
          {validScenarios.length !== 1 ? "s" : ""} compared
        </div>
        <Button variant="outline" size="sm">
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export Comparison
        </Button>
      </CardFooter>
    </Card>
  );
}
