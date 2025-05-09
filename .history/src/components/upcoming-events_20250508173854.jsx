// src/components/upcoming-events.jsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Download } from "lucide-react";
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
import { getUpcomingVestingEvents } from "@/utils/enhanced-vesting-calculations";

export function UpcomingEventsTab() {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
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
            allUpcomingEvents.push({
              ...event,
              company: grant.company_name,
              grant_type: grant.grant_type,
              grant_id: grant.id,
              value: event.shares * (grant.current_fmv || 0),
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
  }, [supabase]);

  const handleExportData = async () => {
    setExporting(true);
    try {
      if (upcomingEvents.length === 0) {
        toast.error("No events to export");
        return;
      }

      // Create CSV content
      let csvContent = "Date,Company,Grant Type,Shares,Value\n";

      upcomingEvents.forEach((event) => {
        csvContent += `${format(new Date(event.date), "yyyy-MM-dd")},`;
        csvContent += `${event.company},${event.grant_type},`;
        csvContent += `${event.shares},${event.value}\n`;
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
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Vesting Events</CardTitle>
        <CardDescription>
          All your upcoming vesting events across all grants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {format(new Date(event.date), "MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.company} - {event.grant_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {event.shares.toLocaleString()} shares
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${(event.value || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No upcoming vesting events. All your shares have fully vested or
              you haven't reached your cliff yet.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
          disabled={exporting || upcomingEvents.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export All Events
        </Button>
      </CardFooter>
    </Card>
  );
}
