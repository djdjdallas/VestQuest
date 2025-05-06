"use client";

import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { VestingTimeline } from "@/components/vesting-timeline";
import AuthLoading from "@/components/auth/AuthLoading";

export default function VestingPage() {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchGrants = async () => {
      try {
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
      } catch (err) {
        console.error("Error fetching grants:", err);
        setError(err.message);
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
      // Fetch all vesting events from calculated values
      const vestingData = [];

      for (const grant of grants) {
        const {
          id,
          company_name,
          grant_type,
          shares,
          vesting_start_date,
          vesting_end_date,
          vesting_schedule,
        } = grant;

        // Determine interval based on vesting schedule
        let intervalMonths;
        switch (vesting_schedule) {
          case "monthly":
            intervalMonths = 1;
            break;
          case "quarterly":
            intervalMonths = 3;
            break;
          case "yearly":
            intervalMonths = 12;
            break;
          default:
            intervalMonths = 1;
        }

        let currentDate = new Date(vesting_start_date);
        const endDate = new Date(vesting_end_date);

        // Add entry for each vesting event
        while (currentDate <= endDate) {
          // Calculate vested shares for this period
          // This is simplified - in a real app you'd use your vesting calculation logic
          const vestedShares = Math.floor(
            (shares /
              ((endDate - new Date(vesting_start_date)) /
                (30.44 * 24 * 60 * 60 * 1000))) *
              intervalMonths
          );

          vestingData.push({
            company: company_name,
            grant_type,
            vesting_date: format(currentDate, "yyyy-MM-dd"),
            shares: vestedShares,
            value: vestedShares * grant.current_fmv,
          });

          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + intervalMonths);
        }
      }

      // Create CSV content
      let csvContent = "Company,Grant Type,Vesting Date,Shares,Value\n";
      vestingData.forEach((event) => {
        csvContent += `${event.company},${event.grant_type},${event.vesting_date},${event.shares},${event.value}\n`;
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

  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Vesting Timeline"
        text="Track your past and future vesting events."
      >
        <Button
          onClick={handleExportData}
          disabled={exporting || grants.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export Data"}
        </Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Vesting Schedule</CardTitle>
          <CardDescription>
            Monthly breakdown of your vesting schedule across all grants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VestingTimeline />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
