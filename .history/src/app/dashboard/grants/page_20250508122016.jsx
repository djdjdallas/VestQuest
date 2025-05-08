"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import AuthLoading from "@/components/auth/AuthLoading";
import { calculateVestedShares } from "@/utils/calculations";
import EnhancedGrantsDashboard from "@/components/grants/enhanced-grants-dashboard";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
export default function GrantsPage() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch grants
  const fetchGrants = useCallback(async () => {
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

      // Calculate vesting percentages for each grant
      const grantsWithVesting = data.map((grant) => {
        const vestedShares = calculateVestedShares(grant);
        const vestedPercent = (vestedShares / grant.shares) * 100;
        return {
          ...grant,
          vested_shares: vestedShares,
          vested_percent: vestedPercent,
        };
      });

      setGrants(grantsWithVesting || []);
    } catch (error) {
      console.error("Error fetching grants:", error);
      setError(error.message);
      toast.error("Failed to load grants. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  // Function to handle viewing a grant
  const handleViewGrant = useCallback(
    (id) => {
      router.push(`/dashboard/grants/${id}`);
    },
    [router]
  );

  // Function to handle editing a grant
  const handleEditGrant = useCallback(
    (id) => {
      router.push(`/dashboard/grants/${id}/edit`);
    },
    [router]
  );

  // Function to handle adding a new grant
  const handleAddGrant = useCallback(() => {
    router.push("/dashboard/grants/add");
  }, [router]);

  // Function to handle deleting a grant
  const handleDeleteGrant = useCallback(
    async (id) => {
      try {
        const { error } = await supabase
          .from("equity_grants")
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Update the local state by filtering out the deleted grant
        setGrants((prevGrants) =>
          prevGrants.filter((grant) => grant.id !== id)
        );

        // Show success toast notification
        toast.success("Grant deleted successfully");
      } catch (error) {
        console.error("Error deleting grant:", error);
        toast.error(error.message || "Failed to delete grant");
      }
    },
    [supabase]
  );

  // Export function for vesting schedule
  const handleExportVestingSchedule = useCallback((projectedData) => {
    try {
      // Create CSV content
      let csvContent =
        "Date,Month,Newly Vested Shares,Total Vested Shares,Vested Value\n";

      projectedData.forEach((month, index) => {
        const prevMonth =
          index > 0 ? projectedData[index - 1] : { vestedShares: 0 };
        const newlyVested = month.vestedShares - prevMonth.vestedShares;

        const date = new Date(month.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        csvContent += `${date},${month.month},${newlyVested},${month.vestedShares},${month.value}\n`;
      });

      // Create a blob and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "vesting_schedule.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show toast notification
      toast.success("Vesting schedule exported successfully");
    } catch (error) {
      console.error("Error exporting vesting schedule:", error);
      toast.error("Failed to export vesting schedule");
    }
  }, []);

  // Export function for grants data
  const handleExportGrantsData = useCallback(() => {
    try {
      // Create CSV content
      let csvContent =
        "Company,Type,Shares,Strike Price,Current FMV,Grant Date,Vesting Start,Vesting End,Vested %,Vested Shares\n";

      grants.forEach((grant) => {
        const vestedPercentFormatted =
          typeof grant.vested_percent === "number"
            ? grant.vested_percent.toFixed(2)
            : "0.00";

        csvContent += `${grant.company_name},${grant.grant_type},${
          grant.shares
        },${grant.strike_price},${grant.current_fmv},${new Date(
          grant.grant_date
        ).toLocaleDateString()},${new Date(
          grant.vesting_start_date
        ).toLocaleDateString()},${new Date(
          grant.vesting_end_date
        ).toLocaleDateString()},${vestedPercentFormatted},${
          grant.vested_shares || 0
        }\n`;
      });

      // Create a blob and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "equity_grants.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show toast notification
      toast.success("Equity grants exported successfully");
    } catch (error) {
      console.error("Error exporting grants data:", error);
      toast.error("Failed to export grants data");
    }
  }, [grants]);

  // Show loading state
  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Equity Grants"
        text="Manage all your equity grants in one place."
      >
        <Button asChild>
          <Link href="/dashboard/grants/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Grant
          </Link>
        </Button>
      </DashboardHeader>

      <EnhancedGrantsDashboard
        grants={grants}
        onAddGrant={handleAddGrant}
        onViewGrant={handleViewGrant}
        onEditGrant={handleEditGrant}
        onDeleteGrant={handleDeleteGrant}
        onExportVestingSchedule={handleExportVestingSchedule}
        onExportGrantsData={handleExportGrantsData}
      />
    </DashboardShell>
  );
}
