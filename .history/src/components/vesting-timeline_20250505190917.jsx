"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { format, addMonths, parseISO } from "date-fns";
import { calculateVestedShares } from "@/utils/calculations";
import AuthLoading from "@/components/auth/AuthLoading";

export function VestingTimeline() {
  const [mounted, setMounted] = useState(false);
  const [grants, setGrants] = useState([]);
  const [vestingEvents, setVestingEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch grants and vesting events
  useEffect(() => {
    const fetchVestingData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch all grants
        const { data: grantsData, error: grantsError } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("user_id", user.id);

        if (grantsError) throw grantsError;
        setGrants(grantsData || []);

        // Fetch vesting events
        const { data: eventsData, error: eventsError } = await supabase
          .from("vesting_events")
          .select("*, equity_grants!inner(*)")
          .order("vesting_date", { ascending: true });

        if (eventsError) throw eventsError;
        setVestingEvents(eventsData || []);

        // Process data for chart
        if (grantsData && grantsData.length > 0) {
          const chartData = processChartData(grantsData);
          setChartData(chartData);
        }
      } catch (err) {
        console.error("Error fetching vesting data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVestingData();
    setMounted(true);
  }, [supabase]);

  // Process grant data into chart format
  const processChartData = (grants) => {
    // Determine the start and end dates for the chart
    let earliestDate = new Date();
    let latestDate = new Date();

    grants.forEach((grant) => {
      const startDate = new Date(grant.vesting_start_date);
      const endDate = new Date(grant.vesting_end_date);

      if (startDate < earliestDate) earliestDate = startDate;
      if (endDate > latestDate) latestDate = endDate;
    });

    // Generate quarterly buckets between earliest and latest dates
    const chartData = [];
    let currentDate = new Date(earliestDate);

    while (currentDate <= latestDate) {
      const monthLabel = format(currentDate, "MMM ''yy");
      const dataPoint = { month: monthLabel };

      // Calculate vesting for each grant at this date
      grants.forEach((grant) => {
        const grantLabel = `${grant.company_name} ${grant.grant_type}`;

        // Calculate shares vested between this quarter and the previous one
        const prevDate = addMonths(currentDate, -3);
        const prevVested = calculateVestedShares(grant, prevDate);
        const currVested = calculateVestedShares(grant, currentDate);
        const quarterlyVested = Math.max(0, currVested - prevVested);

        dataPoint[grantLabel] = quarterlyVested;
      });

      chartData.push(dataPoint);
      currentDate = addMonths(currentDate, 3); // Move to next quarter
    }

    return chartData;
  };

  // Generate upcoming vesting events
  const getUpcomingEvents = () => {
    const today = new Date();
    const threeMonthsLater = addMonths(today, 3);

    // If we have vesting_events table data, use that
    if (vestingEvents && vestingEvents.length > 0) {
      return vestingEvents
        .filter((event) => {
          const eventDate = new Date(event.vesting_date);
          return eventDate >= today && eventDate <= threeMonthsLater;
        })
        .slice(0, 5) // Limit to next 5 events
        .map((event) => ({
          date: format(new Date(event.vesting_date), "MMM d, yyyy"),
          shares: event.shares_vested,
          type: `${event.equity_grants.company_name} ${event.equity_grants.grant_type}`,
          fmv: event.equity_grants.current_fmv,
        }));
    }

    // If no events table, calculate from grants
    const events = [];
    grants.forEach((grant) => {
      const schedule = grant.vesting_schedule || "monthly";
      let interval;

      switch (schedule) {
        case "monthly":
          interval = 1;
          break;
        case "quarterly":
          interval = 3;
          break;
        case "yearly":
          interval = 12;
          break;
        default:
          interval = 1;
      }

      // Calculate next vesting dates
      let nextDate = new Date(grant.vesting_start_date);
      const cliffDate = new Date(grant.vesting_cliff_date);
      const endDate = new Date(grant.vesting_end_date);

      // If we haven't reached cliff yet, the next date is the cliff
      if (today < cliffDate) {
        if (cliffDate <= threeMonthsLater) {
          const cliffShares = Math.floor(grant.shares * 0.25); // Typical cliff is 25%
          events.push({
            date: format(cliffDate, "MMM d, yyyy"),
            shares: cliffShares,
            type: `${grant.company_name} ${grant.grant_type}`,
            fmv: grant.current_fmv,
          });
        }
      } else {
        // Find the next vesting dates after cliff
        while (nextDate <= endDate) {
          if (nextDate >= today && nextDate <= threeMonthsLater) {
            const sharesPerPeriod = Math.floor(
              grant.shares / (endDate - nextDate)
            );
            events.push({
              date: format(nextDate, "MMM d, yyyy"),
              shares: sharesPerPeriod,
              type: `${grant.company_name} ${grant.grant_type}`,
              fmv: grant.current_fmv,
            });
          }
          nextDate = addMonths(nextDate, interval);
        }
      }
    });

    // Sort by date and limit to 5
    return events
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return <AuthLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500">Error loading vesting data: {error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (grants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No equity grants found. Add your first grant to see your vesting
          timeline.
        </p>
        <Button className="mt-4" asChild>
          <a href="/dashboard/grants/add">Add Your First Grant</a>
        </Button>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Card className="p-2 shadow-lg border border-border bg-background">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <div
                          key={`item-${index}`}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <p className="text-sm">
                            {entry.name}: {entry.value} shares
                          </p>
                        </div>
                      ))}
                    </Card>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {grants.map((grant, index) => {
              const colors = [
                "#0f56b3",
                "#06b6d4",
                "#6366f1",
                "#8b5cf6",
                "#ec4899",
              ];
              return (
                <Bar
                  key={grant.id}
                  dataKey={`${grant.company_name} ${grant.grant_type}`}
                  stackId="a"
                  fill={colors[index % colors.length]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-medium">Upcoming Vesting Events</h3>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map((event, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{event.date}</p>
                  <p className="text-sm text-muted-foreground">{event.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{event.shares} shares</p>
                  <p className="text-sm text-muted-foreground">
                    ${(event.shares * event.fmv).toLocaleString()} at $
                    {event.fmv}/share
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No upcoming vesting events in the next 3 months.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
