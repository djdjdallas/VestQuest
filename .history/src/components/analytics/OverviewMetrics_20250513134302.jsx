// src/components/analytics/OverviewMetrics.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  DollarSign,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";
import {
  formatCurrency,
  formatPercentage,
  safeValue,
} from "@/utils/format-utils";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { getUpcomingVestingEvents } from "@/utils/enhanced-vesting-calculations";

/**
 * Component that displays an overview of key equity metrics
 * @param {Object} analytics - The analytics data object
 * @param {Array} grants - The array of equity grants
 */
export const OverviewMetrics = ({ analytics, grants = [] }) => {
  // Calculate ROI percentage for display
  const roiPercentage =
    analytics.exerciseCost > 0
      ? (analytics.potentialGain / analytics.exerciseCost) * 100
      : 0;

  // Process upcoming events from analytics or generate from grants if missing
  const upcomingEvents =
    analytics.upcomingEvents && analytics.upcomingEvents.length > 0
      ? analytics.upcomingEvents
      : generateUpcomingEventsFromGrants(grants);

  // Limit to 3 events for display
  const displayedEvents = upcomingEvents.slice(0, 3);

  return (
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
                  (analytics.currentValue / Math.max(analytics.totalShares, 1))
              )}
            </div>
            <div className="ml-2 text-sm text-muted-foreground">
              of {formatCurrency(analytics.currentValue)}
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

      {/* Upcoming Vesting Events Card */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Vesting
          </CardTitle>
          <CardDescription>
            Next scheduled vesting events across all grants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayedEvents.length > 0 ? (
            <div className="space-y-3">
              {displayedEvents.map((event, i) => {
                const eventDate = new Date(event.date);
                const daysUntil = differenceInDays(eventDate, new Date());

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          daysUntil <= 30 ? "bg-yellow-500/10" : "bg-primary/10"
                        }`}
                      >
                        <Calendar
                          className={`h-4 w-4 ${
                            daysUntil <= 30 ? "text-yellow-500" : "text-primary"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(eventDate, "MMMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.company} - {daysUntil} days from now
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatNumber(event.shares)} shares
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(
                          event.value || event.shares * (event.fmv || 0)
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {upcomingEvents.length > 3 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    +{upcomingEvents.length - 3} more events
                  </p>
                </div>
              )}

              <Link
                href="/dashboard/upcoming-events"
                className="flex items-center justify-center text-sm text-primary hover:underline mt-2"
              >
                <Button variant="ghost" size="sm" className="gap-1">
                  View All Events
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No upcoming vesting events
              </p>
              <Link
                href="/dashboard/grants/add"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Add your first grant
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Helper function to generate upcoming events from grants
 * @param {Array} grants - Array of equity grants
 * @returns {Array} Upcoming vesting events
 */
function generateUpcomingEventsFromGrants(grants = []) {
  if (!grants || grants.length === 0) return [];

  const events = [];
  const now = new Date();

  // Process each grant to extract upcoming vesting events
  grants.forEach((grant) => {
    try {
      // Skip if essential data is missing
      if (
        !grant.vesting_start_date ||
        !grant.vesting_end_date ||
        !grant.shares ||
        !grant.total_shares
      ) {
        return;
      }

      const startDate = new Date(grant.vesting_start_date);
      const endDate = new Date(grant.vesting_end_date);
      const cliffDate = grant.vesting_cliff_date
        ? new Date(grant.vesting_cliff_date)
        : null;
      const totalShares = Number(grant.shares || grant.total_shares) || 0;
      const currentFmv = Number(grant.current_fmv) || 0;

      // Skip if already fully vested
      if (now >= endDate) return;

      // Use utility function if available, otherwise calculate simple events
      if (typeof getUpcomingVestingEvents === "function") {
        const calculatedEvents = getUpcomingVestingEvents(grant, 12); // Look ahead 12 months

        calculatedEvents.forEach((event) => {
          events.push({
            ...event,
            company: grant.company_name,
            grant_type: grant.grant_type,
            grant_id: grant.id,
            fmv: currentFmv,
            value: event.shares * currentFmv,
          });
        });
      } else {
        // Simple fallback calculation if utility function not available

        // Handle cliff vesting
        if (cliffDate && now < cliffDate) {
          const cliffShares = Math.floor(totalShares * 0.25); // Typical 25% cliff

          events.push({
            date: cliffDate,
            shares: cliffShares,
            company: grant.company_name,
            grant_type: grant.grant_type,
            fmv: currentFmv,
            value: cliffShares * currentFmv,
          });
        }

        // Generate simplified monthly events
        const vestingMonths =
          (endDate.getTime() - startDate.getTime()) /
          (30 * 24 * 60 * 60 * 1000);
        const sharesPerMonth = totalShares / vestingMonths;

        // Generate next 6 months of events
        for (let i = 0; i < 6; i++) {
          const eventDate = new Date(now);
          eventDate.setMonth(eventDate.getMonth() + i + 1);

          // Skip if past end date
          if (eventDate > endDate) break;

          // Skip if before cliff
          if (cliffDate && eventDate < cliffDate) continue;

          events.push({
            date: eventDate,
            shares: Math.floor(sharesPerMonth),
            company: grant.company_name,
            grant_type: grant.grant_type,
            fmv: currentFmv,
            value: Math.floor(sharesPerMonth) * currentFmv,
          });
        }
      }
    } catch (err) {
      console.error("Error processing grant for vesting events:", err);
    }
  });

  // Sort events by date and filter out invalid dates
  return events
    .filter((event) => event.date instanceof Date && !isNaN(event.date))
    .sort((a, b) => a.date - b.date);
}

export default OverviewMetrics;
