import React, { useState, useEffect } from "react";
import { useGrants } from "@/hooks/useGrants";
import { calculateDetailedVesting } from "@/utils/enhanced-vesting-calculations";
import {
  calculateComprehensiveTax,
  compareScenarios,
} from "@/utils/enhanced-calculations";
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
} from "@/utils/formatters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
} from "lucide-react";

// Custom tooltip component for charts
const CustomTooltip = ({
  active,
  payload,
  label,
  valuePrefix,
  valueSuffix,
  formatter,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="font-medium text-sm">{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            className="text-xs"
            style={{ color: entry.color }}
          >
            {entry.name}: {valuePrefix || ""}
            {formatter ? formatter(entry.value) : entry.value}
            {valueSuffix || ""}
          </p>
        ))}
        {data.details && (
          <div className="mt-1 pt-1 border-t text-xs text-muted-foreground">
            {data.details}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Vesting Schedule Visualization
const VestingScheduleChart = ({ grant }) => {
  const [vestingData, setVestingData] = useState([]);

  useEffect(() => {
    if (!grant) return;

    // Calculate detailed vesting schedule
    const detailedVesting = calculateDetailedVesting(grant);

    // Transform vesting schedule into chart data
    const chartData = detailedVesting.vestingSchedule.map((event) => ({
      date: formatDate(event.date),
      shares: event.shares,
      value: event.shares * grant.current_fmv,
      unformattedDate: event.date,
      details: event.event,
    }));

    setVestingData(chartData);
  }, [grant]);

  if (!grant || vestingData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No vesting data available
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...vestingData].sort(
    (a, b) => new Date(a.unformattedDate) - new Date(b.unformattedDate)
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={Math.floor(sortedData.length / 5)}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            content={
              <CustomTooltip formatter={(value) => formatNumber(value)} />
            }
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="shares"
            name="Vested Shares"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.3}
            yAxisId="left"
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Value at Current FMV"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            yAxisId="right"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Exit Value Comparison Chart
const ExitValueComparisonChart = ({ grant }) => {
  const [comparisonData, setComparisonData] = useState([]);

  useEffect(() => {
    if (!grant) return;

    // Define exit scenarios
    const currentFMV = grant.current_fmv || 0;
    const scenarios = [
      { name: "Current", exitPrice: currentFMV, isLongTerm: true },
      { name: "Conservative", exitPrice: currentFMV * 2, isLongTerm: true },
      { name: "Moderate", exitPrice: currentFMV * 5, isLongTerm: true },
      { name: "Optimistic", exitPrice: currentFMV * 10, isLongTerm: true },
      { name: "Moonshot", exitPrice: currentFMV * 20, isLongTerm: true },
    ];

    // Calculate results for each scenario
    const results = compareScenarios(grant, scenarios, {
      federalRate: 0.35,
      stateRate: 0.1,
      filingStatus: "single",
      income: 150000,
    });

    setComparisonData(results);
  }, [grant]);

  if (!grant || comparisonData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No comparison data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip
            content={
              <CustomTooltip
                valuePrefix="$"
                formatter={(value) => formatNumber(value)}
              />
            }
          />
          <Legend />
          <Bar dataKey="netProceeds" name="Net Proceeds" fill="#4f46e5" />
          <Bar dataKey="totalTax" name="Tax" fill="#ef4444" />
          <Bar dataKey="exerciseCost" name="Exercise Cost" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Portfolio Allocation Chart
const PortfolioAllocationChart = ({ grants }) => {
  const [portfolioData, setPortfolioData] = useState([]);

  useEffect(() => {
    if (!grants || grants.length === 0) return;

    // Calculate total value for each grant
    const grantsWithValue = grants.map((grant) => {
      const vestedShares = calculateDetailedVesting(grant).vestedShares;
      const vestedValue = vestedShares * grant.current_fmv;
      const unvestedValue = (grant.shares - vestedShares) * grant.current_fmv;
      return {
        ...grant,
        vestedValue,
        unvestedValue,
        totalValue: grant.shares * grant.current_fmv,
      };
    });

    // Create data for pie chart
    const portfolioItems = grantsWithValue.map((grant) => ({
      name: `${grant.company_name} (${grant.grant_type})`,
      value: grant.totalValue,
      vestedValue: grant.vestedValue,
      unvestedValue: grant.unvestedValue,
      details: `${formatNumber(grant.shares)} shares at ${formatCurrency(
        grant.current_fmv
      )} FMV`,
    }));

    setPortfolioData(portfolioItems);
  }, [grants]);

  if (!grants || grants.length === 0 || portfolioData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No portfolio data available
      </div>
    );
  }

  const COLORS = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChartIcon>
          <Pie
            data={portfolioData}
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
            {portfolioData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <CustomTooltip formatter={(value) => formatCurrency(value)} />
            }
          />
        </PieChartIcon>
      </ResponsiveContainer>
    </div>
  );
};

// Upcoming Vesting Events Timeline
const UpcomingVestingTimeline = ({ grants }) => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    if (!grants || grants.length === 0) return;

    // Get all vesting events in the next 12 months
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    const allEvents = [];

    grants.forEach((grant) => {
      const detailedVesting = calculateDetailedVesting(grant);

      // Get all future vesting events
      let previousShares = 0;
      detailedVesting.vestingSchedule.forEach((event) => {
        const eventDate = new Date(event.date);

        if (eventDate > now && eventDate <= oneYearFromNow) {
          const newlyVestedShares = event.shares - previousShares;

          if (newlyVestedShares > 0) {
            allEvents.push({
              date: eventDate,
              company: grant.company_name,
              grantType: grant.grant_type,
              shares: newlyVestedShares,
              value: newlyVestedShares * grant.current_fmv,
              formattedDate: formatDate(eventDate),
            });
          }
        }

        previousShares = event.shares;
      });
    });

    // Sort events by date
    const sortedEvents = allEvents.sort((a, b) => a.date - b.date);

    // Group events by month for the chart
    const months = {};
    sortedEvents.forEach((event) => {
      const monthKey = `${event.date.getFullYear()}-${String(
        event.date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          displayMonth: new Date(
            event.date.getFullYear(),
            event.date.getMonth(),
            1
          ).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          value: 0,
          events: [],
        };
      }

      months[monthKey].value += event.value;
      months[monthKey].events.push(event);
    });

    const monthlyData = Object.values(months);

    setUpcomingEvents(monthlyData);
  }, [grants]);

  if (!grants || grants.length === 0 || upcomingEvents.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No upcoming vesting events
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={upcomingEvents}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="displayMonth" />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded-md shadow-sm">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Total value: {formatCurrency(data.value)}
                    </p>
                    <div className="space-y-1 text-xs max-h-32 overflow-auto">
                      {data.events.map((event, i) => (
                        <div key={i} className="py-1 border-t first:border-t-0">
                          <div className="font-medium">
                            {event.company} ({event.grantType})
                          </div>
                          <div className="text-muted-foreground">
                            {formatNumber(event.shares)} shares
                          </div>
                          <div className="text-muted-foreground">
                            {formatCurrency(event.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" name="Vesting Value" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Tax Impact Comparison
const TaxImpactChart = ({ grant }) => {
  const [taxData, setTaxData] = useState([]);

  useEffect(() => {
    if (!grant) return;

    // Compare tax impacts of different strategies
    const currentFMV = grant.current_fmv || 0;
    const exitValue = currentFMV * 5; // Moderate exit assumption

    const taxResults = [];

    if (grant.grant_type === "ISO") {
      // Compare qualifying vs disqualifying disposition
      const qualifyingResult = calculateComprehensiveTax(
        grant,
        grant.strike_price,
        exitValue,
        grant.shares,
        true, // long term
        { federalRate: 0.35, stateRate: 0.1 }
      );

      const disqualifyingResult = calculateComprehensiveTax(
        grant,
        grant.strike_price,
        exitValue,
        grant.shares,
        false, // short term
        { federalRate: 0.35, stateRate: 0.1 }
      );

      taxResults.push({
        name: "Qualifying (Long-Term)",
        totalTax: qualifyingResult.totals.totalTax,
        netProceeds: qualifyingResult.totals.netProceeds,
        details: "Hold for 1+ year after exercise, 2+ years after grant",
      });

      taxResults.push({
        name: "Disqualifying (Short-Term)",
        totalTax: disqualifyingResult.totals.totalTax,
        netProceeds: disqualifyingResult.totals.netProceeds,
        details: "Sell before qualifying holding period",
      });
    } else if (grant.grant_type === "NSO") {
      // Compare long-term vs short-term capital gains
      const longTermResult = calculateComprehensiveTax(
        grant,
        grant.strike_price,
        exitValue,
        grant.shares,
        true, // long term
        { federalRate: 0.35, stateRate: 0.1 }
      );

      const shortTermResult = calculateComprehensiveTax(
        grant,
        grant.strike_price,
        exitValue,
        grant.shares,
        false, // short term
        { federalRate: 0.35, stateRate: 0.1 }
      );

      taxResults.push({
        name: "Long-Term Capital Gains",
        totalTax: longTermResult.totals.totalTax,
        netProceeds: longTermResult.totals.netProceeds,
        details: "Hold for 1+ year after exercise",
      });

      taxResults.push({
        name: "Short-Term Capital Gains",
        totalTax: shortTermResult.totals.totalTax,
        netProceeds: shortTermResult.totals.netProceeds,
        details: "Sell within 1 year of exercise",
      });
    } else {
      // For RSUs - compare immediate sale vs long-term for appreciation
      const immediateSaleResult = calculateComprehensiveTax(
        grant,
        0, // No strike price for RSUs
        currentFMV,
        grant.shares,
        false, // short term
        { federalRate: 0.35, stateRate: 0.1 }
      );

      const longTermApprResult = calculateComprehensiveTax(
        grant,
        0, // No strike price for RSUs
        exitValue,
        grant.shares,
        true, // long term
        { federalRate: 0.35, stateRate: 0.1 }
      );

      taxResults.push({
        name: "Sell Immediately",
        totalTax: immediateSaleResult.totals.totalTax,
        netProceeds: immediateSaleResult.totals.netProceeds,
        details: "Sell as soon as RSUs vest",
      });

      taxResults.push({
        name: "Hold for Long-Term",
        totalTax: longTermApprResult.totals.totalTax,
        netProceeds: longTermApprResult.totals.netProceeds,
        details: "Hold for 1+ year after vesting",
      });
    }

    setTaxData(taxResults);
  }, [grant]);

  if (!grant || taxData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No tax comparison data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={taxData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis type="category" dataKey="name" width={150} />
          <Tooltip
            content={
              <CustomTooltip formatter={(value) => formatCurrency(value)} />
            }
          />
          <Legend />
          <Bar dataKey="netProceeds" name="Net Proceeds" fill="#4f46e5" />
          <Bar dataKey="totalTax" name="Total Tax" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main Component
export default function EquityVisualizations() {
  const { grants, loading, error } = useGrants();
  const [selectedGrantId, setSelectedGrantId] = useState("");
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [activeTab, setActiveTab] = useState("vesting");

  // Update selected grant when ID changes
  useEffect(() => {
    if (selectedGrantId && grants.length > 0) {
      const grant = grants.find((g) => g.id === selectedGrantId);
      setSelectedGrant(grant);
    } else if (grants.length > 0) {
      // Select first grant by default
      setSelectedGrantId(grants[0].id);
      setSelectedGrant(grants[0]);
    }
  }, [selectedGrantId, grants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your equity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading grants: {error}</p>
      </div>
    );
  }

  if (!grants || grants.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">No equity grants found.</p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/calculator")}
        >
          Add Your First Grant
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Equity Visualizations</h2>
          <p className="text-muted-foreground">
            Interactive visualizations of your equity grants
          </p>
        </div>

        <Select value={selectedGrantId} onValueChange={setSelectedGrantId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a grant" />
          </SelectTrigger>
          <SelectContent>
            {grants.map((grant) => (
              <SelectItem key={grant.id} value={grant.id}>
                {grant.company_name} - {grant.grant_type} (
                {formatNumber(grant.shares)} shares)
              </SelectItem>
            ))}
            <SelectItem value="all">All Grants (Portfolio View)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedGrant && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle>
              {selectedGrant.company_name} - {selectedGrant.grant_type} Grant
            </CardTitle>
            <CardDescription>
              {formatNumber(selectedGrant.shares)} shares at $
              {selectedGrant.strike_price.toFixed(2)} strike price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
                <TabsTrigger
                  value="vesting"
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Vesting Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="exits" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Exit Values</span>
                </TabsTrigger>
                <TabsTrigger value="tax" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Tax Impact</span>
                </TabsTrigger>
                <TabsTrigger
                  value="portfolio"
                  className="flex items-center gap-1"
                >
                  <PieChartIcon className="h-4 w-4" />
                  <span>Portfolio</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="vesting">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vesting Schedule</h3>
                    <VestingScheduleChart grant={selectedGrant} />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <Card className="bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Total Shares
                            </span>
                            <span className="text-xl font-bold">
                              {formatNumber(selectedGrant.shares)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Vested Shares
                            </span>
                            <span className="text-xl font-bold">
                              {formatNumber(
                                calculateDetailedVesting(selectedGrant)
                                  .vestedShares
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50">
                        <CardContent className="p-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Vested Value
                            </span>
                            <span className="text-xl font-bold">
                              {formatCurrency(
                                calculateDetailedVesting(selectedGrant)
                                  .vestedShares * selectedGrant.current_fmv
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-amber-50">
                        <CardContent className="p-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Next Vesting
                            </span>
                            <span className="text-xl font-bold">
                              {calculateDetailedVesting(selectedGrant)
                                .nextVestingDate
                                ? formatDate(
                                    calculateDetailedVesting(selectedGrant)
                                      .nextVestingDate
                                  )
                                : "None"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exits">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Exit Value Comparison
                    </h3>
                    <ExitValueComparisonChart grant={selectedGrant} />

                    <div className="p-4 bg-blue-50 rounded-md mt-6">
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span>Understanding Exit Values</span>
                      </h4>
                      <p className="text-sm text-blue-700">
                        This chart shows your potential proceeds under different
                        exit scenarios, after accounting for exercise costs and
                        taxes. The "Conservative" scenario assumes a 2x growth
                        from current FMV, while "Moonshot" represents a 20x
                        growth scenario.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tax">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Tax Impact Analysis
                    </h3>
                    <TaxImpactChart grant={selectedGrant} />

                    <div className="p-4 bg-amber-50 rounded-md mt-6">
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <span>Tax Strategy Insights</span>
                      </h4>
                      <p className="text-sm text-amber-700">
                        {selectedGrant.grant_type === "ISO"
                          ? "For ISOs, qualifying for long-term capital gains treatment can significantly reduce your tax burden. This requires holding for 1+ year after exercise and 2+ years after grant."
                          : selectedGrant.grant_type === "NSO"
                          ? "For NSOs, you'll pay ordinary income tax on the spread at exercise, but can still benefit from long-term capital gains treatment on any appreciation after exercise."
                          : "For RSUs, you'll pay ordinary income tax on the full value when they vest. Holding after vesting allows further appreciation to qualify for long-term capital gains."}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="portfolio">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Portfolio Allocation
                    </h3>
                    <PortfolioAllocationChart grants={grants} />

                    <div className="mt-6">
                      <h4 className="font-medium mb-3">
                        Upcoming Vesting Events
                      </h4>
                      <UpcomingVestingTimeline grants={grants} />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t flex justify-between">
            <div className="text-xs text-muted-foreground">
              Granted on {formatDate(selectedGrant.grant_date)} • Last updated{" "}
              {formatDate(selectedGrant.updated_at || selectedGrant.created_at)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/calculator")}
            >
              Update Grant
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
