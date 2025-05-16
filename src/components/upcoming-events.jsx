// src/components/upcoming-events.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, isSameMonth } from "date-fns";
import { Clock, Download, Calendar, Bell, Star, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getUpcomingVestingEvents } from "@/utils/enhanced-vesting-calculations";
import { formatCurrency, formatNumber } from "@/utils/format-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UpcomingEventsTab({ 
  initialEvents = [], 
  milestoneEvents = [],
  onCalendarSync = () => {},
  calendarSynced = false
}) {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState(initialEvents);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState("all"); // all, milestones, thisMonth, next3Months
  const [expanded, setExpanded] = useState({});
  const supabase = createClient();

  useEffect(() => {
    if (initialEvents.length > 0) {
      setUpcomingEvents(initialEvents);
      setLoading(false);
      return;
    }

    const fetchGrants = async () => {
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

        setGrants(data || []);

        // Process upcoming events
        const allUpcomingEvents = [];
        data.forEach((grant) => {
          const events = getUpcomingVestingEvents(grant, 12); // Look ahead 12 months
          events.forEach((event) => {
            // Calculate percentage of total grant
            const percentageOfTotal = ((event.shares / grant.shares) * 100).toFixed(1);
            
            // Determine if this is a milestone event (cliff, 25%, 50%, 75%, 100%)
            const isMilestone = 
              percentageOfTotal >= 25 || // 25%, 50%, 75%, 100% milestones
              event.event === "Cliff Vesting" || 
              event.event === "Final Vesting";
            
            allUpcomingEvents.push({
              ...event,
              company: grant.company_name,
              grant_type: grant.grant_type,
              grant_id: grant.id,
              value: event.shares * (grant.current_fmv || 0),
              percentageOfTotal: parseFloat(percentageOfTotal),
              isMilestone
            });
          });
        });

        // Sort upcoming events by date
        allUpcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingEvents(allUpcomingEvents);
      } catch (err) {
        console.error("Error fetching grants:", err);
        toast.error("Failed to load vesting data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [supabase, initialEvents]);

  const handleExportData = async () => {
    setExporting(true);
    try {
      if (upcomingEvents.length === 0) {
        toast.error("No events to export");
        return;
      }

      // Create CSV content
      let csvContent = "Date,Company,Grant Type,Shares,Value,Percentage of Grant,Event Type,Milestone\n";

      upcomingEvents.forEach((event) => {
        csvContent += `${format(new Date(event.date), "yyyy-MM-dd")},`;
        csvContent += `${event.company},${event.grant_type},`;
        csvContent += `${event.shares},${event.value},`;
        csvContent += `${event.percentageOfTotal || 0}%,`;
        csvContent += `${event.event || "Regular Vesting"},`;
        csvContent += `${event.isMilestone ? "Yes" : "No"}\n`;
      });

      // Convert to Blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `upcoming-vesting-events-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Events exported successfully");
    } catch (err) {
      console.error("Error exporting events:", err);
      toast.error("Failed to export events");
    } finally {
      setExporting(false);
    }
  };

  const handleSetReminder = (event) => {
    // In a real implementation, this would integrate with the user's calendar
    // For now, just simulate the action
    toast.success(`Reminder set for ${format(new Date(event.date), "MMMM d, yyyy")}`);
    onCalendarSync();
  };

  const toggleExpand = (index) => {
    setExpanded(prev => ({
      ...prev, 
      [index]: !prev[index]
    }));
  };

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    const now = new Date();
    
    if (filter === "all") {
      return upcomingEvents;
    } else if (filter === "milestones") {
      return upcomingEvents.filter(event => event.isMilestone);
    } else if (filter === "thisMonth") {
      return upcomingEvents.filter(event => isSameMonth(new Date(event.date), now));
    } else if (filter === "next3Months") {
      return upcomingEvents.filter(event => {
        const eventDate = new Date(event.date);
        const daysDiff = differenceInDays(eventDate, now);
        return daysDiff >= 0 && daysDiff <= 90;
      });
    }
    
    return upcomingEvents;
  }, [upcomingEvents, filter]);
  
  // Group events by month for calendar view
  const eventsByMonth = useMemo(() => {
    const groupedEvents = {};
    
    filteredEvents.forEach(event => {
      const monthKey = format(new Date(event.date), "yyyy-MM");
      const monthName = format(new Date(event.date), "MMMM yyyy");
      
      if (!groupedEvents[monthKey]) {
        groupedEvents[monthKey] = {
          month: monthName,
          events: []
        };
      }
      
      groupedEvents[monthKey].events.push(event);
    });
    
    // Convert to array and sort by date
    return Object.values(groupedEvents).sort((a, b) => {
      return new Date(a.events[0].date) - new Date(b.events[0].date);
    });
  }, [filteredEvents]);

  // Calculate event summary stats
  const eventStats = useMemo(() => {
    const totalEvents = upcomingEvents.length;
    const totalValue = upcomingEvents.reduce((sum, event) => sum + (event.value || 0), 0);
    const totalShares = upcomingEvents.reduce((sum, event) => sum + (event.shares || 0), 0);
    const milestoneCount = upcomingEvents.filter(event => event.isMilestone).length;
    
    return {
      totalEvents,
      totalValue,
      totalShares,
      milestoneCount
    };
  }, [upcomingEvents]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats at the top */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{eventStats.totalEvents}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm text-muted-foreground">Total Shares</p>
              <p className="text-2xl font-bold">{formatNumber(eventStats.totalShares)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(eventStats.totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm text-muted-foreground">Milestone Events</p>
              <p className="text-2xl font-bold">{eventStats.milestoneCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <div>
          <h2 className="text-lg font-medium">Upcoming Vesting Events</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage your vesting schedule for the next 12 months
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter Events</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  <div className={`flex items-center ${filter === "all" ? "text-primary font-medium" : ""}`}>
                    {filter === "all" && <ChevronRight className="mr-1 h-4 w-4" />}
                    All Events
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("milestones")}>
                  <div className={`flex items-center ${filter === "milestones" ? "text-primary font-medium" : ""}`}>
                    {filter === "milestones" && <ChevronRight className="mr-1 h-4 w-4" />}
                    Milestone Events Only
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("thisMonth")}>
                  <div className={`flex items-center ${filter === "thisMonth" ? "text-primary font-medium" : ""}`}>
                    {filter === "thisMonth" && <ChevronRight className="mr-1 h-4 w-4" />}
                    This Month
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("next3Months")}>
                  <div className={`flex items-center ${filter === "next3Months" ? "text-primary font-medium" : ""}`}>
                    {filter === "next3Months" && <ChevronRight className="mr-1 h-4 w-4" />}
                    Next 3 Months
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!calendarSynced && (
            <Button variant="outline" size="sm" onClick={onCalendarSync}>
              <Calendar className="mr-2 h-4 w-4" />
              Sync All to Calendar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={exporting || filteredEvents.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`flex flex-col border rounded-lg transition-colors ${event.isMilestone ? "border-primary/30 bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => toggleExpand(index)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`rounded-md p-2 ${event.isMilestone ? "bg-primary/20" : "bg-muted"}`}>
                            <Clock className={`h-5 w-5 ${event.isMilestone ? "text-primary" : ""}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {format(new Date(event.date), "MMMM d, yyyy")}
                              </p>
                              {event.isMilestone && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  {event.event === "Cliff Vesting" 
                                    ? "Cliff" 
                                    : event.event === "Final Vesting" 
                                    ? "Final" 
                                    : `${event.percentageOfTotal}%`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.company} - {event.grant_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">
                              {formatNumber(event.shares)} shares
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(event.value || 0)}
                            </p>
                          </div>
                          <ChevronDown className={`h-5 w-5 transition-transform ${expanded[index] ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      
                      {expanded[index] && (
                        <div className="px-4 pb-4 pt-0 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Event</span>
                                <span className="text-sm font-medium">{event.event || "Regular Vesting"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Days Until Vesting</span>
                                <span className="text-sm font-medium">
                                  {differenceInDays(new Date(event.date), new Date())}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Percentage of Grant</span>
                                <span className="text-sm font-medium">{event.percentageOfTotal}%</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Shares</span>
                                <span className="text-sm font-medium">{formatNumber(event.shares)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Value</span>
                                <span className="text-sm font-medium">{formatCurrency(event.value)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Actions</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSetReminder(event)}
                                >
                                  <Bell className="mr-2 h-3 w-3" />
                                  Set Reminder
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No upcoming vesting events found with current filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {eventsByMonth.length > 0 ? (
                <div className="space-y-8">
                  {eventsByMonth.map((monthData, monthIndex) => (
                    <div key={monthIndex} className="space-y-2">
                      <h3 className="text-lg font-medium border-b pb-2">{monthData.month}</h3>
                      <div className="space-y-3 pl-2">
                        {monthData.events.map((event, eventIndex) => (
                          <div 
                            key={eventIndex}
                            className={`flex items-center justify-between p-3 rounded-md ${event.isMilestone ? "bg-primary/5" : "hover:bg-muted/50"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-center min-w-12">
                                <div className="text-sm font-medium">{format(new Date(event.date), "EEE")}</div>
                                <div className="text-xl">{format(new Date(event.date), "d")}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{event.company}</p>
                                  {event.isMilestone && (
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                      {event.event === "Cliff Vesting" 
                                        ? "Cliff" 
                                        : event.event === "Final Vesting" 
                                        ? "Final" 
                                        : `${event.percentageOfTotal}%`}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {event.grant_type}: {formatNumber(event.shares)} shares
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(event.value)}</div>
                                <div className="text-xs text-muted-foreground">{event.percentageOfTotal}% of grant</div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleSetReminder(event)}
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No upcoming vesting events found with current filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {milestoneEvents.length > 0 ? (
                <div className="space-y-4">
                  {milestoneEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg border-primary/30 bg-primary/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-md bg-primary/20 p-2">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {format(new Date(event.date), "MMMM d, yyyy")}
                            </p>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {event.event === "Cliff Vesting" 
                                ? "Cliff" 
                                : event.event === "Final Vesting" 
                                ? "Final Vesting" 
                                : `${event.percentageOfTotal}% Milestone`}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            {event.company} - {event.grant_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {formatNumber(event.shares)} shares
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(event.value || 0)}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSetReminder(event)}
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          Set Reminder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No milestone vesting events found for the next 12 months.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}