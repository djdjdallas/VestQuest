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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { InfoIcon, Eye, EyeOff, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#fd7f6f",
  "#7eb0d5",
  "#b2e061",
  "#bd7ebe",
];

export function TaxVisualization({ data, comparisons = [], options = {} }) {
  const [activeView, setActiveView] = useState("breakdown");
  const [showAMT, setShowAMT] = useState(true);
  const [showStateTax, setShowStateTax] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showComparisonLegend, setShowComparisonLegend] = useState(true);
  const [exitValueMultiplier, setExitValueMultiplier] = useState(5);
  const [comparisonType, setComparisonType] = useState("exit_values");
  const [expandedSection, setExpandedSection] = useState(null);

  // Format numbers for display
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "$0";
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null) return "0%";
    return `${(value * 100).toFixed(1)}%`;
  };

  // Transform data for visualization
  const taxBreakdownData = [
    { name: "Federal Income Tax", value: data?.federal?.federalTax || 0, color: COLORS[0] },
    { name: "AMT", value: showAMT ? data?.amt?.netAMTDue || 0 : 0, color: COLORS[1] },
    { name: "State Tax", value: showStateTax ? data?.state?.stateTax || 0 : 0, color: COLORS[2] },
    { name: "NIIT", value: data?.federal?.niitTax || 0, color: COLORS[3] },
  ].filter((item) => item.value > 0);

  // Data for income type breakdown
  const incomeTypeData = [
    { name: "Ordinary Income", value: data?.federal?.ordinaryIncome || 0, color: COLORS[0] },
    { name: "Short-Term Gains", value: data?.federal?.shortTermGains || 0, color: COLORS[1] },
    { name: "Long-Term Gains", value: data?.federal?.longTermGains || 0, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  // State tax breakdown if multi-state
  const stateBreakdownData =
    data?.state?.stateBreakdown?.map((item, index) => ({
      name: item.stateCode,
      value: item.stateTax,
      color: COLORS[index % COLORS.length],
    })) || [];

  // Generate comparison data for exit values
  const generateExitValueComparison = () => {
    if (!data) return [];
    
    const basePrice = data.currentFMV || 1;
    const exitValues = [
      basePrice * 0.5, // Downside
      basePrice,       // Current
      basePrice * 2,   // Conservative
      basePrice * 5,   // Moderate
      basePrice * 10,  // Optimistic
      basePrice * 20,  // Home run
    ];
    
    return exitValues.map(value => ({
      exitValue: value,
      label: value === basePrice * 0.5 ? "Downside" :
             value === basePrice ? "Current" :
             value === basePrice * 2 ? "Conservative" :
             value === basePrice * 5 ? "Moderate" :
             value === basePrice * 10 ? "Optimistic" : "Home Run",
      grossValue: value * (data.sharesToExercise || 1),
      exerciseCost: (data.exerciseCost || 0),
      tax: (data.totals?.totalTax / data.totals?.totalIncome || 0) * value * (data.sharesToExercise || 1),
      netValue: value * (data.sharesToExercise || 1) - (data.exerciseCost || 0) - 
                ((data.totals?.totalTax / data.totals?.totalIncome || 0) * value * (data.sharesToExercise || 1))
    }));
  };

  // Generate comparison data for holding periods
  const generateHoldingPeriodComparison = () => {
    if (!data) return [];
    
    // Define holding periods: immediate, 6 months, 1 year, 2 years
    const holdingPeriods = [
      { months: 0, label: "Immediate" },
      { months: 6, label: "6 Months" },
      { months: 12, label: "1 Year" },
      { months: 24, label: "2 Years" },
    ];
    
    return holdingPeriods.map(period => {
      const isLongTerm = period.months >= 12;
      const taxRate = isLongTerm 
        ? (data.assumptions?.capitalGainsRate || 0.15) 
        : (data.assumptions?.federalRate || 0.32);
      const stateRate = data.assumptions?.stateRate || 0.1;
      
      // Calculate spread at exercise (for ISOs and NSOs)
      const spread = data.federal?.ordinaryIncome || 0;
      
      // Calculate AMT if applicable (mainly for ISOs held less than 12 months)
      const amtImpact = period.months < 12 && data.grant_type === "ISO" 
        ? data.amt?.netAMTDue || 0 
        : 0;
      
      // Calculate appreciation based on exit price
      const appreciation = data.federal?.longTermGains + data.federal?.shortTermGains || 0;
      
      // Calculate federal tax based on holding period
      const federalTax = spread * (data.assumptions?.federalRate || 0.32) + 
                         appreciation * taxRate;
      
      // Calculate state tax
      const stateTax = (spread + appreciation) * stateRate;
      
      // Calculate total tax
      const totalTax = federalTax + stateTax + amtImpact;
      
      return {
        holdingPeriod: period.label,
        months: period.months,
        isLongTerm,
        grossValue: (data.totals?.totalIncome || 0),
        exerciseCost: (data.exerciseCost || 0),
        federalTax,
        stateTax,
        amtImpact,
        totalTax,
        effectiveRate: (data.totals?.totalIncome || 0) > 0 
          ? totalTax / (data.totals?.totalIncome || 1) 
          : 0,
        netValue: (data.totals?.totalIncome || 0) - (data.exerciseCost || 0) - totalTax,
      };
    });
  };

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

  // Comparison data
  const exitValueComparison = generateExitValueComparison();
  const holdingPeriodComparison = generateHoldingPeriodComparison();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.dataKey.includes("Rate") || entry.name.includes("Rate") 
                ? formatPercentage(entry.value) 
                : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Section header
  const SectionHeader = ({ title, section, children }) => (
    <div 
      className="flex items-center justify-between py-2 cursor-pointer"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-base font-medium">{title}</h3>
        {children}
      </div>
      {expandedSection === section ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );

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
            className="data-[state=on]:bg-primary/20"
          >
            Show AMT
          </Toggle>
          <Toggle
            pressed={showStateTax}
            onPressedChange={setShowStateTax}
            aria-label="Toggle State Tax"
            className="data-[state=on]:bg-primary/20"
          >
            Show State Tax
          </Toggle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          defaultValue="breakdown"
          onValueChange={setActiveView}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
            <TabsTrigger value="incomeTypes">Income Types</TabsTrigger>
            <TabsTrigger value="comparison">Scenarios</TabsTrigger>
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
                          fill={entry.color || COLORS[index % COLORS.length]}
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
                            backgroundColor: item.color || COLORS[index % COLORS.length],
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

            {/* Waterfall chart showing from gross to net */}
            <div className="border-t pt-4 mt-4">
              <SectionHeader 
                title="From Gross to Net" 
                section="waterfall"
              >
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="w-80">
                      <p className="text-sm">
                        This chart shows how taxes and costs reduce your gross proceeds to arrive at net proceeds.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </SectionHeader>

              {expandedSection === "waterfall" && (
                <div className="h-72 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Gross Value", value: data.totals?.totalIncome || 0, fill: "#10b981" },
                        { name: "Exercise Cost", value: -(data.exerciseCost || 0), fill: "#f97316" },
                        { name: "Federal Tax", value: -(data.federal?.federalTax || 0), fill: "#ef4444" },
                        { name: "AMT", value: -(data.amt?.netAMTDue || 0), fill: "#ec4899" },
                        { name: "State Tax", value: -(data.state?.stateTax || 0), fill: "#8b5cf6" },
                        { name: "Net Value", value: data.totals?.netProceeds || 0, fill: "#3b82f6" },
                      ]}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={value => formatCurrency(value)} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip
                        formatter={(value) => [formatCurrency(Math.abs(value)), ""]}
                        labelFormatter={(value) => value}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {[
                          { name: "Gross Value", value: data.totals?.totalIncome || 0, fill: "#10b981" },
                          { name: "Exercise Cost", value: -(data.exerciseCost || 0), fill: "#f97316" },
                          { name: "Federal Tax", value: -(data.federal?.federalTax || 0), fill: "#ef4444" },
                          { name: "AMT", value: -(data.amt?.netAMTDue || 0), fill: "#ec4899" },
                          { name: "State Tax", value: -(data.state?.stateTax || 0), fill: "#8b5cf6" },
                          { name: "Net Value", value: data.totals?.netProceeds || 0, fill: "#3b82f6" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                        fill={entry.color || COLORS[index % COLORS.length]}
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
                    style={{ backgroundColor: incomeTypeData[0]?.color || COLORS[0] }}
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
                    style={{ backgroundColor: incomeTypeData[1]?.color || COLORS[1] }}
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
                    style={{ backgroundColor: incomeTypeData[2]?.color || COLORS[2] }}
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

            {/* Grant Type Specific Tax Impacts */}
            <div className="border-t pt-4 mt-4">
              <SectionHeader 
                title={`${data.grant_type || "Equity"} Tax Considerations`} 
                section="grantTypeSpecific"
              />

              {expandedSection === "grantTypeSpecific" && (
                <div className="p-4 bg-muted/30 rounded-md mt-4 text-sm space-y-4">
                  {data.grant_type === "ISO" && (
                    <>
                      <div className="space-y-1">
                        <h4 className="font-medium">ISO Tax Treatment</h4>
                        <p className="text-muted-foreground">
                          ISOs provide potential tax advantages, but require careful planning. No ordinary income tax at exercise, 
                          but the spread (FMV - strike price) is included in AMT calculations.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="text-muted-foreground">AMT Income:</div>
                        <div>{formatCurrency(data.amt?.amtIncome || 0)}</div>
                        
                        <div className="text-muted-foreground">AMT Liability:</div>
                        <div>{formatCurrency(data.amt?.netAMTDue || 0)}</div>
                        
                        <div className="text-muted-foreground">AMT Credit Generated:</div>
                        <div>{formatCurrency(data.amt?.amtCredit || 0)}</div>
                      </div>
                      
                      <div className="pt-2 text-xs text-muted-foreground">
                        <strong>Qualifying Disposition:</strong> For preferential tax treatment, 
                        you must hold for at least 1 year after exercise AND 2 years after grant date.
                      </div>
                    </>
                  )}
                  
                  {data.grant_type === "NSO" && (
                    <>
                      <div className="space-y-1">
                        <h4 className="font-medium">NSO Tax Treatment</h4>
                        <p className="text-muted-foreground">
                          NSOs are simpler from a tax perspective but generate ordinary income at exercise. 
                          The spread (FMV - strike price) is treated as compensation income, with taxes withheld at exercise.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="text-muted-foreground">Ordinary Income at Exercise:</div>
                        <div>{formatCurrency(data.federal?.ordinaryIncome || 0)}</div>
                        
                        <div className="text-muted-foreground">Federal Tax on Spread:</div>
                        <div>{formatCurrency(data.federal?.ordinaryTax || 0)}</div>
                        
                        <div className="text-muted-foreground">Capital Gains on Appreciation:</div>
                        <div>{formatCurrency(data.federal?.longTermGains + data.federal?.shortTermGains || 0)}</div>
                      </div>
                    </>
                  )}
                  
                  {data.grant_type === "RSU" && (
                    <>
                      <div className="space-y-1">
                        <h4 className="font-medium">RSU Tax Treatment</h4>
                        <p className="text-muted-foreground">
                          RSUs are taxed as ordinary income at vesting based on the fair market value. 
                          Taxes are typically withheld by your company at vesting.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="text-muted-foreground">Income at Vesting:</div>
                        <div>{formatCurrency(data.federal?.ordinaryIncome || 0)}</div>
                        
                        <div className="text-muted-foreground">Federal Tax on Vesting:</div>
                        <div>{formatCurrency(data.federal?.ordinaryTax || 0)}</div>
                        
                        <div className="text-muted-foreground">Capital Gains on Appreciation:</div>
                        <div>{formatCurrency(data.federal?.longTermGains + data.federal?.shortTermGains || 0)}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-medium">Scenario Comparison</h3>
                    <p className="text-xs text-muted-foreground">
                      Compare tax implications across different scenarios
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant={comparisonType === "exit_values" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setComparisonType("exit_values")}
                    >
                      Exit Values
                    </Button>
                    <Button 
                      variant={comparisonType === "holding_periods" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setComparisonType("holding_periods")}
                    >
                      Holding Periods
                    </Button>
                  </div>
                </div>
                
                {comparisonType === "exit_values" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={exitValueComparison}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          label={{ value: 'Exit Scenario', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Legend />
                        <Tooltip formatter={(value) => [formatCurrency(value), ""]} />
                        <Bar yAxisId="left" dataKey="grossValue" name="Gross Value" fill="#10b981" />
                        <Bar yAxisId="left" dataKey="exerciseCost" name="Exercise Cost" fill="#f97316" stackId="costs" />
                        <Bar yAxisId="left" dataKey="tax" name="Tax" fill="#ef4444" stackId="costs" />
                        <Bar yAxisId="right" dataKey="netValue" name="Net Value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {comparisonType === "holding_periods" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={holdingPeriodComparison}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="holdingPeriod" 
                          label={{ value: 'Holding Period', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Legend />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === "Effective Rate") return [formatPercentage(value), name];
                            return [formatCurrency(value), name];
                          }} 
                        />
                        <Bar yAxisId="left" dataKey="federalTax" name="Federal Tax" stackId="a" fill="#ef4444" />
                        <Bar yAxisId="left" dataKey="stateTax" name="State Tax" stackId="a" fill="#8b5cf6" />
                        <Bar yAxisId="left" dataKey="amtImpact" name="AMT" stackId="a" fill="#ec4899" />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="effectiveRate" 
                          name="Effective Rate" 
                          stroke="#0ea5e9" 
                          strokeWidth={2}
                          dot={{ r: 6 }}
                        />
                        <ReferenceLine yAxisId="left" y={0} stroke="#000" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
                
              <div className="space-y-4">
                {comparisonType === "exit_values" && (
                  <div className="bg-muted/50 p-4 rounded-md">
                    <h4 className="font-medium mb-3">Exit Value Insights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="pb-2">
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Best ROI:</div>
                          <div className="font-medium">
                            {exitValueComparison
                              .slice()
                              .sort((a, b) => (b.netValue / b.exerciseCost) - (a.netValue / a.exerciseCost))[0]?.label}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Best Net Value:</div>
                          <div className="font-medium">
                            {exitValueComparison
                              .slice()
                              .sort((a, b) => b.netValue - a.netValue)[0]?.label}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Lowest Tax %:</div>
                          <div className="font-medium">
                            {exitValueComparison
                              .slice()
                              .sort((a, b) => (a.tax / a.grossValue) - (b.tax / b.grossValue))[0]?.label}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          {data.grant_type === "ISO" 
                            ? "ISOs can create AMT tax burden at higher values, but may qualify for preferential capital gains rates if held long enough." 
                            : data.grant_type === "NSO"
                            ? "NSOs are taxed as ordinary income on the spread at exercise, with subsequent appreciation taxed as capital gains."
                            : "RSUs are taxed as ordinary income at vesting, with subsequent appreciation taxed as capital gains."}
                        </p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                          {data.grant_type === "ISO" ? "ISO Tax Planning" : data.grant_type === "NSO" ? "NSO Tax Management" : "RSU Tax Strategy"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {comparisonType === "holding_periods" && (
                  <div className="bg-muted/50 p-4 rounded-md">
                    <h4 className="font-medium mb-3">Holding Period Insights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="pb-2">
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Lowest Tax Rate:</div>
                          <div className="font-medium">
                            {holdingPeriodComparison
                              .slice()
                              .sort((a, b) => a.effectiveRate - b.effectiveRate)[0]?.holdingPeriod}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Net Benefit of Long-Term:</div>
                          <div className="font-medium">
                            {formatCurrency(
                              holdingPeriodComparison.find(p => p.isLongTerm)?.netValue -
                              holdingPeriodComparison.find(p => p.months === 0)?.netValue || 0
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Tax Savings:</div>
                          <div className="font-medium">
                            {formatCurrency(
                              holdingPeriodComparison.find(p => p.months === 0)?.totalTax -
                              holdingPeriodComparison.find(p => p.isLongTerm)?.totalTax || 0
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          {data.grant_type === "ISO" 
                            ? "For ISOs, holding for at least 1 year after exercise AND 2 years after grant date qualifies for long-term capital gains rates." 
                            : "Holding for at least 1 year after acquiring shares qualifies for lower long-term capital gains rates."}
                        </p>
                        {holdingPeriodComparison.find(p => p.isLongTerm)?.totalTax < 
                         holdingPeriodComparison.find(p => p.months === 0)?.totalTax && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                            Long-term holding recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                          fill={entry.color || COLORS[index % COLORS.length]}
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

        {/* Common tax implications section */}
        <div className="border-t pt-4 mt-2">
          <SectionHeader 
            title="Tax Implications" 
            section="taxImplications"
          >
            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
              {data.grant_type || "Equity"}
            </Badge>
          </SectionHeader>

          {expandedSection === "taxImplications" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
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
                  <p className="font-medium text-sm">Assumptions Used:</p>
                  <ul className="list-disc pl-5 mt-1 text-xs text-muted-foreground">
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
          )}
        </div>

        <Button
          variant="link"
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm"
        >
          {showDetails ? "Hide Details" : "Show Calculation Details"}
        </Button>

        {showDetails && (
          <div className="text-xs text-muted-foreground italic">
            Note: Tax calculations are estimates based on the provided inputs. 
            This is not tax advice. Consult with a tax professional for guidance 
            specific to your situation.
          </div>
        )}
      </CardContent>
    </Card>
  );
}