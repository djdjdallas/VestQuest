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

export function VestingTimeline() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sample data for vesting timeline
  const data = [
    {
      month: "Jan '22",
      "TechCorp ISO": 208,
      "TechCorp RSU": 0,
      "Previous Startup": 0,
    },
    {
      month: "Apr '22",
      "TechCorp ISO": 208,
      "TechCorp RSU": 0,
      "Previous Startup": 0,
    },
    {
      month: "Jul '22",
      "TechCorp ISO": 208,
      "TechCorp RSU": 0,
      "Previous Startup": 0,
    },
    {
      month: "Oct '22",
      "TechCorp ISO": 208,
      "TechCorp RSU": 0,
      "Previous Startup": 0,
    },
    {
      month: "Jan '23",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Apr '23",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Jul '23",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Oct '23",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Jan '24",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Apr '24",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Jul '24",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
    {
      month: "Oct '24",
      "TechCorp ISO": 208,
      "TechCorp RSU": 125,
      "Previous Startup": 0,
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
            <Bar dataKey="TechCorp ISO" stackId="a" fill="#0f56b3" />
            <Bar dataKey="TechCorp RSU" stackId="a" fill="#06b6d4" />
            <Bar dataKey="Previous Startup" stackId="a" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-medium">Upcoming Vesting Events</h3>
        <div className="space-y-2">
          {[
            { date: "Jun 15, 2023", shares: 208, type: "TechCorp ISO" },
            { date: "Jun 15, 2023", shares: 125, type: "TechCorp RSU" },
            { date: "Sep 15, 2023", shares: 208, type: "TechCorp ISO" },
            { date: "Sep 15, 2023", shares: 125, type: "TechCorp RSU" },
          ].map((event, i) => (
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
                  ${(event.shares * 30).toLocaleString()} at $30/share
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
