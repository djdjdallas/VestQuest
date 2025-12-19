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
  Line,
  LineChart,
  ComposedChart,
  Area,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Info, Zap, Download } from "lucide-react";
import {
  calculateDetailedVesting,
  calculateCombinedVestingSchedule,
  getUpcomingVestingEvents,
} from "@/utils/enhanced-vesting-calculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { format, addMonths, parseISO } from "date-fns";
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
} from "@/utils/formatters";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveAs } from "file-saver";
import AuthLoading from "@/components/auth/AuthLoading";

export function VestingTimeline() {
  const [mounted, setMounted] = useState(false);
  const [grants, setGrants] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [cumulativeData, setCumulativeData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [timeframe, setTimeframe] = useState("1year");
  const [view, setView] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch grants and calculate vesting data
  useEffect(() => {
    const fetchVestingData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch all grants
        const { data: grantsData, error: grantsError } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("user_id", user.id);

        if (grantsError) throw grantsError;

        // Process and enhance grants data
        const enhancedGrants = grantsData.map((grant) => {
          const detailedVesting = calculateDetailedVesting(grant);
          return {
            ...grant,
            detailedVesting,
          };
        });

        setGrants(enhancedGrants || []);

        // Process vesting data for charts based on current timeframe
        processVestingDataForCharts(enhancedGrants);

        // Calculate upcoming vesting events
        const upcoming = [];
        enhancedGrants.forEach((grant) => {
          const events = getUpcomingVestingEvents(grant, 6); // Look ahead 6 months
          upcoming.push(
            ...events.map((event) => ({
              ...event,
              company: grant.company_name,
              grant_type: grant.grant_type,
              fmv: grant.current_fmv,
            }))
          );
        });

        // Sort upcoming events by date
        upcoming.sort((a, b) => a.date - b.date);
        setUpcomingEvents(upcoming);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVestingData();
    setMounted(true);
  }, [supabase]);

  // Process vesting data when timeframe or view changes
  useEffect(() => {
    if (grants.length > 0) {
      processVestingDataForCharts(grants);
    }
  }, [timeframe, view, grants]);

  // Process and prepare vesting data for charts
  const processVestingDataForCharts = (grantsData) => {
    if (!grantsData || grantsData.length === 0) return;

    // Determine months to look ahead based on timeframe
    let monthsAhead;
    switch (timeframe) {
      case "6months":
        monthsAhead = 6;
        break;
      case "1year":
        monthsAhead = 12;
        break;
      case "2years":
        monthsAhead = 24;
        break;
      case "4years":
        monthsAhead = 48;
        break;
      default:
        monthsAhead = 12;
    }

    // Get combined vesting schedule
    const combinedSchedule = calculateCombinedVestingSchedule(
      grantsData,
      new Date(),
      monthsAhead
    );

    // Transform data for charts based on view (monthly or quarterly)
    const transformedData = [];
    const cumulativeChartData = [];

    if (view === "quarterly") {
      // Group monthly data into quarters
      const quarterMap = new Map();

      combinedSchedule.forEach((monthData) => {
        const date = monthData.date;
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${quarter}`;

        if (quarterMap.has(quarterKey)) {
          const existing = quarterMap.get(quarterKey);
          existing.shares += monthData.shares;
          existing.value += monthData.value;

          // Combine details for companies
          monthData.details.forEach((detail) => {
            const existingCompanyIndex = existing.details.findIndex(
              (d) =>
                d.company === detail.company && d.grantType === detail.grantType
            );

            if (existingCompanyIndex >= 0) {
              existing.details[existingCompanyIndex].shares += detail.shares;
              existing.details[existingCompanyIndex].value += detail.value;
            } else {
              existing.details.push(detail);
            }
          });
        } else {
          quarterMap.set(quarterKey, {
            month: quarterKey,
            date: new Date(year, (quarter - 1) * 3, 1),
            shares: monthData.shares,
            value: monthData.value,
            details: [...monthData.details],
          });
        }
      });

      // Convert map to array and sort by date
      const quarterlyData = Array.from(quarterMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // Calculate cumulative totals
      let cumulativeShares = 0;
      let cumulativeValue = 0;

      quarterlyData.forEach((quarter) => {
        cumulativeShares += quarter.shares;
        cumulativeValue += quarter.value;

        transformedData.push({
          label: quarter.month,
          ...quarter,
          formattedValue: formatCurrency(quarter.value),
        });

        cumulativeChartData.push({
          label: quarter.month,
          date: quarter.date,
          totalShares: cumulativeShares,
          totalValue: cumulativeValue,
          formattedValue: formatCurrency(cumulativeValue),
        });
      });
    } else {
      // Monthly view (default)
      let cumulativeShares = 0;
      let cumulativeValue = 0;

      combinedSchedule.forEach((monthData) => {
        cumulativeShares += monthData.shares;
        cumulativeValue += monthData.value;

        transformedData.push({
          label: format(monthData.date, "MMM yyyy"),
          ...monthData,
          formattedValue: formatCurrency(monthData.value),
        });

        cumulativeChartData.push({
          label: format(monthData.date, "MMM yyyy"),
          date: monthData.date,
          totalShares: cumulativeShares,
          totalValue: cumulativeValue,
          formattedValue: formatCurrency(cumulativeValue),
        });
      });
    }

    setChartData(transformedData);
    setCumulativeData(cumulativeChartData);
  };

  // Get color for a specific company/grant type
  const getColor = (index) => {
    const colors = [
      "#0f56b3", // primary blue
      "#06b6d4", // cyan
      "#6366f1", // indigo
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
      "#ef4444", // red
    ];
    return colors[index % colors.length];
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Handle view change (monthly/quarterly)
  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Export vesting data as CSV
  const handleExportData = () => {
    if (!chartData || chartData.length === 0) return;

    // Create CSV content
    let csvContent =
      "Date,Shares Vesting,Value,Cumulative Shares,Cumulative Value\n";

    chartData.forEach((data, index) => {
      const cumulativeData = cumulativeData[index] || {
        totalShares: 0,
        totalValue: 0,
      };
      csvContent += `${format(data.date, "yyyy-MM-dd")},${data.shares},${
        data.value
      },${cumulativeData.totalShares},${cumulativeData.totalValue}\n`;
    });

    // Export as file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `vesting-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return <AuthLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500">Error loading vesting data: {error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (grants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No equity grants found. Add your first grant to see your vesting
          timeline.
        </p>
        <Button className="mt-4" asChild>
          <a href="/dashboard/grants/add">Add Your First Grant</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={timeframe === "6months" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeframeChange("6months")}
          >
            6 Months
          </Button>
          <Button
            variant={timeframe === "1year" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeframeChange("1year")}
          >
            1 Year
          </Button>
          <Button
            variant={timeframe === "2years" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeframeChange("2years")}
          >
            2 Years
          </Button>
          <Button
            variant={timeframe === "4years" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeframeChange("4years")}
          >
            4 Years
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden">
            <Button
              variant={view === "monthly" ? "default" : "outline"}
              size="sm"
              className="rounded-r-none"
              onClick={() => handleViewChange("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={view === "quarterly" ? "default" : "outline"}
              size="sm"
              className="rounded-l-none"
              onClick={() => handleViewChange("quarterly")}
            >
              Quarterly
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="vesting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vesting">Vesting by Period</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Vesting</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
        </TabsList>

        {/* Vesting by Period Tab */}
        <TabsContent value="vesting" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Vesting Schedule</h3>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        This chart shows the number of shares vesting in each{" "}
                        {view === "monthly" ? "month" : "quarter"} across all
                        your equity grants.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => formatNumber(value)}
                      label={{
                        value: "Shares",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatCurrency(value)}
                      label={{
                        value: "Value ($)",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-3 shadow-lg border border-border bg-background">
                              <p className="font-medium">{label}</p>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm">
                                  Vesting:{" "}
                                  <span className="font-semibold">
                                    {formatNumber(payload[0].value)} shares
                                  </span>
                                </p>
                                <p className="text-sm">
                                  Value:{" "}
                                  <span className="font-semibold">
                                    {formatCurrency(payload[0].payload.value)}
                                  </span>
                                </p>

                                <div className="mt-3 pt-2 border-t border-border">
                                  <p className="text-xs font-medium">
                                    Company Breakdown:
                                  </p>
                                  {payload[0].payload.details.map(
                                    (detail, i) => (
                                      <div
                                        key={i}
                                        className="flex justify-between text-xs mt-1"
                                      >
                                        <span>
                                          {detail.company} ({detail.grantType}):
                                        </span>
                                        <span className="font-medium">
                                          {formatNumber(detail.shares)} shares
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="shares"
                      yAxisId="left"
                      fill="#0f56b3"
                      name="Shares Vesting"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 text-sm text-center text-muted-foreground">
                <p>
                  Showing {view === "monthly" ? "monthly" : "quarterly"} vesting
                  over the next{" "}
                  {timeframe === "6months"
                    ? "6 months"
                    : timeframe === "1year"
                    ? "year"
                    : timeframe === "2years"
                    ? "2 years"
                    : "4 years"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cumulative Vesting Tab */}
        <TabsContent value="cumulative" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Cumulative Vesting</h3>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        This chart shows your cumulative vested shares and their
                        total value over time.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={cumulativeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => formatNumber(value)}
                      label={{
                        value: "Cumulative Shares",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatCurrency(value)}
                      label={{
                        value: "Cumulative Value ($)",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-3 shadow-lg border border-border bg-background">
                              <p className="font-medium">{label}</p>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm">
                                  Cumulative Shares:{" "}
                                  <span className="font-semibold">
                                    {formatNumber(payload[0].value)}
                                  </span>
                                </p>
                                <p className="text-sm">
                                  Cumulative Value:{" "}
                                  <span className="font-semibold">
                                    {formatCurrency(payload[1].value)}
                                  </span>
                                </p>
                              </div>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalShares"
                      yAxisId="left"
                      stroke="#0f56b3"
                      fill="#0f56b330"
                      name="Cumulative Shares"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalValue"
                      yAxisId="right"
                      stroke="#10b981"
                      name="Cumulative Value"
                      dot={false}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 text-sm text-center text-muted-foreground">
                <p>
                  Projected vesting growth over the next{" "}
                  {timeframe === "6months"
                    ? "6 months"
                    : timeframe === "1year"
                    ? "year"
                    : timeframe === "2years"
                    ? "2 years"
                    : "4 years"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Breakdown Tab */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Vesting by Grant</h3>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        This chart shows vesting broken down by individual
                        grants.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-3 shadow-lg border border-border bg-background">
                              <p className="font-medium">{label}</p>
                              <div className="mt-2 space-y-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <p className="text-sm">
                                      {entry.name}:{" "}
                                      <span className="font-semibold">
                                        {formatNumber(entry.value)} shares
                                      </span>
                                    </p>
                                  </div>
                                ))}
                                <p className="text-sm mt-2">
                                  Total Value:{" "}
                                  <span className="font-semibold">
                                    {formatCurrency(payload[0].payload.value)}
                                  </span>
                                </p>
                              </div>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {chartData.length > 0 &&
                      chartData[0].details &&
                      chartData[0].details.map((detail, index) => {
                        const key = `${detail.company}-${detail.grantType}`;
                        return (
                          <Bar
                            key={key}
                            dataKey={`details[${index}].shares`}
                            stackId="a"
                            fill={getColor(index)}
                            name={`${detail.company} (${detail.grantType})`}
                          />
                        );
                      })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upcoming Vesting Events */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Upcoming Vesting Events</h3>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>These are your vesting events in the next 6 months.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.company} {event.grant_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatNumber(event.shares)} shares
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(event.shares * event.fmv)}
                    </p>
                  </div>
                </div>
              ))}

              {upcomingEvents.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    View All ({upcomingEvents.length}) Events
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No upcoming vesting events in the next 6 months.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educational Component */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 mt-1">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                Understanding Your Vesting Timeline
              </h3>
              <p className="text-muted-foreground mb-4">
                Your vesting timeline shows when your equity will vest over
                time. This helps you plan for potential liquidity events and tax
                implications.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">
                    Vesting Schedule Types
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Most equity vests over a 4-year period, often with a 1-year
                    cliff. After the cliff, remaining shares typically vest
                    monthly, quarterly, or annually.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Tax Planning</h4>
                  <p className="text-xs text-muted-foreground">
                    Different equity types have different tax implications. RSUs
                    are taxed at vesting, while options are taxed when exercised
                    (NSOs) or when sold (ISOs).
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="/education/vesting-explained">
                    Learn More About Vesting
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
