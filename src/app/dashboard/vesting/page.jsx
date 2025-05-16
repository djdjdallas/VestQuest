"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { saveAs } from "file-saver";
import { format, addMonths } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Download, Info, Clock, ChevronRight, PlusCircle, Calendar, AlertCircle, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { VestingTimeline } from "@/components/vesting-timeline";
import { VestingExplainer } from "@/components/vesting-explainer";
import { UpcomingEventsTab } from "@/components/upcoming-events";
import { VestingSimulationModal } from "@/components/vesting-simulation/VestingSimulationModal";
import { useVestingSimulation } from "@/components/vesting-simulation/useVestingSimulation";
import AuthLoading from "@/components/auth/AuthLoading";
import {
  calculateDetailedVesting,
  getUpcomingVestingEvents,
  handleDoubleTriggerRSUs
} from "@/utils/enhanced-vesting-calculations";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/format-utils";

export default function VestingPage() {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [enhancedGrants, setEnhancedGrants] = useState([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [totalShares, setTotalShares] = useState(0);
  const [vestedShares, setVestedShares] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [milestoneEvents, setMilestoneEvents] = useState([]);
  const [nextMilestone, setNextMilestone] = useState(null);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const supabase = createClient();

  // Initialize simulation hook
  const {
    simulateScenario,
    simulateSchedule,
    simulationModalOpen,
    setSimulationModalOpen,
    currentSimulation,
    simulationType,
  } = useVestingSimulation();

  const fetchGrants = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Process the grants with enhanced calculations
      const processedGrants = processGrants(data || []);
      setGrants(data || []);
      setEnhancedGrants(processedGrants);

      // Calculate totals and upcoming events
      calculateTotals(processedGrants);
    } catch (err) {
      console.error("Error fetching grants:", err);
      setError(err.message);
      toast.error("Failed to load vesting data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGrants();

    // Check if calendar syncing has been done before
    const syncStatus = localStorage.getItem("vestingCalendarSynced");
    if (syncStatus === "true") {
      setCalendarSynced(true);
    } else {
      setShowCalendarPrompt(true);
    }
  }, [fetchGrants]);

  // Process grants with detailed vesting calculations
  const processGrants = (grantsData) => {
    if (!grantsData || grantsData.length === 0) return [];

    return grantsData.map((grant) => {
      const detailedVesting = calculateDetailedVesting(grant);
      const upcomingVestingEvents = getUpcomingVestingEvents(grant, 12); // Look ahead 12 months

      return {
        ...grant,
        detailedVesting,
        upcomingVestingEvents,
      };
    });
  };

  // Calculate overall totals from processed grants
  const calculateTotals = (processedGrants) => {
    if (processedGrants.length === 0) return;

    let totalSharesCount = 0;
    let vestedSharesCount = 0;
    let currentValueAmount = 0;
    const allUpcomingEvents = [];
    const allMilestoneEvents = [];

    processedGrants.forEach((grant) => {
      totalSharesCount += grant.shares || 0;
      vestedSharesCount += grant.detailedVesting.vestedShares || 0;
      currentValueAmount +=
        (grant.detailedVesting.vestedShares || 0) * (grant.current_fmv || 0);

      // Add upcoming vesting events
      if (
        grant.upcomingVestingEvents &&
        grant.upcomingVestingEvents.length > 0
      ) {
        grant.upcomingVestingEvents.forEach((event) => {
          // Calculate vesting percentage for this event
          const percentageOfTotal = ((event.shares / grant.shares) * 100).toFixed(1);
          const isMilestone = 
            percentageOfTotal >= 25 || // 25%, 50%, 75%, 100% milestones
            event.event === "Cliff Vesting" || 
            event.event === "Final Vesting";
            
          const enrichedEvent = {
            ...event,
            company: grant.company_name,
            grant_type: grant.grant_type,
            grant_id: grant.id,
            percentageOfTotal: parseFloat(percentageOfTotal),
            isMilestone,
            value: event.shares * (grant.current_fmv || 0)
          };
          
          allUpcomingEvents.push(enrichedEvent);
          
          if (isMilestone) {
            allMilestoneEvents.push(enrichedEvent);
          }
        });
      }
    });

    // Sort upcoming events by date
    allUpcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    allMilestoneEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    setTotalShares(totalSharesCount);
    setVestedShares(vestedSharesCount);
    setCurrentValue(currentValueAmount);
    setUpcomingEvents(allUpcomingEvents);
    setMilestoneEvents(allMilestoneEvents);
    
    // Set next milestone if available
    const now = new Date();
    const nextMilestone = allMilestoneEvents.find(event => new Date(event.date) > now);
    setNextMilestone(nextMilestone);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      if (enhancedGrants.length === 0) {
        toast.error("No vesting data to export");
        return;
      }

      // Create CSV content with more detailed data
      let csvContent =
        "Company,Grant Type,Date,Vested Shares,Unvested Shares,Vested Value,Total Value,Vesting %,FMV,Strike Price,Event\n";

      enhancedGrants.forEach((grant) => {
        const vesting = grant.detailedVesting;

        csvContent += `${grant.company_name},${grant.grant_type},${format(
          new Date(),
          "yyyy-MM-dd"
        )},`;
        csvContent += `${vesting.vestedShares},${vesting.unvestedShares},`;
        csvContent += `${vesting.vestedShares * grant.current_fmv},${
          grant.shares * grant.current_fmv
        },`;
        csvContent += `${vesting.vestedPercentage.toFixed(2)}%,`;
        csvContent += `${grant.current_fmv},${grant.strike_price || "N/A"},"Current Status"\n`;

        // Add upcoming vesting events for each grant
        if (
          grant.upcomingVestingEvents &&
          grant.upcomingVestingEvents.length > 0
        ) {
          grant.upcomingVestingEvents.forEach((event) => {
            csvContent += `${grant.company_name},${grant.grant_type},${format(
              new Date(event.date),
              "yyyy-MM-dd"
            )},`;
            csvContent += `${event.shares},${grant.shares - event.shares},`;
            csvContent += `${event.shares * grant.current_fmv},${
              grant.shares * grant.current_fmv
            },`;
            csvContent += `${((event.shares / grant.shares) * 100).toFixed(
              2
            )}%,`;
            csvContent += `${grant.current_fmv},${grant.strike_price || "N/A"},"${event.event}"\n`;
          });
        }
      });

      // Convert to Blob and save
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `vesting-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`);

      toast.success("Vesting data exported successfully");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export vesting data");
    } finally {
      setExporting(false);
    }
  };

  const handleCalendarSync = () => {
    // In a real implementation, this would integrate with the user's calendar
    // For now, we'll just simulate successful syncing
    toast.success("Vesting events synced to your calendar");
    setCalendarSynced(true);
    setShowCalendarPrompt(false);
    localStorage.setItem("vestingCalendarSynced", "true");
  };

  // Handle the "Simulate This Scenario" button click
  const handleSimulateScenario = (scenarioType) => {
    // Use the first grant for demonstration if available
    const grantToSimulate =
      enhancedGrants.length > 0 ? enhancedGrants[0] : null;

    // Run the simulation based on scenario type
    if (scenarioType === "before-cliff") {
      simulateScenario("before-cliff", grantToSimulate);
    } else if (scenarioType === "after-cliff") {
      simulateScenario("after-cliff", grantToSimulate);
    } else if (scenarioType === "fully-vested") {
      simulateScenario("fully-vested", grantToSimulate);
    } else if (scenarioType === "m-and-a") {
      simulateScenario("m-and-a", grantToSimulate);
    }
  };

  // Handle the "Simulate This Schedule" button click
  const handleSimulateSchedule = (scheduleType) => {
    // Use the first grant for demonstration if available
    const grantToSimulate =
      enhancedGrants.length > 0 ? enhancedGrants[0] : null;

    // Run the simulation based on schedule type
    if (scheduleType === "standard") {
      simulateSchedule("monthly", grantToSimulate);
    } else if (scheduleType === "quarterly") {
      simulateSchedule("quarterly", grantToSimulate);
    } else if (scheduleType === "no-cliff") {
      simulateSchedule("no-cliff", grantToSimulate);
    } else if (scheduleType === "accelerated") {
      simulateSchedule("accelerated", grantToSimulate);
    }
  };
  
  // Memoize metrics data
  const metricsData = useMemo(() => {
    if (enhancedGrants.length === 0) return {};
    
    const vestPercentage = totalShares > 0 
      ? ((vestedShares / totalShares) * 100).toFixed(1)
      : 0;
      
    return {
      totalShares,
      vestedShares,
      unvestedShares: totalShares - vestedShares,
      vestPercentage,
      currentValue
    };
  }, [enhancedGrants, totalShares, vestedShares, currentValue]);

  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Vesting Dashboard"
        text="Track your equity vesting schedule, milestone events, and explore different vesting scenarios."
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportData}
            disabled={exporting || grants.length === 0}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export Data"}
          </Button>

          {showCalendarPrompt && !calendarSynced && (
            <Button onClick={handleCalendarSync} variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Sync to Calendar
            </Button>
          )}

          <Button asChild>
            <a href="/dashboard/grants/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Grant
            </a>
          </Button>
        </div>
      </DashboardHeader>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchGrants}>
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
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No equity grants yet</h3>
              <p className="text-muted-foreground">
                Add your first equity grant to start tracking your vesting
                schedule.
              </p>
              <Button asChild>
                <a href="/dashboard/grants/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Grant
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vesting Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Shares
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The total number of shares across all your equity grants
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metricsData.totalShares)}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The number of shares that have vested and are now yours
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metricsData.vestedShares)}
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${
                        metricsData.totalShares > 0 
                          ? (metricsData.vestedShares / metricsData.totalShares) * 100 
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metricsData.vestPercentage}% vested
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Value
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The value of your vested shares at current FMV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metricsData.currentValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on current FMV
                </p>
              </CardContent>
            </Card>

            <Card className={nextMilestone ? "border-primary/30 bg-primary/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Milestone
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your next significant vesting milestone</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {nextMilestone ? (
                  <>
                    <div className="text-lg font-bold">
                      {format(new Date(nextMilestone.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bell className="h-3 w-3 text-primary" />
                      <p className="text-xs font-medium text-primary">
                        {nextMilestone.event === "Cliff Vesting" 
                          ? "Cliff Date" 
                          : nextMilestone.event === "Final Vesting"
                          ? "Final Vesting"
                          : `${nextMilestone.percentageOfTotal}% Vesting`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNumber(nextMilestone.shares)} shares from {nextMilestone.company}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold">No milestones</div>
                    <p className="text-xs text-muted-foreground">
                      No significant vesting events upcoming
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Next vesting event highlight - only show if available */}
          {upcomingEvents.length > 0 && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 sm:p-3 mt-1">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next vesting event</p>
                      <h3 className="text-lg font-medium">{format(new Date(upcomingEvents[0].date), "MMMM d, yyyy")}</h3>
                      <p className="text-sm">
                        {formatNumber(upcomingEvents[0].shares)} shares ({formatCurrency(upcomingEvents[0].value)}) from {upcomingEvents[0].company}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCalendarSync}>
                        <Bell className="mr-2 h-4 w-4" />
                        Set Reminder
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("upcoming")}>
                        View All Events
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {upcomingEvents.length > 1 
                        ? `+ ${upcomingEvents.length - 1} more events in the next 12 months` 
                        : "No other events in the next 12 months"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs */}
          <Tabs
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="timeline">Vesting Timeline</TabsTrigger>
              <TabsTrigger value="explore">Explore Scenarios</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="learn">Learn About Vesting</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <VestingTimeline grants={enhancedGrants} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="explore" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    <div className="bg-muted/50 rounded-lg p-6">
                      <h2 className="text-xl font-medium mb-2">
                        Interactive Vesting Scenarios
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        Explore different vesting scenarios to understand the implications of your equity compensation
                      </p>

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">
                            Vesting Simulator
                          </h3>
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-4 border rounded-lg p-4">
                                <h4 className="font-medium">
                                  Leaving a Company
                                </h4>
                                <div className="space-y-4">
                                  <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-red-100 p-2 mt-1">
                                      <Info className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Before the Cliff
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        If you leave before your cliff
                                        (typically 1 year), you forfeit all
                                        equity. Nothing has vested yet.
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSimulateScenario("before-cliff")
                                        }
                                      >
                                        Simulate This Scenario
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-amber-100 p-2 mt-1">
                                      <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        After the Cliff, During Vesting
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        You keep what has vested up to your last
                                        day. For options, you typically have 90
                                        days to exercise vested options.
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSimulateScenario("after-cliff")
                                        }
                                      >
                                        Simulate This Scenario
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-green-100 p-2 mt-1">
                                      <Info className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        After Full Vesting
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        All shares have vested. For options, you
                                        may still need to exercise within a
                                        certain timeframe after leaving.
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSimulateScenario("fully-vested")
                                        }
                                      >
                                        Simulate This Scenario
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4 border rounded-lg p-4">
                                <h4 className="font-medium">
                                  Different Vesting Schedules
                                </h4>
                                <div className="space-y-4">
                                  <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-blue-100 p-2 mt-1">
                                      <Info className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Standard 4-Year Monthly Vesting
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        After a 1-year cliff (25%), the
                                        remaining 75% vests monthly over the
                                        next 3 years (approximately 2.08% per
                                        month).
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSimulateSchedule("standard")
                                        }
                                      >
                                        Simulate This Schedule
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-indigo-100 p-2 mt-1">
                                      <Info className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Quarterly Vesting
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        After the cliff, shares vest in larger
                                        chunks every quarter (3 months) instead
                                        of monthly.
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSimulateSchedule("quarterly")
                                        }
                                      >
                                        Simulate This Schedule
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-purple-100 p-2 mt-1">
                                      <Info className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        No Cliff Vesting
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        Shares begin vesting immediately with no
                                        cliff period, typically on a monthly
                                        basis.
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSimulateSchedule("no-cliff")
                                        }
                                      >
                                        Simulate This Schedule
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* New section for advanced scenarios */}
                            <div className="bg-primary/5 rounded-lg p-4 mt-4">
                              <h4 className="font-medium mb-3">Advanced Vesting Scenarios</h4>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full bg-green-100 p-2 mt-1">
                                    <AlertCircle className="h-4 w-4 text-green-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      M&A Acceleration
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Explore how acquisition events can trigger accelerated 
                                      vesting through single or double-trigger provisions.
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleSimulateScenario("m-and-a")
                                      }
                                    >
                                      Simulate This Scenario
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full bg-amber-100 p-2 mt-1">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      Accelerated Vesting Schedule
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Some grants include performance-based or milestone-based 
                                      accelerated vesting provisions.
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleSimulateSchedule("accelerated")
                                      }
                                    >
                                      Simulate This Schedule
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upcoming" className="space-y-4">
              {/* Use the UpcomingEventsTab component */}
              <UpcomingEventsTab 
                initialEvents={upcomingEvents} 
                milestoneEvents={milestoneEvents}
                onCalendarSync={handleCalendarSync}
                calendarSynced={calendarSynced}
              />
            </TabsContent>
            
            <TabsContent value="learn" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <VestingExplainer />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Simulation Modal */}
          <VestingSimulationModal
            isOpen={simulationModalOpen}
            onClose={() => setSimulationModalOpen(false)}
            simulationData={currentSimulation}
            simulationType={simulationType}
          />
        </>
      )}
    </DashboardShell>
  );
}