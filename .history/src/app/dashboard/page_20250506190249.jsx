"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Share2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { EquityOverviewChart } from "@/components/equity-overview-chart";
import { GrantsTable } from "@/components/grants-table";
import { NotificationsCard } from "@/components/notifications-card";
import { RecentScenariosCard } from "@/components/recent-scenarios-card";
import { VestingProgressCard } from "@/components/vesting-progress-card";
import AuthLoading from "@/components/auth/AuthLoading";
import { calculateVestedShares } from "@/utils/calculations";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("30d"); // Default timeframe
  const [dashboardData, setDashboardData] = useState({
    totalShares: 0,
    vestedShares: 0,
    vestedPercent: 0,
    currentValue: 0,
    exerciseCost: 0,
    avgSharePrice: 0,
    nextVestingEvent: null,
  });

  const supabase = createClient();

  // Fetch all necessary data for the dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setLoading(false);
          router.push("/login");
          return;
        }

        // Fetch grants
        const { data: grantsData, error: grantsError } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (grantsError) throw grantsError;

        // Process grants to calculate dashboard metrics
        const enrichedGrants = (grantsData || []).map((grant) => {
          const vestedShares = calculateVestedShares(grant);
          return {
            ...grant,
            vested_shares: vestedShares,
            vested_percent: (vestedShares / (grant.shares || 1)) * 100,
            current_value: vestedShares * (grant.current_fmv || 0),
            exercise_cost: vestedShares * (grant.strike_price || 0),
          };
        });

        setGrants(enrichedGrants);

        // Calculate dashboard metrics
        if (enrichedGrants.length > 0) {
          let totalShares = 0;
          let vestedShares = 0;
          let currentValue = 0;
          let exerciseCost = 0;
          let weightedSharePrice = 0;

          // Next vesting event calculation
          const today = new Date();
          let nextVestingEvent = null;
          let closestDays = Infinity;

          enrichedGrants.forEach((grant) => {
            // Calculate basic metrics
            totalShares += grant.shares || 0;
            vestedShares += grant.vested_shares || 0;
            currentValue += grant.current_value || 0;
            exerciseCost += grant.exercise_cost || 0;
            weightedSharePrice +=
              (grant.shares || 0) * (grant.current_fmv || 0);

            // Calculate next vesting event
            // This is simplified - in a real app, you'd calculate actual vesting dates
            if (
              grant.vesting_end_date &&
              new Date(grant.vesting_end_date) > today
            ) {
              // Find the next vesting date based on schedule
              const vestingDates = getVestingDates(grant);

              for (const date of vestingDates) {
                if (date > today) {
                  const daysUntil = Math.ceil(
                    (date - today) / (1000 * 60 * 60 * 24)
                  );

                  if (daysUntil < closestDays) {
                    closestDays = daysUntil;
                    const sharesPerPeriod = getSharesPerVestingPeriod(grant);

                    nextVestingEvent = {
                      date,
                      daysUntil,
                      shares: sharesPerPeriod,
                      companyName: grant.company_name,
                      value: sharesPerPeriod * (grant.current_fmv || 0),
                    };
                  }
                }
              }
            }
          });

          const avgSharePrice =
            totalShares > 0 ? weightedSharePrice / totalShares : 0;
          const vestedPercent =
            totalShares > 0 ? (vestedShares / totalShares) * 100 : 0;

          setDashboardData({
            totalShares,
            vestedShares,
            vestedPercent,
            currentValue,
            exerciseCost,
            avgSharePrice,
            nextVestingEvent,
          });
        }

        // Fetch scenarios
        const { data: scenariosData, error: scenariosError } = await supabase
          .from("scenarios")
          .select("*, equity_grants(company_name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (scenariosError) throw scenariosError;

        setScenarios(scenariosData || []);

        // Generate upcoming vesting notifications
        const upcomingVestingNotifications = [];
        if (dashboardData.nextVestingEvent) {
          upcomingVestingNotifications.push({
            id: "next-vesting",
            type: "vesting",
            title: "Upcoming Vesting Event",
            message: `${dashboardData.nextVestingEvent.shares.toLocaleString()} shares vesting in ${
              dashboardData.nextVestingEvent.daysUntil
            } days`,
            date: dashboardData.nextVestingEvent.date,
            is_read: false,
          });
        }

        // Fetch actual notifications
        const { data: notificationsData, error: notificationsError } =
          await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(5);

        if (notificationsError) throw notificationsError;

        // Combine real notifications with generated ones
        setNotifications([
          ...upcomingVestingNotifications,
          ...(notificationsData || []),
        ]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
        toast.error("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, timeframe, router]);

  // Helper function to get vesting dates
  const getVestingDates = (grant) => {
    // This is a simplified implementation
    // In a real app, you would calculate this based on the actual vesting schedule
    const dates = [];
    const startDate = new Date(grant.vesting_start_date);
    const endDate = new Date(grant.vesting_end_date);
    const cliffDate = grant.vesting_cliff_date
      ? new Date(grant.vesting_cliff_date)
      : null;

    // Add cliff date if it exists and is in the future
    if (cliffDate && cliffDate > new Date()) {
      dates.push(cliffDate);
    }

    // Add monthly dates after cliff
    const schedule = grant.vesting_schedule || "monthly";
    let intervalMonths = 1; // default is monthly

    if (schedule === "quarterly") intervalMonths = 3;
    if (schedule === "yearly") intervalMonths = 12;

    let currentDate = cliffDate || startDate;
    while (currentDate < endDate) {
      // Add months to the current date
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + intervalMonths);

      if (currentDate <= endDate) {
        dates.push(new Date(currentDate));
      }
    }

    return dates;
  };

  // Helper function to calculate shares per vesting period
  const getSharesPerVestingPeriod = (grant) => {
    // Simplified calculation - in a real app, this would be more complex
    const schedule = grant.vesting_schedule || "monthly";
    const totalShares = grant.shares;

    // Approximate vesting periods based on schedule
    let totalPeriods = 48; // default 48 months (4 years)

    if (schedule === "quarterly") totalPeriods = 16; // 16 quarters over 4 years
    if (schedule === "yearly") totalPeriods = 4; // 4 years

    return Math.ceil(totalShares / totalPeriods);
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      // Only update real notifications, not the generated ones
      const realNotificationIds = notifications
        .filter((n) => n.id !== "next-vesting")
        .map((n) => n.id);

      if (realNotificationIds.length > 0) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .in("id", realNotificationIds);

        if (error) throw error;

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id === "next-vesting"));

        toast.success("All notifications marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark notifications as read");
      console.error(err);
    }
  };

  // Timeframe change handler
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    // Data will be refetched via the useEffect dependency
  };

  // Show loading state
  if (loading) {
    return <AuthLoading />;
  }

  // Format currency helper
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Overview of your equity portfolio and vesting progress."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTimeframeChange("30d")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/scenarios/add">
              <Plus className="mr-2 h-4 w-4" />
              New Scenario
            </Link>
          </Button>
        </div>
      </DashboardHeader>

      {error ? (
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
      ) : grants.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
              <div className="rounded-full bg-primary/10 p-3">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No equity grants yet</h3>
              <p className="text-muted-foreground">
                Add your first equity grant to start tracking your portfolio.
              </p>
              <Button asChild>
                <Link href="/dashboard/grants/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Grant
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Shares
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.totalShares.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {grants.length} grant{grants.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vested Shares
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.vestedShares.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={dashboardData.vestedPercent}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {dashboardData.vestedPercent.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.currentValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  At ${dashboardData.avgSharePrice.toFixed(2)} avg. price
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Exercise Cost
                </CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.exerciseCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  For vested shares
                </p>
              </CardContent>
            </Card>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="grants">Grants</TabsTrigger>
              <TabsTrigger value="vesting">Vesting Timeline</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Equity Overview</CardTitle>
                    <CardDescription>
                      Your equity value over time based on current share price.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <EquityOverviewChart grants={grants} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Vesting Progress</CardTitle>
                    <CardDescription>
                      Breakdown of your vesting schedule.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VestingProgressCard
                      vestedShares={dashboardData.vestedShares}
                      unvestedShares={
                        dashboardData.totalShares - dashboardData.vestedShares
                      }
                      vestedPercent={dashboardData.vestedPercent}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-1">
                      <CardTitle>Recent Scenarios</CardTitle>
                      <CardDescription>
                        Your recently created equity scenarios.
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                      <Link href="/dashboard/scenarios">
                        View All
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <RecentScenariosCard scenarios={scenarios} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-1">
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>
                        Upcoming vesting events and important dates.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      onClick={handleMarkAllNotificationsRead}
                      disabled={notifications.length === 0}
                    >
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Mark all as read</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <NotificationsCard notifications={notifications} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="grants" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-1">
                    <CardTitle>Your Equity Grants</CardTitle>
                    <CardDescription>
                      Manage and track all your equity grants.
                    </CardDescription>
                  </div>
                  <Button size="sm" className="ml-auto gap-1" asChild>
                    <Link href="/dashboard/grants/add">
                      <Plus className="h-4 w-4" />
                      Add Grant
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <GrantsTable grants={grants} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="vesting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vesting Timeline</CardTitle>
                  <CardDescription>
                    View your past and future vesting events.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* This could be implemented with another component */}
                  <div className="space-y-4">
                    {grants.map((grant) => {
                      const vestingDates = getVestingDates(grant);
                      const today = new Date();

                      // Filter for upcoming dates
                      const upcomingDates = vestingDates
                        .filter((date) => date > today)
                        .slice(0, 3);

                      return upcomingDates.length > 0 ? (
                        <div
                          key={grant.id}
                          className="border-b pb-4 last:border-0"
                        >
                          <h3 className="font-medium mb-2">
                            {grant.company_name}
                          </h3>
                          <div className="space-y-2">
                            {upcomingDates.map((date, i) => {
                              const sharesPerPeriod =
                                getSharesPerVestingPeriod(grant);
                              const daysUntil = Math.ceil(
                                (date - today) / (1000 * 60 * 60 * 24)
                              );

                              return (
                                <div
                                  key={i}
                                  className="flex justify-between items-center"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span>{date.toLocaleDateString()}</span>
                                    <span className="text-muted-foreground text-sm">
                                      ({daysUntil} days)
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      {sharesPerPeriod.toLocaleString()} shares
                                    </span>
                                    <span className="text-muted-foreground text-sm ml-2">
                                      (~
                                      {formatCurrency(
                                        sharesPerPeriod *
                                          (grant.current_fmv || 0)
                                      )}
                                      )
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })}

                    {grants.every((grant) => {
                      const vestingDates = getVestingDates(grant);
                      const today = new Date();
                      return !vestingDates.some((date) => date > today);
                    }) && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No upcoming vesting events
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="scenarios" className="space-y-4">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>
                      Compare different exit scenarios for your equity.
                    </CardDescription>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/scenarios/add">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Scenario
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {scenarios.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No scenarios yet. Create your first scenario to compare
                        different exit options.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className="flex justify-between items-center border-b pb-4 last:border-0"
                        >
                          <div>
                            <h3 className="font-medium">{scenario.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {scenario.exit_type} at $
                              {scenario.share_price
                                ? scenario.share_price.toFixed(2)
                                : "0.00"}{" "}
                              per share
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(
                                scenario.share_price *
                                  (scenario.shares_included || 0)
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(scenario.shares_included || 0).toLocaleString()}{" "}
                              shares
                            </p>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href="/dashboard/scenarios">
                          View All Scenarios
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}
