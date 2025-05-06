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

      {/* No grants state */}
      {grants.length === 0 && !error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No grants yet</h3>
              <p className="text-muted-foreground">
                Add your first equity grant to start tracking your vesting
                progress and value.
              </p>
              <Button asChild>
                <Link href="/dashboard/grants/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Grant
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
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
        <div className="grid gap-6">
          {/* Grants Cards View - Useful on mobile */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grants.map((grant) => (
              <Card key={grant.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-base font-medium">
                      {grant.company_name}
                    </CardTitle>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {grant.grant_type}
                    </span>
                  </div>
                  <CardDescription>
                    {grant.shares.toLocaleString()} shares • $
                    {grant.strike_price.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Vesting Progress
                        </span>
                        <span>{grant.vested_percent.toFixed(1)}%</span>
                      </div>
                      <Progress value={grant.vested_percent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Vested Shares
                        </p>
                        <p>{grant.vested_shares.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Current Value
                        </p>
                        <p>
                          $
                          {(
                            grant.vested_shares * grant.current_fmv
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs"
                      >
                        <Link href={`/dashboard/grants/${grant.id}`}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Details
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/grants/${grant.id}/edit`}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGrant(grant.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table View - Better for desktop */}
          <Card>
            <CardHeader>
              <CardTitle>All Equity Grants</CardTitle>
              <CardDescription>
                Detailed view of all your equity grants across companies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Company</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Shares</th>
                      <th className="text-left p-2 font-medium">
                        Strike Price
                      </th>
                      <th className="text-left p-2 font-medium">Grant Date</th>
                      <th className="text-left p-2 font-medium">
                        Vesting Status
                      </th>
                      <th className="text-right p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grants.map((grant) => (
                      <tr key={grant.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Link
                            href={`/dashboard/grants/${grant.id}`}
                            className="font-medium hover:underline"
                          >
                            {grant.company_name}
                          </Link>
                        </td>
                        <td className="p-2">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            {grant.grant_type}
                          </span>
                        </td>
                        <td className="p-2">{grant.shares.toLocaleString()}</td>
                        <td className="p-2">
                          ${grant.strike_price.toFixed(2)}
                        </td>
                        <td className="p-2">{formatDate(grant.grant_date)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={grant.vested_percent}
                              className="h-2 w-20"
                            />
                            <span className="text-xs text-muted-foreground">
                              {grant.vested_percent.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                            >
                              <Link href={`/dashboard/grants/${grant.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                            >
                              <Link href={`/dashboard/grants/${grant.id}/edit`}>
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-500"
                              onClick={() => handleDeleteGrant(grant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
