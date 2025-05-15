// src/components/analytics/OverviewMetrics.jsx
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VestingProgressCard } from "../vesting-progress-card";
import { VestingCard } from "../vesting-card";
import { formatCurrency, formatPercentage } from "@/utils/formatters";

/**
 * Overview metrics component for analytics dashboard
 */
export default function OverviewMetrics({ analytics = {}, grants = [] }) {
  // Extract metrics from analytics data
  const {
    totalValue = 0,
    isoValue = 0,
    rsuValue = 0,
    isoPercentage = 0,
    rsuPercentage = 0,
    portfolioTimeline = [],
    // Adding vesting stats from analytics (or calculate if not provided)
    vestedShares = 0,
    unvestedShares = 0,
    vestedPercent = 0,
    upcomingEvents = [],
  } = analytics;

  // Generate upcoming events from grants if they aren't provided in analytics
  // This ensures we always have events to display if grants exist
  const processedUpcomingEvents =
    upcomingEvents && upcomingEvents.length > 0
      ? upcomingEvents
      : generateUpcomingEventsFromGrants(grants);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            Current estimated value
          </p>
        </CardContent>
      </Card>

      {/* ISO Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ISO Value</CardTitle>
          <div className="rounded-full bg-blue-100 p-1 text-blue-600">
            <span className="text-xs font-medium">
              {formatPercentage(isoPercentage)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(isoValue)}</div>
          <p className="text-xs text-muted-foreground">
            Incentive Stock Options
          </p>
        </CardContent>
      </Card>

      {/* RSU Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">RSU Value</CardTitle>
          <div className="rounded-full bg-green-100 p-1 text-green-600">
            <span className="text-xs font-medium">
              {formatPercentage(rsuPercentage)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(rsuValue)}</div>
          <p className="text-xs text-muted-foreground">
            Restricted Stock Units
          </p>
        </CardContent>
      </Card>

      {/* Vesting Progress */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Vesting Progress
          </CardTitle>
          <CardDescription>
            Overall vesting progress across all grants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VestingProgressCard
            vestedShares={vestedShares}
            unvestedShares={unvestedShares}
            vestedPercent={vestedPercent}
          />
        </CardContent>
      </Card>

      {/* Upcoming Vesting */}
      <Card className="col-span-2">
        <CardContent className="p-0">
          <VestingCard upcomingEvents={processedUpcomingEvents} maxItems={3} />
        </CardContent>
      </Card>

      {/* Portfolio Distribution */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Portfolio Distribution
          </CardTitle>
          <CardDescription>Distribution of equity by company</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.companyValues && analytics.companyValues.length > 0 ? (
            <div className="space-y-4">
              {analytics.companyValues.map((company, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{company.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <div
                        className="mr-1 h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: getCompanyColor(i),
                        }}
                      />
                      {formatPercentage(company.percentage)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(company.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-muted-foreground">
                No company data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Utility function to generate company colors
function getCompanyColor(index) {
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
}

// Helper function to generate upcoming events from grants
function generateUpcomingEventsFromGrants(grants = []) {
  if (!grants || grants.length === 0) return [];

  const events = [];
  const now = new Date();

  // Process each grant to extract upcoming vesting events
  grants.forEach((grant) => {
    // Skip if essential data is missing
    if (
      !grant.vesting_start_date ||
      !grant.vesting_end_date ||
      !grant.total_shares
    ) {
      return;
    }

    const startDate = new Date(grant.vesting_start_date);
    const endDate = new Date(grant.vesting_end_date);
    const cliffDate = grant.vesting_cliff_date
      ? new Date(grant.vesting_cliff_date)
      : null;
    const totalShares = Number(grant.total_shares) || 0;
    const currentFmv = Number(grant.current_fmv) || 0;

    // Skip if already fully vested
    if (now >= endDate) return;

    // Handle cliff vesting
    if (cliffDate && now < cliffDate && cliffDate > now) {
      // Calculate cliff shares (typically 25% of total for a 1-year cliff)
      const totalVestingMonths =
        (endDate - startDate) / (30 * 24 * 60 * 60 * 1000);
      const cliffMonths = (cliffDate - startDate) / (30 * 24 * 60 * 60 * 1000);
      const cliffPercentage = cliffMonths / totalVestingMonths;
      const cliffShares = Math.floor(totalShares * cliffPercentage);

      events.push({
        date: cliffDate,
        shares: cliffShares,
        company: grant.company_name,
        grant_type: grant.grant_type,
        fmv: currentFmv,
        value: cliffShares * currentFmv,
      });
    }

    // Generate events for regular vesting periods
    // This is a simplified approach - in real implementation, you'd use the actual vesting schedule
    const vestingSchedule = grant.vesting_schedule || "monthly";
    const remainingMonths =
      (endDate - Math.max(now, cliffDate || startDate)) /
      (30 * 24 * 60 * 60 * 1000);

    if (remainingMonths <= 0) return;

    // Calculate shares per interval
    let intervalMonths;
    if (vestingSchedule === "monthly") intervalMonths = 1;
    else if (vestingSchedule === "quarterly") intervalMonths = 3;
    else if (vestingSchedule === "annually") intervalMonths = 12;
    else intervalMonths = 1; // Default to monthly

    // Calculate shares per interval (simplified)
    const vestedSoFar =
      cliffDate && now >= cliffDate
        ? (totalShares * (now - startDate)) / (endDate - startDate)
        : 0;
    const remainingShares = totalShares - vestedSoFar;
    const sharesPerInterval =
      remainingShares / (remainingMonths / intervalMonths);

    // Generate the next few events
    let currentDate = new Date(Math.max(now, cliffDate || startDate));
    for (let i = 0; i < 12 && currentDate < endDate; i++) {
      // Determine next vesting date based on schedule
      if (vestingSchedule === "quarterly") {
        // Move to the start of next quarter
        const month = currentDate.getMonth();
        const nextQuarterMonth = Math.ceil((month + 1) / 3) * 3;
        currentDate = new Date(currentDate);
        currentDate.setMonth(nextQuarterMonth);
        currentDate.setDate(1);
      } else if (vestingSchedule === "annually") {
        // Move to next year, same month/day
        currentDate = new Date(currentDate);
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        // Default to monthly
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Skip if we've gone past the end date
      if (currentDate > endDate) {
        currentDate = new Date(endDate);
        // Final vesting
        events.push({
          date: currentDate,
          shares: remainingShares,
          company: grant.company_name,
          grant_type: grant.grant_type,
          fmv: currentFmv,
          value: remainingShares * currentFmv,
        });
        break;
      }

      events.push({
        date: currentDate,
        shares: sharesPerInterval,
        company: grant.company_name,
        grant_type: grant.grant_type,
        fmv: currentFmv,
        value: sharesPerInterval * currentFmv,
      });
    }
  });

  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  return events.slice(0, 10); // Return the next 10 events
}
