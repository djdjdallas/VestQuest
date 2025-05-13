// src/pages/dashboard/analytics.jsx
"use client";
import React, { useState } from "react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Calendar, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthLoading from "@/components/auth/AuthLoading";
import { Card, CardContent } from "@/components/ui/card";
import OverviewMetrics from "@/components/analytics/OverviewMetrics";
import PortfolioTab from "@/components/analytics/PortfolioTab";
import VestingTab from "@/components/analytics/VestingTab";
import ScenariosTab from "@/components/analytics/ScenariosTab";
import EmptyState from "@/components/analytics/EmptyState";

/**
 * Analytics page component
 */
export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  // Use custom hook for data fetching
  const {
    loading,
    grants,
    scenarios,
    analytics,
    error,
    exportData,
    companyOptions,
  } = useAnalyticsData(timeframe, companyFilter);

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
    return <EmptyState />;
  }

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

          <Button onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </DashboardHeader>

      <OverviewMetrics analytics={analytics} />

      <Tabs defaultValue="portfolio" className="mt-6 space-y-6">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="vesting">Vesting Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <PortfolioTab analytics={analytics} />
        </TabsContent>

        <TabsContent value="vesting">
          <VestingTab analytics={analytics} grants={grants} />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenariosTab analytics={analytics} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
