// src/app/dashboard/analytics/page-with-subscription.jsx
"use client";
import React, { useState, useEffect } from "react";
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
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { FEATURES, SUBSCRIPTION_TIERS } from "@/lib/subscriptions/plans";

/**
 * Analytics page component with subscription-based feature gating
 */
export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Set mounted state to handle client-side only code and detect mobile
  useEffect(() => {
    setMounted(true);
    
    // Handle responsive layout detection
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Use custom hook for data fetching
  const {
    loading,
    grants = [],
    scenarios = [],
    analytics = {
      // Default values to prevent undefined errors
      totalValue: 0,
      currentValue: 0,
      isoValue: 0,
      rsuValue: 0,
      isoPercentage: 0,
      rsuPercentage: 0,
      exerciseCost: 0,
      potentialGain: 0,
      totalShares: 0,
      vestedShares: 0,
      unvestedShares: 0,
      companyValues: [],
      portfolioTimeline: [], // This would be your timeline data
      upcomingEvents: [],
    },
    error,
    exportData = () => console.log("Export function not implemented"),
    companyOptions = [{ value: "all", label: "All Companies" }],
  } = useAnalyticsData(timeframe, companyFilter);

  // Ensure we have default timeline data even if analytics doesn't provide it
  const portfolioTimelineData =
    analytics?.portfolioTimeline?.length > 0
      ? analytics.portfolioTimeline
      : [
          // Default sample data if none provided
          {
            date: "2021-01-01",
            historicalValue: 0,
            projectedValue: null,
          },
          {
            date: "2022-01-01",
            historicalValue: 25000,
            projectedValue: null,
          },
          {
            date: "2023-01-01",
            historicalValue: 45000,
            projectedValue: null,
          },
          {
            date: "2024-01-01",
            historicalValue: 64000,
            projectedValue: null,
          },
          {
            date: "2025-01-01",
            historicalValue: 67000,
            projectedValue: 67000,
          },
          {
            date: "2026-01-01",
            historicalValue: null,
            projectedValue: 75000,
          },
        ];

  // Add the timeline data to the analytics object
  const enhancedAnalytics = {
    ...analytics,
    portfolioTimeline: portfolioTimelineData,
  };

  if (!mounted) {
    return <AuthLoading />;
  }

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
        <div className={`flex flex-wrap ${isMobile ? 'flex-col w-full' : ''} items-center gap-2`}>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}>
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
              <Button variant="outline" className={isMobile ? "w-full" : ""}>
                <Calendar className="mr-2 h-4 w-4" />
                Timeframe
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMobile ? "center" : "end"}>
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

          {/* Export feature requires Pro plan or higher */}
          <FeatureGate feature={FEATURES.ADVANCED_TAX_TOOLS}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={isMobile ? "w-full" : ""}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isMobile ? "center" : "end"}>
                <DropdownMenuItem onClick={() => exportData('json')}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('csv')}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </FeatureGate>
        </div>
      </DashboardHeader>

      {/* Basic metrics available to all subscription tiers */}
      <OverviewMetrics analytics={enhancedAnalytics} grants={grants} />

      <Tabs defaultValue="portfolio" className="mt-6 space-y-6">
        <TabsList className={isMobile ? "flex flex-col space-y-1 h-auto" : ""}>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="vesting">Vesting Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
        </TabsList>

        {/* Basic portfolio analysis - available to all tiers */}
        <TabsContent value="portfolio">
          <PortfolioTab analytics={enhancedAnalytics} />
        </TabsContent>

        {/* Vesting forecast - available to Pro tier and higher */}
        <TabsContent value="vesting">
          <FeatureGate feature={FEATURES.ADVANCED_TAX_TOOLS}>
            <VestingTab analytics={enhancedAnalytics} grants={grants} />
          </FeatureGate>
        </TabsContent>

        {/* Scenario comparison - available to Premium tier only */}
        <TabsContent value="scenarios">
          <FeatureGate feature={FEATURES.COMPREHENSIVE_SCENARIOS}>
            <ScenariosTab analytics={enhancedAnalytics} scenarios={scenarios} />
          </FeatureGate>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}