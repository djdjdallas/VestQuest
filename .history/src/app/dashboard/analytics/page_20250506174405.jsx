"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addMonths, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Share2,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import AuthLoading from "@/components/auth/AuthLoading";
import { calculateVestedShares } from "@/utils/calculations";

// Helper function to safely format currency
const formatCurrency = (value) => {
  // Check if value is a number and is not NaN, null, or undefined
  if (
    typeof value !== "number" ||
    isNaN(value) ||
    value === null ||
    value === undefined
  ) {
    return "$0";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to safely format percentages
const formatPercentage = (value) => {
  // Check if value is a number and is not NaN, null, or undefined
  if (
    typeof value !== "number" ||
    isNaN(value) ||
    value === null ||
    value === undefined
  ) {
    return "0%";
  }
  return `${value.toFixed(1)}%`;
};

// Helper function to safely get a value or return a default
const safeValue = (value, defaultValue = 0) => {
  return typeof value === "number" && !isNaN(value) ? value : defaultValue;
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalShares: 0,
    vestedShares: 0,
    unvestedShares: 0,
    currentValue: 0,
    exerciseCost: 0,
    potentialGain: 0,
    valueByGrantType: [],
    valueByCompany: [],
    vestingForecast: [],
    valueForecast: [],
    comparisonData: [],
  });
  const [timeframe, setTimeframe] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Data fetching
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch grants
        const { data: grantsData, error: grantsError } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("user_id", user.id);

        if (grantsError) throw grantsError;
        setGrants(grantsData || []);

        // Fetch scenarios
        const { data: scenariosData, error: scenariosError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("user_id", user.id);

        if (scenariosError) throw scenariosError;
        setScenarios(scenariosData || []);

        // Process data for analytics
        if (grantsData && grantsData.length > 0) {
          const analyticsData = processAnalyticsData(
            grantsData,
            scenariosData || []
          );
          setAnalytics(analyticsData);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err.message);
        toast.error("Failed to load analytics data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [supabase, timeframe, companyFilter]);

  // Process data for analytics
  const processAnalyticsData = (grants, scenarios) => {
    // Filter grants based on company if filter is set
    const filteredGrants =
      companyFilter !== "all"
        ? grants.filter((grant) => grant.company_name === companyFilter)
        : grants;

    // Calculate basic metrics
    let totalShares = 0;
    let vestedShares = 0;
    let unvestedShares = 0;
    let currentValue = 0;
    let exerciseCost = 0;

    // Create data structures for charts
    const valueByGrantType = {};
    const valueByCompany = {};
    const vestingForecast = [];
    const valueForecast = [];

    // Process each grant
    filteredGrants.forEach((grant) => {
      // Skip invalid grants
      if (!grant || typeof grant !== "object") return;

      const vested = calculateVestedShares(grant) || 0;
      const unvested = safeValue(grant.shares, 0) - vested;
      const vestValue = vested * safeValue(grant.current_fmv, 0);
      const exCost = vested * safeValue(grant.strike_price, 0);

      totalShares += safeValue(grant.shares, 0);
      vestedShares += vested;
      unvestedShares += unvested;
      currentValue += vestValue;
      exerciseCost += exCost;

      // Accumulate by grant type (safely)
      if (grant.grant_type) {
        valueByGrantType[grant.grant_type] =
          safeValue(valueByGrantType[grant.grant_type]) + vestValue;
      }

      // Accumulate by company (safely)
      if (grant.company_name) {
        valueByCompany[grant.company_name] =
          safeValue(valueByCompany[grant.company_name]) + vestValue;
      }

      // Generate vesting forecast
      generateVestingForecast(grant, vestingForecast, valueForecast);
    });

    // Convert to arrays for charts
    const valueByGrantTypeArray = Object.entries(valueByGrantType).map(
      ([type, value]) => ({
        name: type || "Unknown",
        value: safeValue(value),
      })
    );

    const valueByCompanyArray = Object.entries(valueByCompany).map(
      ([company, value]) => ({
        name: company || "Unknown",
        value: safeValue(value),
      })
    );

    // Sort and process forecasts
    const sortedVestingForecast = vestingForecast
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 12); // Limit to next 12 months

    const sortedValueForecast = valueForecast
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 12); // Limit to next 12 months

    // Process scenario comparisons
    const comparisonData = processScenarioComparisons(
      scenarios,
      filteredGrants
    );

    // Calculate potential gain (safely)
    const potentialGain = currentValue - exerciseCost;

    return {
      totalShares,
      vestedShares,
      unvestedShares,
      currentValue,
      exerciseCost,
      potentialGain,
      valueByGrantType: valueByGrantTypeArray,
      valueByCompany: valueByCompanyArray,
      vestingForecast: sortedVestingForecast,
      valueForecast: sortedValueForecast,
      comparisonData,
    };
  };

  // Generate vesting forecast for the next 24 months
  const generateVestingForecast = (grant, vestingForecast, valueForecast) => {
    // Skip invalid grants
    if (!grant || typeof grant !== "object") return;

    const today = new Date();

    // Validate dates
    if (!grant.vesting_end_date) return;

    const endDate = new Date(grant.vesting_end_date);

    // Don't process if vesting is already complete or invalid
    if (isNaN(endDate.getTime()) || today > endDate) return;

    // Determine vesting interval
    const schedule = grant.vesting_schedule || "monthly";
    let intervalMonths;

    switch (schedule) {
      case "monthly":
        intervalMonths = 1;
        break;
      case "quarterly":
        intervalMonths = 3;
        break;
      case "yearly":
        intervalMonths = 12;
        break;
      default:
        intervalMonths = 1;
    }

    // Create forecast entries for the next 24 months
    for (let i = 0; i < 24; i += intervalMonths) {
      const forecastDate = addMonths(today, i);

      // Don't go beyond vesting end date
      if (forecastDate > endDate) break;

      // Calculate vested shares at this date
      const vestedAtStart = calculateVestedShares(grant, today) || 0;
      const vestedAtForecast = calculateVestedShares(grant, forecastDate) || 0;
      const newlyVestedShares = Math.max(0, vestedAtForecast - vestedAtStart);

      if (newlyVestedShares <= 0) continue;

      const dateKey = format(forecastDate, "yyyy-MM");
      const formattedDate = format(forecastDate, "MMM yyyy");

      // Update vesting forecast
      const existingVestingEntry = vestingForecast.find(
        (entry) => entry.dateKey === dateKey
      );

      if (existingVestingEntry) {
        existingVestingEntry.value += newlyVestedShares;
        existingVestingEntry[grant.company_name] =
          safeValue(existingVestingEntry[grant.company_name]) +
          newlyVestedShares;
      } else {
        const entry = {
          dateKey,
          date: formattedDate,
          value: newlyVestedShares,
        };
        if (grant.company_name) {
          entry[grant.company_name] = newlyVestedShares;
        }
        vestingForecast.push(entry);
      }

      // Update value forecast
      const value = newlyVestedShares * safeValue(grant.current_fmv, 0);
      const existingValueEntry = valueForecast.find(
        (entry) => entry.dateKey === dateKey
      );

      if (existingValueEntry) {
        existingValueEntry.value += value;
        if (grant.company_name) {
          existingValueEntry[grant.company_name] =
            safeValue(existingValueEntry[grant.company_name]) + value;
        }
      } else {
        const entry = {
          dateKey,
          date: formattedDate,
          value,
        };
        if (grant.company_name) {
          entry[grant.company_name] = value;
        }
        valueForecast.push(entry);
      }
    }
  };

  // Process scenario comparisons
  const processScenarioComparisons = (scenarios, grants) => {
    if (!scenarios || scenarios.length === 0) return [];

    // Create comparison data
    return scenarios
      .map((scenario) => {
        // Skip invalid scenarios
        if (!scenario) return null;

        // Find related grant if any
        const relatedGrant = grants.find(
          (g) => g && g.id === scenario.grant_id
        );

        // Calculate potential values (safely)
        const exerciseCost = relatedGrant
          ? (safeValue(scenario.shares_included) ||
              safeValue(relatedGrant.shares, 0)) *
            safeValue(relatedGrant.strike_price, 0)
          : 0;

        const exitValue =
          safeValue(scenario.share_price, 0) *
          (safeValue(scenario.shares_included) ||
            (relatedGrant ? safeValue(relatedGrant.shares, 0) : 0));

        // Simplistic tax calculation - in a real app use your tax calculation logic
        const taxRate = 0.3;
        const taxes = Math.max(0, (exitValue - exerciseCost) * taxRate);

        const netValue = exitValue - exerciseCost - taxes;

        return {
          name: scenario.name || "Unnamed Scenario",
          exit_type: scenario.exit_type || "Unknown",
          exerciseCost,
          grossValue: exitValue,
          taxes,
          netValue,
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => safeValue(b.netValue) - safeValue(a.netValue)); // Sort by net value descending
  };

  // Export analytics data
  const handleExportData = () => {
    try {
      // Create analytics data object
      const exportData = {
        generated: new Date().toISOString(),
        metrics: {
          totalShares: analytics.totalShares,
          vestedShares: analytics.vestedShares,
          unvestedShares: analytics.unvestedShares,
          currentValue: analytics.currentValue,
          exerciseCost: analytics.exerciseCost,
          potentialGain: analytics.potentialGain,
        },
        valueByGrantType: analytics.valueByGrantType,
        valueByCompany: analytics.valueByCompany,
        vestingForecast: analytics.vestingForecast,
        scenarios: analytics.comparisonData,
      };

      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Create and download file
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vestquest-analytics-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Analytics data exported successfully");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export analytics data");
    }
  };

  // Chart colors
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  // Memoize company options for filter to prevent recalculation on re-renders
  const companyOptions = useMemo(() => {
    const options = [{ value: "all", label: "All Companies" }];

    // Build unique company options from grants
    const uniqueCompanies = new Map();
    grants.forEach((grant) => {
      if (
        grant &&
        grant.company_name &&
        !uniqueCompanies.has(grant.company_name)
      ) {
        uniqueCompanies.set(grant.company_name, {
          value: grant.company_name,
          label: grant.company_name,
        });
      }
    });

    return [...options, ...uniqueCompanies.values()];
  }, [grants]);

  // Custom tooltip formatter for charts
  const customTooltipFormatter = (value, name, props) => {
    if (name.includes("ROI") || name.includes("Percentage")) {
      return [`${safeValue(value).toFixed(1)}%`, name];
    }
    return [formatCurrency(value), name];
  };

  if (loading) {
    return <AuthLoading />;
  }

  if (error) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Analytics"
          text="Analyze your equity portfolio performance."
        >
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </DashboardHeader>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  if (grants.length === 0) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Analytics"
          text="Analyze your equity portfolio performance."
        >
          <Button asChild>
            <a href="/dashboard/grants/add">Add First Grant</a>
          </Button>
        </DashboardHeader>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-lg font-medium">
                No analytics data available
              </h3>
              <p className="text-muted-foreground">
                Add your first equity grant to start seeing analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  // Calculate ROI percentage safely for display
  const roiPercentage =
    analytics.exerciseCost > 0
      ? (analytics.potentialGain / analytics.exerciseCost) * 100
      : 0;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analytics"
        text="Detailed analysis of your equity portfolio."
      >
        <div className="flex items-center gap-2">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by Company" />
            </SelectTrigger>
            <SelectContent>
              {companyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Timeframe
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTimeframe("all")}>
                All Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("year")}>
                Past Year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("quarter")}>
                Past Quarter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("month")}>
                Past Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </DashboardHeader>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Portfolio Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.currentValue)}
            </div>
            <div className="mt-1 flex items-center text-sm text-muted-foreground">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                {formatPercentage(roiPercentage)}
              </span>
              <span className="ml-2">return on cost</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vested vs Unvested
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                {formatCurrency(
                  analytics.vestedShares *
                    (analytics.currentValue /
                      Math.max(analytics.vestedShares, 1))
                )}
              </div>
              <div className="ml-2 text-sm text-muted-foreground">
                of{" "}
                {formatCurrency(
                  analytics.totalShares *
                    (analytics.currentValue /
                      Math.max(analytics.vestedShares, 1))
                )}
              </div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{
                  width: `${
                    analytics.totalShares > 0
                      ? (analytics.vestedShares / analytics.totalShares) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>
                {analytics.totalShares > 0
                  ? formatPercentage(
                      (analytics.vestedShares / analytics.totalShares) * 100
                    )
                  : "0%"}{" "}
                Vested
              </span>
              <span>
                {analytics.totalShares > 0
                  ? formatPercentage(
                      (analytics.unvestedShares / analytics.totalShares) * 100
                    )
                  : "0%"}{" "}
                Unvested
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.potentialGain)}
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Exercise Cost</span>
              <span>{formatCurrency(analytics.exerciseCost)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="portfolio" className="mt-6 space-y-6">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="vesting">Vesting Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
        </TabsList>

        {/* Portfolio Analysis Tab */}
        <TabsContent value="portfolio">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Value by Grant Type</CardTitle>
                <CardDescription>
                  Distribution of your vested equity value by grant type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.valueByGrantType.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.valueByGrantType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.valueByGrantType.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(value),
                            "Value",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No data available for this view
                  </div>
                )}
                <div className="mt-4 space-y-1">
                  {analytics.valueByGrantType.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <div
                          className="h-3 w-3 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value by Company</CardTitle>
                <CardDescription>
                  Distribution of your vested equity value by company
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.valueByCompany.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.valueByCompany}
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
                          formatter={(value) => [
                            formatCurrency(value),
                            "Value",
                          ]}
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
                          {analytics.valueByCompany.map((entry, index) => (
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

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Portfolio Value Over Time</CardTitle>
                <CardDescription>
                  Historical and projected equity value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        {
                          date: "2023-01",
                          value: analytics.currentValue * 0.3,
                        },
                        {
                          date: "2023-04",
                          value: analytics.currentValue * 0.4,
                        },
                        {
                          date: "2023-07",
                          value: analytics.currentValue * 0.55,
                        },
                        {
                          date: "2023-10",
                          value: analytics.currentValue * 0.7,
                        },
                        {
                          date: "2024-01",
                          value: analytics.currentValue * 0.85,
                        },
                        { date: "2024-04", value: analytics.currentValue },
                        {
                          date: "2024-07",
                          value: analytics.currentValue * 1.1,
                          projected: true,
                        },
                        {
                          date: "2024-10",
                          value: analytics.currentValue * 1.25,
                          projected: true,
                        },
                        {
                          date: "2025-01",
                          value: analytics.currentValue * 1.4,
                          projected: true,
                        },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0088FE"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0088FE"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorProjected"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#82ca9d"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#82ca9d"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const [year, month] = value.split("-");
                          return `${
                            ["Jan", "Apr", "Jul", "Oct"][
                              parseInt(month) / 3 - 1
                            ]
                          } ${year.slice(2)}`;
                        }}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), "Value"]}
                        labelFormatter={(value) => {
                          const [year, month] = value.split("-");
                          return `${
                            ["January", "April", "July", "October"][
                              parseInt(month) / 3 - 1
                            ]
                          } ${year}`;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0088FE"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        activeDot={{ r: 8 }}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-center space-x-8">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
                    <span className="text-sm">Historical Value</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                    <span className="text-sm">Projected Value</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vesting Forecast Tab */}
        <TabsContent value="vesting">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Vesting</CardTitle>
                <CardDescription>
                  Shares vesting over the next 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.vestingForecast.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.vestingForecast}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={customTooltipFormatter} />
                        <Legend />
                        {/* Create a bar for each company */}
                        {grants
                          .filter((g) => g && g.company_name)
                          .map((grant) => grant.company_name)
                          .filter(
                            (company, index, self) =>
                              company && self.indexOf(company) === index
                          )
                          .map((company, index) => (
                            <Bar
                              key={company}
                              dataKey={company}
                              stackId="a"
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No upcoming vesting events found
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vesting Value Forecast</CardTitle>
                <CardDescription>
                  Estimated value of vesting equity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.valueForecast.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.valueForecast}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis
                          tickFormatter={(value) =>
                            `$${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(value),
                            "Value",
                          ]}
                        />
                        <Legend />
                        {/* Create a bar for each company */}
                        {grants
                          .filter((g) => g && g.company_name)
                          .map((grant) => grant.company_name)
                          .filter(
                            (company, index, self) =>
                              company && self.indexOf(company) === index
                          )
                          .map((company, index) => (
                            <Bar
                              key={company}
                              dataKey={company}
                              stackId="a"
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No vesting value forecast available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Cumulative Vesting Projection</CardTitle>
                <CardDescription>
                  Projected equity accumulation over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.vestingForecast.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { date: "Now", value: analytics.vestedShares },
                          ...analytics.vestingForecast.map((item, index) => ({
                            date: item.date,
                            value:
                              analytics.vestedShares +
                              analytics.vestingForecast
                                .slice(0, index + 1)
                                .reduce(
                                  (sum, i) => sum + safeValue(i.value),
                                  0
                                ),
                          })),
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            value.toLocaleString(),
                            "Vested Shares",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No vesting projection data available
                  </div>
                )}
                <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium mb-2">
                    Vesting Projection Insights
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your current grants, you'll vest approximately
                    <strong>
                      {" "}
                      {analytics.vestingForecast
                        .reduce((sum, item) => sum + safeValue(item.value), 0)
                        .toLocaleString()}{" "}
                    </strong>
                    additional shares over the next year, with an estimated
                    value of
                    <strong>
                      {" "}
                      {formatCurrency(
                        analytics.valueForecast.reduce(
                          (sum, item) => sum + safeValue(item.value),
                          0
                        )
                      )}{" "}
                    </strong>
                    at current share prices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scenario Comparison Tab */}
        <TabsContent value="scenarios">
          {analytics.comparisonData && analytics.comparisonData.length > 0 ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Net Value Comparison</CardTitle>
                  <CardDescription>
                    Comparing potential value across different exit scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.comparisonData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) =>
                            `$${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip
                          formatter={(value) => [formatCurrency(value), ""]}
                        />
                        <Legend />
                        <Bar
                          dataKey="netValue"
                          name="Net Value"
                          fill="#8884d8"
                        />
                        <Bar dataKey="taxes" name="Taxes" fill="#FF8042" />
                        <Bar
                          dataKey="exerciseCost"
                          name="Exercise Cost"
                          fill="#FFBB28"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Return on Investment</CardTitle>
                    <CardDescription>
                      Comparing ROI across scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.comparisonData.map((scenario) => ({
                            name: scenario.name,
                            roi:
                              scenario.exerciseCost > 0
                                ? (scenario.netValue / scenario.exerciseCost) *
                                  100
                                : 0,
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            tickFormatter={(value) => `${value.toFixed(0)}%`}
                          />
                          <Tooltip
                            formatter={(value) => [
                              `${safeValue(value).toFixed(1)}%`,
                              "ROI",
                            ]}
                          />
                          <Bar
                            dataKey="roi"
                            name="Return on Investment"
                            fill="#82ca9d"
                            label={{
                              position: "top",
                              formatter: (value) =>
                                `${safeValue(value).toFixed(0)}%`,
                            }}
                          >
                            {analytics.comparisonData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Details</CardTitle>
                    <CardDescription>
                      Comparative analysis of exit scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.comparisonData.map((scenario, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                                style={{
                                  backgroundColor: `${
                                    COLORS[index % COLORS.length]
                                  }20`,
                                }}
                              >
                                {scenario.exit_type === "IPO" ? (
                                  <LineChart
                                    className="h-4 w-4"
                                    style={{
                                      color: COLORS[index % COLORS.length],
                                    }}
                                  />
                                ) : scenario.exit_type === "Acquisition" ? (
                                  <Share2
                                    className="h-4 w-4"
                                    style={{
                                      color: COLORS[index % COLORS.length],
                                    }}
                                  />
                                ) : (
                                  <BarChart3
                                    className="h-4 w-4"
                                    style={{
                                      color: COLORS[index % COLORS.length],
                                    }}
                                  />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{scenario.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {scenario.exit_type}
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold">
                              {formatCurrency(scenario.netValue)}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Exercise Cost
                              </p>
                              <p>{formatCurrency(scenario.exerciseCost)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Gross Value
                              </p>
                              <p>{formatCurrency(scenario.grossValue)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Tax Estimate
                              </p>
                              <p>{formatCurrency(scenario.taxes)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tax Efficiency Analysis</CardTitle>
                  <CardDescription>
                    Tax impact across scenarios as a percentage of gross value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.comparisonData.map((scenario) => ({
                            name: scenario.name,
                            value:
                              scenario.grossValue > 0
                                ? scenario.taxes / scenario.grossValue
                                : 0,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(1)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.comparisonData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${(value * 100).toFixed(1)}%`,
                            "Tax Rate",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {analytics.comparisonData.length > 0 && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                      <h4 className="font-medium mb-2">
                        Tax Optimization Opportunities
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Based on the analysis, consider optimizing your exit
                        strategy for scenarios with lower tax rates. The
                        <strong> {analytics.comparisonData[0].name} </strong>
                        scenario appears to be the most tax-efficient option
                        with a potential net value of
                        <strong>
                          {" "}
                          {formatCurrency(analytics.comparisonData[0].netValue)}
                        </strong>
                        .
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
                  <PieChartIcon className="h-16 w-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium">
                    No scenarios available
                  </h3>
                  <p className="text-muted-foreground">
                    Create scenarios to compare different exit strategies and
                    optimize your equity decisions.
                  </p>
                  <Button asChild>
                    <a href="/dashboard/scenarios/add">Create First Scenario</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
