"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalShares: 0,
    vestedShares: 0,
    vestedPercent: 0,
    currentValue: 0,
    exerciseCost: 0,
    avgSharePrice: 0,
  });

  const supabase = createClient();

  // Fetch all necessary data for the dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
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
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (grantsError) throw grantsError;

        // Process grants to calculate dashboard metrics
        const enrichedGrants = grantsData.map((grant) => {
          const vestedShares = calculateVestedShares(grant);
          return {
            ...grant,
            vested_shares: vestedShares,
            vested_percent: (vestedShares / grant.shares) * 100,
          };
        });

        setGrants(enrichedGrants || []);

        // Calculate dashboard metrics
        if (enrichedGrants.length > 0) {
          let totalShares = 0;
          let vestedShares = 0;
          let currentValue = 0;
          let exerciseCost = 0;
          let weightedSharePrice = 0;

          enrichedGrants.forEach((grant) => {
            totalShares += grant.shares;
            vestedShares += grant.vested_shares;
            currentValue += grant.vested_shares * grant.current_fmv;
            exerciseCost += grant.vested_shares * grant.strike_price;
            weightedSharePrice += grant.shares * grant.current_fmv;
          });

          const avgSharePrice = weightedSharePrice / totalShares;
          const vestedPercent =
            totalShares > 0 ? (vestedShares / totalShares) * 100 : 0;

          setDashboardData({
            totalShares,
            vestedShares,
            vestedPercent,
            currentValue,
            exerciseCost,
            avgSharePrice,
          });
        }

        // Fetch scenarios
        const { data: scenariosData, error: scenariosError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (scenariosError) throw scenariosError;

        setScenarios(scenariosData || []);

        // Fetch notifications
        const { data: notificationsData, error: notificationsError } =
          await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(3);

        if (notificationsError) throw notificationsError;

        setNotifications(notificationsData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
        toast.error("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  // Show loading state
  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Overview of your equity portfolio and vesting progress."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
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
                  ${dashboardData.currentValue.toLocaleString()}
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
                  ${dashboardData.exerciseCost.toLocaleString()}
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
                    <Button variant="ghost" size="icon" className="ml-auto">
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Notifications</span>
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
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Vesting timeline visualization will appear here.
                    </p>
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
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Scenario comparison visualization will appear here.
                      </p>
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
