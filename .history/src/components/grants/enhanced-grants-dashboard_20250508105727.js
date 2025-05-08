import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calculator,
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  AlignLeft,
  Clock,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Pencil,
  Trash,
  Edit,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip as UITooltip,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/utils/formatters";
import { useEducationLevel } from "@/context/EducationContext";
import { PersonalizedAdvisor } from "../advisor/PersonalizedAdvisor";
// Enhanced vesting calculation function
function calculateDetailedVesting(grant, asOfDate = new Date()) {
  if (!grant)
    return {
      vestedShares: 0,
      unvestedShares: 0,
      vestedPercentage: 0,
      nextVestingDate: null,
      nextVestingShares: 0,
    };

  const now = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = grant.vesting_cliff_date
    ? new Date(grant.vesting_cliff_date)
    : null;
  const totalShares = grant.shares || 0;

  // Initialize result
  const result = {
    totalShares,
    vestedShares: 0,
    unvestedShares: totalShares,
    vestedPercentage: 0,
    isCliffPassed: cliffDate ? now >= cliffDate : true,
    isFullyVested: now >= vestingEnd,
    nextVestingDate: null,
    nextVestingShares: 0,
    timeUntilNextVesting: null,
  };

  // If fully vested
  if (now >= vestingEnd) {
    result.vestedShares = totalShares;
    result.unvestedShares = 0;
    result.vestedPercentage = 100;
    return result;
  }

  // If cliff exists and we're before cliff date
  if (cliffDate && now < cliffDate) {
    result.nextVestingDate = cliffDate;
    result.nextVestingShares = Math.floor(totalShares * 0.25); // Typical 1-year cliff
    result.timeUntilNextVesting = Math.ceil(
      (cliffDate - now) / (1000 * 60 * 60 * 24)
    );
    return result;
  }

  // Calculate vesting based on schedule
  const vestingSchedule = grant.vesting_schedule || "monthly";
  let vestedShares = 0;

  // Calculate total vesting period and elapsed time
  const totalVestingDays = (vestingEnd - vestingStart) / (1000 * 60 * 60 * 24);
  const elapsedDays = Math.min(
    totalVestingDays,
    (now - vestingStart) / (1000 * 60 * 60 * 24)
  );

  // Standard vesting with cliff
  if (cliffDate && now >= cliffDate) {
    // Calculate cliff amount (typically 25% for 1-year cliff)
    const cliffPercentage = 0.25;
    const cliffShares = Math.floor(totalShares * cliffPercentage);

    // Calculate additional vesting after cliff
    const daysAfterCliff = (now - cliffDate) / (1000 * 60 * 60 * 24);
    const remainingShares = totalShares - cliffShares;
    const remainingDays = (vestingEnd - cliffDate) / (1000 * 60 * 60 * 24);

    const additionalVested = Math.floor(
      (daysAfterCliff / remainingDays) * remainingShares
    );
    vestedShares = Math.min(cliffShares + additionalVested, totalShares);
  } else {
    // Simple linear vesting
    vestedShares = Math.floor((elapsedDays / totalVestingDays) * totalShares);
  }

  // RSUs that require liquidity event
  if (grant.grant_type === "RSU" && grant.liquidity_event_only) {
    vestedShares = 0;
  }

  // Calculate next vesting date and amount
  // This is simplified - a real implementation would calculate precise next vesting date
  // based on monthly/quarterly/yearly schedule
  let nextDate = new Date(now);
  let nextShares = 0;

  if (vestedShares < totalShares) {
    if (vestingSchedule === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
      const monthlyAmount = totalShares / 48; // Typical 48-month vesting
      nextShares = Math.floor(monthlyAmount);
    } else if (vestingSchedule === "quarterly") {
      nextDate.setMonth(nextDate.getMonth() + 3);
      const quarterlyAmount = totalShares / 16; // Typical 16-quarter vesting
      nextShares = Math.floor(quarterlyAmount);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 12);
      const yearlyAmount = totalShares / 4; // Typical 4-year vesting
      nextShares = Math.floor(yearlyAmount);
    }

    // If next date is beyond vesting end, use vesting end
    if (nextDate > vestingEnd) {
      nextDate = vestingEnd;
      nextShares = totalShares - vestedShares;
    }
  } else {
    nextDate = null;
  }

  // Update result
  result.vestedShares = vestedShares;
  result.unvestedShares = totalShares - vestedShares;
  result.vestedPercentage = (vestedShares / totalShares) * 100;
  result.nextVestingDate = nextDate;
  result.nextVestingShares = nextShares;
  result.timeUntilNextVesting = nextDate
    ? Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24))
    : null;

  return result;
}

