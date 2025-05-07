"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { GrantsTable } from "@/components/grants-table";
import AuthLoading from "@/components/auth/AuthLoading";
import { calculateVestedShares } from "@/utils/calculations";
import EnhancedGrantsDashboard from "@/components/grants/enhanced-grants-dashboard";

export default function GrantsPage() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch grants
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
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [supabase]);

  const handleDeleteGrant = async (id) => {
    if (
      confirm(
        "Are you sure you want to delete this grant? This action cannot be undone."
      )
    ) {
      try {
        const { error } = await supabase
          .from("equity_grants")
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Update the local state by filtering out the deleted grant
        setGrants(grants.filter((grant) => grant.id !== id));
        toast.success("Grant deleted successfully");
      } catch (error) {
        console.error("Error deleting grant:", error);
        toast.error(error.message || "Failed to delete grant");
      }
    }
  };

  // Show loading state
  if (loading) {
    return <AuthLoading />;
  }

  // Format date string
  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

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
        onAddGrant={() => router.push("/dashboard/grants/add")}
        onViewGrant={(id) => router.push(`/dashboard/grants/${id}`)}
        onEditGrant={(id) => router.push(`/dashboard/grants/${id}/edit`)}
        onDeleteGrant={handleDeleteGrant}
      />
    </DashboardShell>
  );
}
