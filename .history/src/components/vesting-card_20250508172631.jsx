import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/utils/formatters";

export function VestingCard({ upcomingEvents = [], maxItems = 3 }) {
  // The component accepts upcoming events as a prop with a default empty array
  // This way, the parent component can fetch the data and pass it down

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Vesting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No upcoming vesting events</p>
            <Link
              href="/dashboard/grants/add"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Add your first grant
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limit the number of events shown
  const displayedEvents = upcomingEvents.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Upcoming Vesting
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                    {formatCurrency(event.value || event.shares * event.fmv)}
                  </p>
                </div>
              </div>
            );
          })}

          {upcomingEvents.length > maxItems && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground mb-2">
                +{upcomingEvents.length - maxItems} more events
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
      </CardContent>
    </Card>
  );
}
