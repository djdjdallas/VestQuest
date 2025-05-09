"use client";

import { useState, useEffect } from "react";
import { format, addMonths, differenceInDays, formatDistance } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Download,
  Share2,
  Info,
  ChevronRight,
} from "lucide-react";

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { saveAs } from "file-saver";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import AuthLoading from "@/components/auth/AuthLoading";
import {
  calculateDetailedVesting,
  getUpcomingVestingEvents,
} from "@/utils/enhanced-vesting-calculations";

export default function UpcomingEventsPage() {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [timeframe, setTimeframe] = useState("6months");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  // Load grants and calculate upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
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

        // Extract unique companies for filtering
        const uniqueCompanies = [
          ...new Set((grantsData || []).map((grant) => grant.company_name)),
        ];
        setCompanies(uniqueCompanies);

        // Calculate upcoming events for all grants
        const events = [];
        let monthsAhead = getMonthsAhead(timeframe);

        // Process each grant to get upcoming events
        (grantsData || []).forEach((grant) => {
          const grantEvents = getUpcomingVestingEvents(grant, monthsAhead);

          events.push(
            ...grantEvents.map((event) => ({
              ...event,
              company: grant.company_name,
              grant_type: grant.grant_type,
              grant_id: grant.id,
              value: event.shares * (grant.current_fmv || 0),
              fmv: grant.current_fmv || 0,
            }))
          );
        });

        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingEvents(events);
      } catch (err) {
        console.error("Error fetching upcoming events:", err);
        setError(err.message);
        toast.error("Failed to load upcoming events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [supabase, timeframe]);

  // Get months ahead based on timeframe
  const getMonthsAhead = (timeframe) => {
    switch (timeframe) {
      case "3months":
        return 3;
      case "6months":
        return 6;
      case "1year":
        return 12;
      case "3years":
        return 36;
      default:
        return 6;
    }
  };

  // Filter events based on company selection
  const filteredEvents =
    companyFilter === "all"
      ? upcomingEvents
      : upcomingEvents.filter((event) => event.company === companyFilter);

  // Calculate upcoming value by month
  const calculateMonthlyValue = () => {
    const monthlyValue = {};

    filteredEvents.forEach((event) => {
      const monthYear = format(new Date(event.date), "yyyy-MM");
      if (!monthlyValue[monthYear]) {
        monthlyValue[monthYear] = 0;
      }
      monthlyValue[monthYear] += event.value || 0;
    });

    return monthlyValue;
  };

  const monthlyValue = calculateMonthlyValue();

  // Export events as CSV
  const handleExportEvents = () => {
    if (filteredEvents.length === 0) {
      toast.error("No events to export");
      return;
    }

    setExporting(true);
    try {
      // Create CSV content
      let csvContent =
        "Date,Company,Grant Type,Shares,Value,Days Until Event\n";

      filteredEvents.forEach((event) => {
        const date = format(new Date(event.date), "yyyy-MM-dd");
        const daysUntil = differenceInDays(new Date(event.date), new Date());

        csvContent += `${date},${event.company},${event.grant_type},`;
        csvContent += `${event.shares},${event.value.toFixed(
          2
        )},${daysUntil}\n`;
      });

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(
        blob,
        `upcoming-vesting-events-${format(new Date(), "yyyy-MM-dd")}.csv`
      );

      toast.success("Events exported successfully");
    } catch (err) {
      console.error("Error exporting events:", err);
      toast.error("Failed to export events");
    } finally {
      setExporting(false);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Upcoming Vesting Events"
        text="Track all your upcoming vesting events across your equity grants."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={handleExportEvents}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Events
          </Button>
          <Button asChild size="sm">
            <a href="/dashboard/vesting">
              <Calendar className="mr-2 h-4 w-4" />
              Vesting Timeline
            </a>
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
      ) : (
        <>
          {/* Filters and timeframe controls */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={timeframe === "3months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeframeChange("3months")}
                  >
                    3 Months
                  </Button>
                  <Button
                    variant={timeframe === "6months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeframeChange("6months")}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant={timeframe === "1year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeframeChange("1year")}
                  >
                    1 Year
                  </Button>
                  <Button
                    variant={timeframe === "3years" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeframeChange("3years")}
                  >
                    3 Years
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={companyFilter}
                    onValueChange={setCompanyFilter}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly summary cards */}
          <div className="grid gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Vesting Value By Month
                </CardTitle>
                <CardDescription>
                  Summary of vesting value for the upcoming{" "}
                  {timeframe === "3months"
                    ? "3 months"
                    : timeframe === "6months"
                    ? "6 months"
                    : timeframe === "1year"
                    ? "year"
                    : "3 years"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(monthlyValue).length > 0 ? (
                    Object.entries(monthlyValue).map(([monthYear, value]) => {
                      const [year, month] = monthYear.split("-");
                      const date = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        1
                      );

                      return (
                        <div
                          key={monthYear}
                          className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <h3 className="font-medium text-lg">
                            {format(date, "MMMM yyyy")}
                          </h3>
                          <p className="text-2xl font-bold mt-1 mb-2">
                            {formatCurrency(value)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {
                              filteredEvents.filter(
                                (e) =>
                                  format(new Date(e.date), "yyyy-MM") ===
                                  monthYear
                              ).length
                            }{" "}
                            vesting events
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-6 text-center">
                      <p className="text-muted-foreground">
                        No vesting events found in the selected timeframe.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>
                Detailed list of all upcoming vesting events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event, index) => {
                    const eventDate = new Date(event.date);
                    const daysUntil = differenceInDays(eventDate, new Date());
                    const timeUntil = formatDistance(eventDate, new Date(), {
                      addSuffix: true,
                    });

                    return (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-full p-3 ${
                              daysUntil <= 30
                                ? "bg-yellow-500/10"
                                : "bg-primary/10"
                            }`}
                          >
                            <Calendar
                              className={`h-5 w-5 ${
                                daysUntil <= 30
                                  ? "text-yellow-500"
                                  : "text-primary"
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {format(eventDate, "MMMM d, yyyy")}
                              </p>
                              <span className="text-sm px-2 py-0.5 rounded-full bg-muted">
                                {timeUntil}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1">
                              {event.company} - {event.grant_type}
                              {event.event ? ` - ${event.event}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="md:text-right">
                          <p className="font-medium">
                            {formatNumber(event.shares)} shares
                          </p>
                          <p className="text-sm text-green-600">
                            {formatCurrency(event.value)}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 ml-1 inline relative -top-[2px]" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>At ${event.fmv} per share</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No upcoming vesting events
                    {companyFilter !== "all" ? ` for ${companyFilter}` : ""}
                    in the next{" "}
                    {timeframe === "3months"
                      ? "3 months"
                      : timeframe === "6months"
                      ? "6 months"
                      : timeframe === "1year"
                      ? "year"
                      : "3 years"}
                    .
                  </p>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCompanyFilter("all")}
                    >
                      View All Companies
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            {filteredEvents.length > 0 && (
              <CardFooter className="border-t pt-6 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredEvents.length} events
                  {companyFilter !== "all" ? ` for ${companyFilter}` : ""}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportEvents}
                  disabled={exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export Data"}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Educational tip */}
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 mt-1">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Understanding Your Vesting Events
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your upcoming vesting events show when your equity will vest
                    in the future. This helps you plan for potential tax
                    implications and timing of exercising options.
                  </p>
                  <div className="text-sm mt-2">
                    <p className="mb-2">
                      <span className="font-medium">
                        Key things to consider:
                      </span>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>
                        For RSUs, vesting typically creates an immediate tax
                        obligation
                      </li>
                      <li>
                        For ISOs, vesting allows you to exercise, but doesn't
                        create a tax event until exercise
                      </li>
                      <li>
                        Consider your exercise strategy well before any
                        potential liquidity events
                      </li>
                      <li>
                        Planning ahead for taxes can help you avoid unexpected
                        liabilities
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/dashboard/scenarios">
                        Create Scenario
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
