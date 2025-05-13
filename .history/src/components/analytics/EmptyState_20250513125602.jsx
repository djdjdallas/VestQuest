// src/components/analytics/EmptyState.jsx

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";

/**
 * Empty state component displayed when no grants exist
 */
export const EmptyState = () => {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analytics"
        text="Analyze your equity portfolio performance."
      >
        <Button asChild>
          <a href="/dashboard/grants/add">Add First Grant</a>
        </Button>
      </DashboardHeader>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-medium">No analytics data available</h3>
            <p className="text-muted-foreground">
              Add your first equity grant to start seeing analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
};

export default EmptyState;