// Color constants
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A259FF"];

// Format date helper
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString(undefined, options);
};

// Get grant type colors
const getGrantTypeColor = (type) => {
  switch (type) {
    case "ISO":
      return "bg-blue-100 text-blue-800";
    case "NSO":
      return "bg-purple-100 text-purple-800";
    case "RSU":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const EnhancedGrantsDashboard = ({
  grants = [],
  onAddGrant,
  onViewGrant,
  onEditGrant,
  onDeleteGrant,
}) => {
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [projectedData, setProjectedData] = useState([]);
  const { educationLevel, markConceptViewed } = useEducationLevel();
  const userFinancialData = {}; // Placeholder for user financial data

  // Calculate total value and vesting stats
  const totalShares = grants.reduce((sum, grant) => sum + grant.shares, 0);
  const vestedStats = grants.reduce(
    (stats, grant) => {
      const vesting = calculateDetailedVesting(grant);
      stats.vestedShares += vesting.vestedShares;
      stats.vestedValue += vesting.vestedShares * grant.current_fmv;
      return stats;
    },
    { vestedShares: 0, vestedValue: 0 }
  );

  const vestedPercent =
    totalShares > 0 ? (vestedStats.vestedShares / totalShares) * 100 : 0;

  // Group grants by company
  const grantsByCompany = grants.reduce((groups, grant) => {
    const company = grant.company_name;
    if (!groups[company]) {
      groups[company] = {
        companyName: company,
        totalShares: 0,
        vestedShares: 0,
        value: 0,
        grants: [],
      };
    }

    const vesting = calculateDetailedVesting(grant);
    groups[company].grants.push(grant);
    groups[company].totalShares += grant.shares;
    groups[company].vestedShares += vesting.vestedShares;
    groups[company].value += vesting.vestedShares * grant.current_fmv;

    return groups;
  }, {});

  // Extract upcoming vesting events
  const upcomingVestingEvents = grants
    .flatMap((grant) => {
      const vesting = calculateDetailedVesting(grant);
      if (vesting.nextVestingDate) {
        return [
          {
            grantId: grant.id,
            companyName: grant.company_name,
            date: vesting.nextVestingDate,
            shares: vesting.nextVestingShares,
            value: vesting.nextVestingShares * grant.current_fmv,
            daysUntil: vesting.timeUntilNextVesting,
            grantType: grant.grant_type,
          },
        ];
      }
      return [];
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Generate projected vesting data
  useEffect(() => {
    if (grants.length === 0) return;

    // Create monthly data points for the next 36 months
    const startDate = new Date();
    const data = [];

    for (let i = 0; i <= 36; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      let totalVestedShares = 0;
      let totalVestedValue = 0;

      // Calculate vested shares for each grant at this date
      grants.forEach((grant) => {
        const vesting = calculateDetailedVesting(grant, date);
        totalVestedShares += vesting.vestedShares;
        totalVestedValue += vesting.vestedShares * grant.current_fmv;
      });

      data.push({
        month: monthKey,
        date,
        vestedShares: totalVestedShares,
        unvestedShares: totalShares - totalVestedShares,
        value: totalVestedValue,
      });
    }

    setProjectedData(data);
  }, [grants, totalShares]);

  // Educational content based on level
  useEffect(() => {
    if (activeTab === "overview") {
      markConceptViewed("tax_implications");
    }
  }, [activeTab, markConceptViewed]);

  // Modify this function to not call markConceptViewed directly during render
  const getTaxImplicationHelp = () => {
    // Don't call markConceptViewed here - we handled it in the useEffect above

    switch (educationLevel) {
      case "beginner":
        return "Each equity type has different tax implications. ISOs may trigger AMT, NSOs are taxed at exercise, and RSUs are taxed when they vest.";
      case "intermediate":
        return "ISOs can qualify for favorable tax treatment, but may trigger AMT. NSOs are taxed as ordinary income at exercise. RSUs are taxed as ordinary income at vesting.";
      case "advanced":
        return "ISOs can be subject to AMT on the spread at exercise, with potential for LTCG on sale if holding periods are met. NSOs create ordinary income at exercise equal to the spread. RSUs create ordinary income at vesting based on FMV.";
      default:
        return "Each equity type has different tax implications.";
    }
  };

  // Render the empty state
  if (grants.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-6 pb-8 flex flex-col items-center justify-center text-center space-y-6">
          <div className="rounded-full bg-primary/10 p-3">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium">No equity grants yet</h3>
            <p className="text-muted-foreground">
              Add your first equity grant to start tracking your vesting
              progress and value.
            </p>
          </div>
          <Button onClick={onAddGrant}>Add Your First Grant</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Total Grants
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of equity grants across all companies</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grants.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(grantsByCompany).length}{" "}
              {Object.keys(grantsByCompany).length === 1
                ? "company"
                : "companies"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Total Shares
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of shares across all your grants</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalShares)}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={vestedPercent} className="h-2" />
              <span className="text-xs text-muted-foreground">
                {formatPercentage(vestedPercent)} vested
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Vested Value
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Current value of your vested shares based on latest FMV
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(vestedStats.vestedValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(vestedStats.vestedShares)} vested shares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Next Vesting
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your next upcoming vesting event</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingVestingEvents.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {formatDate(upcomingVestingEvents[0].date)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(upcomingVestingEvents[0].shares)} shares (
                  {formatCurrency(upcomingVestingEvents[0].value)})
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">None</div>
                <p className="text-xs text-muted-foreground">
                  All shares fully vested
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        defaultValue="overview"
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grants">Grants</TabsTrigger>
          <TabsTrigger value="vesting">Vesting Timeline</TabsTrigger>
          <TabsTrigger value="companies">By Company</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-7">
            {/* Equity Breakdown Chart */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Equity Breakdown</CardTitle>
                <CardDescription>
                  Distribution of your equity by grant type
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.values(
                        grants.reduce((acc, grant) => {
                          if (!acc[grant.grant_type]) {
                            acc[grant.grant_type] = {
                              name: grant.grant_type,
                              value: 0,
                              shares: 0,
                            };
                          }
                          acc[grant.grant_type].value +=
                            grant.shares * grant.current_fmv;
                          acc[grant.grant_type].shares += grant.shares;
                          return acc;
                        }, {})
                      )}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {Object.keys(
                        grants.reduce((acc, grant) => {
                          acc[grant.grant_type] = true;
                          return acc;
                        }, {})
                      ).map((type, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <div className="w-full">
                  <h4 className="font-medium mb-2">Tax Implications</h4>
                  <p>{getTaxImplicationHelp()}</p>
                </div>
              </CardFooter>
            </Card>

            {/* Vesting Progress */}
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Vesting Progress</CardTitle>
                <CardDescription>Your equity vesting over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={projectedData
                      .filter(
                        (d, i) =>
                          i % 3 === 0 ||
                          i === 0 ||
                          i === projectedData.length - 1
                      )
                      .slice(0, 13)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(tick) => {
                        const parts = tick.split("-");
                        const date = new Date(
                          parseInt(parts[0]),
                          parseInt(parts[1]) - 1
                        );
                        return `${date.toLocaleString("default", {
                          month: "short",
                        })} ${date.getFullYear()}`;
                      }}
                    />
                    <YAxis
                      tickFormatter={(tick) => `${(tick / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "value") return formatCurrency(value);
                        return formatNumber(value);
                      }}
                      labelFormatter={(label) => {
                        const parts = label.split("-");
                        const date = new Date(
                          parseInt(parts[0]),
                          parseInt(parts[1]) - 1
                        );
                        return date.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        });
                      }}
                    />
                    <Legend />
                    <Bar
                      name="Vested Value"
                      dataKey="value"
                      fill="#0088FE"
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab("vesting")}
                >
                  View Detailed Vesting Schedule
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Upcoming Vesting Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Vesting Events</CardTitle>
              <CardDescription>
                Your scheduled vesting events in the next 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingVestingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingVestingEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium">{event.companyName}</h4>
                            <Badge
                              className={cn(
                                "ml-2 text-xs",
                                getGrantTypeColor(event.grantType)
                              )}
                            >
                              {event.grantType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)} ({event.daysUntil} days)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatNumber(event.shares)} shares
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(event.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No upcoming vesting events in the next 6 months
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.values(grantsByCompany).map((company) => (
              <Card key={company.companyName}>
                <CardHeader>
                  <CardTitle>{company.companyName}</CardTitle>
                  <CardDescription>
                    {company.grants.length}{" "}
                    {company.grants.length === 1 ? "grant" : "grants"} •
                    {formatNumber(company.totalShares)} shares
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Vesting Progress
                        </span>
                        <span>
                          {formatPercentage(
                            (company.vestedShares / company.totalShares) * 100
                          )}
                        </span>
                      </div>
                      <Progress
                        value={
                          (company.vestedShares / company.totalShares) * 100
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Vested Shares
                        </p>
                        <p className="font-medium">
                          {formatNumber(company.vestedShares)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Current Value
                        </p>
                        <p className="font-medium">
                          {formatCurrency(company.value)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Grant Types
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {company.grants
                          .reduce((types, grant) => {
                            if (!types.includes(grant.grant_type)) {
                              types.push(grant.grant_type);
                            }
                            return types;
                          }, [])
                          .map((type) => (
                            <Badge
                              key={type}
                              className={getGrantTypeColor(type)}
                            >
                              {type}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const firstGrantId = company.grants[0].id;
                      onViewGrant(firstGrantId);
                    }}
                  >
                    View Company Grants
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                AI-powered advice based on your financial situation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalizedAdvisor
                grants={grants}
                userFinancialData={userFinancialData}
              />
            </CardContent>
          </Card>
          {/* Company Comparisons */}
          <Card>
            <CardHeader>
              <CardTitle>Company Comparison</CardTitle>
              <CardDescription>
                Compare equity value across companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.values(grantsByCompany).map((company) => ({
                    name: company.companyName,
                    value: company.value,
                    shares: company.totalShares,
                    vestedShares: company.vestedShares,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(tick) => `${(tick / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "value") return formatCurrency(value);
                      return formatNumber(value);
                    }}
                  />
                  <Legend />
                  <Bar
                    name="Total Shares"
                    dataKey="shares"
                    fill="#FFBB28"
                    yAxisId="left"
                  />
                  <Bar
                    name="Vested Shares"
                    dataKey="vestedShares"
                    fill="#0088FE"
                    yAxisId="left"
                  />
                  <Bar
                    name="Current Value"
                    dataKey="value"
                    fill="#00C49F"
                    yAxisId="right"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grants Tab */}
        <TabsContent value="grants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">All Equity Grants</h3>
            <Button onClick={onAddGrant}>Add Grant</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grants.map((grant) => {
              const vesting = calculateDetailedVesting(grant);
              const vestedPercent = vesting.vestedPercentage;

              return (
                <Card key={grant.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">
                        {grant.company_name}
                      </CardTitle>
                      <Badge className={getGrantTypeColor(grant.grant_type)}>
                        {grant.grant_type}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatNumber(grant.shares)} shares • $
                      {grant.strike_price.toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Vesting Progress
                          </span>
                          <span>{formatPercentage(vestedPercent)}</span>
                        </div>
                        <Progress value={vestedPercent} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Vested Shares
                          </p>
                          <p className="font-medium">
                            {formatNumber(vesting.vestedShares)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Current Value
                          </p>
                          <p className="font-medium">
                            {formatCurrency(
                              vesting.vestedShares * grant.current_fmv
                            )}
                          </p>
                        </div>
                      </div>

                      {vesting.nextVestingDate && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Next Vesting
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-sm">
                              {formatDate(vesting.nextVestingDate)}
                            </p>
                            <p className="text-sm font-medium">
                              {formatNumber(vesting.nextVestingShares)} shares
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewGrant(grant.id)}
                    >
                      View Details
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditGrant(grant.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete ${grant.company_name} grant?`
                            )
                          ) {
                            onDeleteGrant(grant.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Grants Table View for larger screens */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Grants Table View</CardTitle>
              <CardDescription>
                Detailed view of all your equity grants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2 font-medium">Company</th>
                      <th className="py-3 px-2 font-medium">Type</th>
                      <th className="py-3 px-2 font-medium">Shares</th>
                      <th className="py-3 px-2 font-medium">Strike Price</th>
                      <th className="py-3 px-2 font-medium">Grant Date</th>
                      <th className="py-3 px-2 font-medium">Vesting</th>
                      <th className="py-3 px-2 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grants.map((grant) => {
                      const vesting = calculateDetailedVesting(grant);
                      return (
                        <tr
                          key={grant.id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-2 font-medium">
                            {grant.company_name}
                          </td>
                          <td className="py-3 px-2">
                            <Badge
                              className={getGrantTypeColor(grant.grant_type)}
                            >
                              {grant.grant_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            {formatNumber(grant.shares)}
                          </td>
                          <td className="py-3 px-2">
                            ${grant.strike_price.toFixed(2)}
                          </td>
                          <td className="py-3 px-2">
                            {formatDate(grant.grant_date)}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={vesting.vestedPercentage}
                                className="h-2 w-20"
                              />
                              <span className="text-xs text-muted-foreground">
                                {formatPercentage(vesting.vestedPercentage)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewGrant(grant.id)}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditGrant(grant.id)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to delete ${grant.company_name} grant?`
                                    )
                                  ) {
                                    onDeleteGrant(grant.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vesting Timeline Tab */}
        <TabsContent value="vesting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vesting Timeline</CardTitle>
              <CardDescription>
                Your equity vesting schedule over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={projectedData.filter(
                    (d, i) =>
                      i % 3 === 0 || i === 0 || i === projectedData.length - 1
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(tick) => {
                      const parts = tick.split("-");
                      const date = new Date(
                        parseInt(parts[0]),
                        parseInt(parts[1]) - 1
                      );
                      return `${date.toLocaleString("default", {
                        month: "short",
                      })} ${date.getFullYear()}`;
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: "Shares",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(tick) => `$${(tick / 1000).toFixed(0)}K`}
                    label={{
                      value: "Value",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "value") return formatCurrency(value);
                      return formatNumber(value);
                    }}
                    labelFormatter={(label) => {
                      const parts = label.split("-");
                      const date = new Date(
                        parseInt(parts[0]),
                        parseInt(parts[1]) - 1
                      );
                      return date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      });
                    }}
                  />
                  <Legend />
                  <Bar
                    name="Vested Shares"
                    dataKey="vestedShares"
                    fill="#0088FE"
                    yAxisId="left"
                  />
                  <Bar
                    name="Unvested Shares"
                    dataKey="unvestedShares"
                    fill="#FFBB28"
                    yAxisId="left"
                  />
                  <Bar
                    name="Vested Value"
                    dataKey="value"
                    fill="#00C49F"
                    yAxisId="right"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vesting Schedule Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Vesting Schedule</CardTitle>
              <CardDescription>
                Month-by-month breakdown of your vesting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium py-2 border-b">
                  <div>Date</div>
                  <div>Newly Vested</div>
                  <div>Total Vested</div>
                  <div className="text-right">Value</div>
                </div>

                {projectedData.slice(0, 12).map((month, index) => {
                  const prevMonth =
                    index > 0 ? projectedData[index - 1] : { vestedShares: 0 };
                  const newlyVested =
                    month.vestedShares - prevMonth.vestedShares;

                  return (
                    <div
                      key={month.month}
                      className="grid grid-cols-4 gap-4 text-sm py-2 border-b last:border-0"
                    >
                      <div>
                        {new Date(month.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div
                        className={
                          newlyVested > 0 ? "text-green-600 font-medium" : ""
                        }
                      >
                        {newlyVested > 0
                          ? `+${formatNumber(newlyVested)}`
                          : "-"}
                      </div>
                      <div>{formatNumber(month.vestedShares)}</div>
                      <div className="text-right">
                        {formatCurrency(month.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // This would typically download a CSV or open a modal with the full schedule
                  alert("Export functionality would go here");
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Full Schedule
              </Button>
            </CardFooter>
          </Card>

          {/* Vesting Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Key Vesting Milestones</CardTitle>
              <CardDescription>
                Important dates in your vesting journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grants.map((grant) => {
                  const cliffDate = grant.vesting_cliff_date
                    ? new Date(grant.vesting_cliff_date)
                    : null;
                  const endDate = new Date(grant.vesting_end_date);
                  const now = new Date();

                  return (
                    <div
                      key={grant.id}
                      className="border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium flex items-center">
                          {grant.company_name}
                          <Badge
                            className={`ml-2 ${getGrantTypeColor(
                              grant.grant_type
                            )}`}
                          >
                            {grant.grant_type}
                          </Badge>
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {cliffDate && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              <span>Cliff Date ({formatPercentage(25)})</span>
                            </div>
                            <div className="flex items-center">
                              <span
                                className={`${
                                  now > cliffDate ? "text-green-600" : ""
                                }`}
                              >
                                {formatDate(cliffDate)}
                              </span>
                              {now > cliffDate && (
                                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                  Passed
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <span>50% Vested</span>
                          </div>
                          <div>
                            {formatDate(
                              new Date(
                                new Date(grant.vesting_start_date).getTime() +
                                  (new Date(grant.vesting_end_date).getTime() -
                                    new Date(
                                      grant.vesting_start_date
                                    ).getTime()) /
                                    2
                              )
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <span>Fully Vested (100%)</span>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`${
                                now > endDate ? "text-green-600" : ""
                              }`}
                            >
                              {formatDate(endDate)}
                            </span>
                            {now > endDate && (
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                Complete
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Educational Content Section */}
      <Card className="border-dashed bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary" />
            Understanding Equity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basics">
            <TabsList className="mb-4">
              <TabsTrigger value="basics">Equity Basics</TabsTrigger>
              <TabsTrigger value="vesting">Vesting</TabsTrigger>
              <TabsTrigger value="taxes">Tax Implications</TabsTrigger>
            </TabsList>

            <TabsContent value="basics">
              <div className="space-y-4">
                <h3 className="font-medium">Types of Equity</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="border rounded-lg p-3 bg-white">
                    <h4 className="font-medium text-blue-600 mb-1">ISO</h4>
                    <p className="text-sm">
                      Incentive Stock Options offer potential tax benefits if
                      holding periods are met.
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 bg-white">
                    <h4 className="font-medium text-purple-600 mb-1">NSO</h4>
                    <p className="text-sm">
                      Non-Qualified Stock Options are taxed as ordinary income
                      upon exercise.
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 bg-white">
                    <h4 className="font-medium text-green-600 mb-1">RSU</h4>
                    <p className="text-sm">
                      Restricted Stock Units represent a promise to deliver
                      shares upon vesting.
                    </p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="px-0">
                  Learn more about equity types
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="vesting">
              <div className="space-y-4">
                <h3 className="font-medium">Vesting Schedules</h3>
                <p className="text-sm">
                  Most companies use a 4-year vesting schedule with a 1-year
                  cliff, meaning 25% vests after your first year, and the
                  remainder vests monthly, quarterly, or annually thereafter.
                </p>
                <div className="border rounded-lg p-3 bg-white">
                  <h4 className="font-medium mb-1">What is a cliff?</h4>
                  <p className="text-sm">
                    A cliff is the initial period before any equity vests. After
                    the cliff date, a portion of your equity (typically 25%)
                    vests immediately.
                  </p>
                </div>
                <Button variant="link" size="sm" className="px-0">
                  Understand vesting schedules in depth
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="taxes">
              <div className="space-y-4">
                <h3 className="font-medium">Tax Considerations</h3>
                <p className="text-sm">
                  Different equity types have different tax implications. ISOs
                  may qualify for preferential tax treatment but could trigger
                  Alternative Minimum Tax (AMT).
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border rounded-lg p-3 bg-white">
                    <h4 className="font-medium mb-1">Exercise vs. Sale</h4>
                    <p className="text-sm">
                      For options, exercising (buying) and selling are separate
                      events with different tax implications.
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 flex items-center bg-white">
                    <AlertCircle className="h-10 w-10 text-amber-500 mr-3 flex-shrink-0" />
                    <p className="text-sm">
                      Always consult a tax professional before making decisions
                      about exercising or selling equity.
                    </p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="px-0">
                  Explore equity tax guide
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedGrantsDashboard;
