// src/components/analytics/VestingTab.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import VestingForecastChart from "./VestingForecastChart";
import VestingValueChart from "./VestingValueChart";
import CumulativeVestingChart from "./CumulativeVestingChart";
import { VestingTimeline } from "@/components/vesting-timeline";
import { UpcomingEventsTab } from "@/components/upcoming-events";
import { formatCurrency, formatPercentage, formatNumber } from "@/utils/format-utils";
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  PieChartIcon, 
  Clock,
  Info, 
  Bell
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateDetailedVesting,
  getUpcomingVestingEvents,
} from "@/utils/enhanced-vesting-calculations";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Vesting Acceleration Rate calculation
 * Calculates the rate at which value is being added through vesting
 */
const calculateVestingAcceleration = (valueForecast) => {
  if (!valueForecast || valueForecast.length < 2) return { monthly: 0, annual: 0 };
  
  // Use only next 3 months for calculation to keep it relevant
  const relevantForecasts = valueForecast.slice(0, 3);
  const totalUpcoming = relevantForecasts.reduce((sum, item) => sum + item.value, 0);
  const monthlyRate = totalUpcoming / relevantForecasts.length;
  
  return {
    monthly: monthlyRate,
    annual: monthlyRate * 12
  };
};

/**
 * Calculate vesting completion percentage and remaining time
 */
const calculateVestingStatus = (analytics, grants) => {
  const totalShares = analytics.totalShares || 0;
  const vestedShares = analytics.vestedShares || 0;
  
  // Calculate percentage completed
  const percentageComplete = totalShares > 0 ? (vestedShares / totalShares) * 100 : 0;
  
  // Calculate remaining duration (find the latest vesting end date)
  const now = new Date();
  let latestEndDate = now;
  
  grants.forEach(grant => {
    if (grant.vesting_end_date) {
      const endDate = new Date(grant.vesting_end_date);
      if (endDate > latestEndDate) {
        latestEndDate = endDate;
      }
    }
  });
  
  // Calculate remaining months
  const remainingMonths = Math.max(
    0,
    Math.ceil((latestEndDate - now) / (1000 * 60 * 60 * 24 * 30.44))
  );
  
  return {
    percentageComplete,
    remainingMonths
  };
};

/**
 * Enhanced Vesting Forecast tab content
 * @param {Object} analytics - Analytics data object
 * @param {Array} grants - Equity grants
 */
export const VestingTab = ({ analytics, grants }) => {
  const [viewMode, setViewMode] = useState("forecast");
  const [enhancedGrants, setEnhancedGrants] = useState([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [milestoneEvents, setMilestoneEvents] = useState([]);
  const [nextMilestone, setNextMilestone] = useState(null);
  const supabase = createClient();
  
  // Process the grants with detailed vesting calculations
  useEffect(() => {
    if (grants && grants.length > 0) {
      const processedGrants = processGrants(grants);
      setEnhancedGrants(processedGrants);
      
      // Calculate totals and upcoming events
      calculateTotals(processedGrants);
    }
    
    // Check if calendar syncing has been done before
    const syncStatus = localStorage.getItem("vestingCalendarSynced");
    if (syncStatus === "true") {
      setCalendarSynced(true);
    } else {
      setShowCalendarPrompt(true);
    }
  }, [grants]);
  
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

    const allUpcomingEvents = [];
    const allMilestoneEvents = [];

    processedGrants.forEach((grant) => {
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

    setUpcomingEvents(allUpcomingEvents);
    setMilestoneEvents(allMilestoneEvents);
    
    // Set next milestone if available
    const now = new Date();
    const nextMilestone = allMilestoneEvents.find(event => new Date(event.date) > now);
    setNextMilestone(nextMilestone);
  };
  
  // Calculate additional vesting metrics
  const accelerationRates = calculateVestingAcceleration(analytics.valueForecast);
  const vestingStatus = calculateVestingStatus(analytics, grants);
  
  // Generate vesting completion timeline data
  const generateTimelineData = () => {
    const now = new Date();
    const data = [];
    
    // Add current point
    data.push({
      date: 'Current',
      vestedValue: analytics.currentValue || 0,
      projectedValue: analytics.currentValue || 0,
      vestedShares: analytics.vestedShares || 0
    });
    
    // Add future projections (quarterly)
    for (let i = 1; i <= 4; i++) {
      const projectedDate = new Date(now);
      projectedDate.setMonth(now.getMonth() + i * 3);
      
      // Simple projection based on acceleration rate
      const additionalValue = accelerationRates.monthly * i * 3;
      
      data.push({
        date: `Q${i}`,
        vestedValue: null,
        projectedValue: (analytics.currentValue || 0) + additionalValue,
      });
    }
    
    return data;
  };
  
  const timelineData = generateTimelineData();
  
  // Calculate projected total value at the end of vesting
  const projectedTotalValue = analytics.currentValue + 
    (accelerationRates.monthly * vestingStatus.remainingMonths);
    
  // Memoize metrics data
  const metricsData = useMemo(() => {
    const totalShares = analytics.totalShares || 0;
    const vestedShares = analytics.vestedShares || 0;
    
    const vestPercentage = totalShares > 0 
      ? ((vestedShares / totalShares) * 100).toFixed(1)
      : 0;
      
    return {
      totalShares,
      vestedShares,
      unvestedShares: totalShares - vestedShares,
      vestPercentage,
      currentValue: analytics.currentValue || 0
    };
  }, [analytics]);

  const handleCalendarSync = () => {
    // In a real implementation, this would integrate with the user's calendar
    // For now, we'll just simulate successful syncing
    toast.success("Vesting events synced to your calendar");
    setCalendarSynced(true);
    setShowCalendarPrompt(false);
    localStorage.setItem("vestingCalendarSynced", "true");
  };
    
  return (
    <div className="space-y-6">
      {/* Vesting Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
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
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Vesting Timeline</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="forecast">Vesting Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <VestingTimeline grants={enhancedGrants} />
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
        
        <TabsContent value="forecast" className="space-y-4">
          {/* Vesting Projection Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vesting Forecast</CardTitle>
              <CardDescription>
                Detailed charts showing vesting projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming Vesting</TabsTrigger>
                  <TabsTrigger value="value">Value Forecast</TabsTrigger>
                  <TabsTrigger value="cumulative">Cumulative View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  <VestingForecastChart 
                    data={analytics.vestingForecast || []} 
                    grants={grants || []} 
                  />
                </TabsContent>
                
                <TabsContent value="value">
                  <VestingValueChart 
                    data={analytics.valueForecast || []} 
                    grants={grants || []} 
                  />
                </TabsContent>
                
                <TabsContent value="cumulative">
                  <CumulativeVestingChart
                    forecastData={analytics.vestingForecast || []}
                    vestedShares={analytics.vestedShares || 0}
                    valueForecast={analytics.valueForecast || []}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VestingTab;