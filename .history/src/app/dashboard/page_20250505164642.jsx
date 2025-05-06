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

export default function DashboardPage() {
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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
        </div>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,500</div>
            <p className="text-xs text-muted-foreground">Across 3 grants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vested Shares</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,208</div>
            <div className="flex items-center space-x-2">
              <Progress value={41.7} className="h-2" />
              <div className="text-xs text-muted-foreground">41.7%</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$156,240</div>
            <p className="text-xs text-muted-foreground">At $30 per share</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercise Cost</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$20,832</div>
            <p className="text-xs text-muted-foreground">For vested shares</p>
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
                <EquityOverviewChart />
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
                <VestingProgressCard />
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
                <RecentScenariosCard />
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
                <NotificationsCard />
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
              <Button size="sm" className="ml-auto gap-1">
                <Plus className="h-4 w-4" />
                Add Grant
              </Button>
            </CardHeader>
            <CardContent>
              <GrantsTable />
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
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
              <CardDescription>
                Compare different exit scenarios for your equity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Scenario comparison visualization will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
