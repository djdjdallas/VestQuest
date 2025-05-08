"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { VestingProgressCard } from "@/components/vesting-progress-card";
import AuthLoading from "@/components/auth/AuthLoading";
import {
  calculateVestedShares,
  calculateExerciseCost,
  calculateCurrentValue,
  calculateVestingPercentage,
  calculateReturnPercentage,
} from "@/utils/calculations";

export default function GrantDetailsPage({ params }) {
  const router = useRouter();
  const [grant, setGrant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vestingDetails, setVestingDetails] = useState({
    vestedShares: 0,
    vestedPercent: 0,
    exerciseCost: 0,
    currentValue: 0,
    returnPercentage: 0,
  });
  const supabase = createClient();

  // Fetch the grant data
  useEffect(() => {
    const fetchGrant = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;

        // Verify that the grant belongs to the current user
        if (data.user_id !== user.id) {
          setError("You do not have permission to view this grant");
          setLoading(false);
          return;
        }

        // Ensure all data has proper types
        const parsedGrant = {
          ...data,
          shares: Number(data.shares) || 0,
          strike_price: Number(data.strike_price) || 0,
          current_fmv: Number(data.current_fmv) || 0,
        };

        setGrant(parsedGrant);

        // Calculate vesting details
        const vestedShares = calculateVestedShares(parsedGrant);
        const vestedPercent = calculateVestingPercentage(
          vestedShares,
          parsedGrant.shares
        );
        const exerciseCost = calculateExerciseCost(
          vestedShares,
          parsedGrant.strike_price
        );
        const currentValue = calculateCurrentValue(
          vestedShares,
          parsedGrant.current_fmv
        );
        const returnPercentage = calculateReturnPercentage(
          parsedGrant.current_fmv,
          parsedGrant.strike_price
        );

        setVestingDetails({
          vestedShares,
          vestedPercent,
          exerciseCost,
          currentValue,
          returnPercentage,
        });

        console.log("Vesting calculation details:", {
          grant: parsedGrant,
          vestedShares,
          vestedPercent,
          exerciseCost,
          currentValue,
          returnPercentage,
        });
      } catch (error) {
        console.error("Error fetching grant:", error);
        setError(error.message || "Failed to load grant details");
      } finally {
        setLoading(false);
      }
    };

    fetchGrant();
  }, [supabase, params.id, router]);

  const handleDeleteGrant = async () => {
    if (
      confirm(
        "Are you sure you want to delete this grant? This action cannot be undone."
      )
    ) {
      try {
        const { error } = await supabase
          .from("equity_grants")
          .delete()
          .eq("id", params.id);

        if (error) throw error;

        toast.success("Grant deleted successfully");
        router.push("/dashboard/grants");
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

  // Show error state
  if (error) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Grant Details"
          text="View your equity grant details."
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/grants")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grants
          </Button>
        </DashboardHeader>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => router.push("/dashboard/grants")}>
                Go back to Grants
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  if (!grant) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Grant Details"
          text="View your equity grant details."
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/grants")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grants
          </Button>
        </DashboardHeader>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p>Grant not found</p>
              <Button onClick={() => router.push("/dashboard/grants")}>
                Go back to Grants
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading={grant.company_name}
        text={`${grant.grant_type} grant with ${formatNumber(
          grant.shares
        )} shares at $${grant.strike_price}`}
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/grants")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/grants/${grant.id}/edit`}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Grant
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteGrant}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Grant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(grant.shares)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Vested Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(vestingDetails.vestedShares)}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress
                    value={vestingDetails.vestedPercent || 0}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {(vestingDetails.vestedPercent || 0).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(vestingDetails.currentValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  At ${grant.current_fmv.toFixed(2)} per share
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Exercise Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(vestingDetails.exerciseCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  For vested shares
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grant Details</CardTitle>
              <CardDescription>
                Information about your {grant.grant_type} grant at{" "}
                {grant.company_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Grant Type
                  </h3>
                  <p className="flex items-center mt-0.5">
                    <FileText className="mr-1 h-4 w-4 text-primary" />
                    {grant.grant_type}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Grant Date
                  </h3>
                  <p className="flex items-center mt-0.5">
                    <Calendar className="mr-1 h-4 w-4 text-primary" />
                    {formatDate(grant.grant_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Strike Price
                  </h3>
                  <p className="flex items-center mt-0.5">
                    <DollarSign className="mr-1 h-4 w-4 text-primary" />$
                    {grant.strike_price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Current FMV
                  </h3>
                  <p className="flex items-center mt-0.5">
                    <DollarSign className="mr-1 h-4 w-4 text-primary" />$
                    {grant.current_fmv.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Vesting Schedule
                  </h3>
                  <p className="flex items-center mt-0.5">
                    <Clock className="mr-1 h-4 w-4 text-primary" />
                    {grant.vesting_schedule
                      ? grant.vesting_schedule.charAt(0).toUpperCase() +
                        grant.vesting_schedule.slice(1)
                      : "Monthly"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Potential Return
                  </h3>
                  <p className="flex items-center mt-0.5">
                    <Percent className="mr-1 h-4 w-4 text-primary" />
                    {vestingDetails.returnPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Vesting Timeline
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Start: {formatDate(grant.vesting_start_date)}</span>
                    <span>End: {formatDate(grant.vesting_end_date)}</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${vestingDetails.vestedPercent || 0}%` }}
                    ></div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cliff: {formatDate(grant.vesting_cliff_date)}
                    </p>
                  </div>
                </div>
              </div>

              {grant.notes && (
                <div className="pt-4 border-t mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Notes
                  </h3>
                  <p className="text-sm">{grant.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vesting Progress</CardTitle>
              <CardDescription>
                Visual breakdown of your vesting status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VestingProgressCard
                vestedShares={vestingDetails.vestedShares}
                unvestedShares={grant.shares - vestingDetails.vestedShares}
                vestedPercent={vestingDetails.vestedPercent}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/scenarios/add?grant=${grant.id}`}>
                  Create Exit Scenario
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/grants/${grant.id}/edit`}>
                  Update Grant
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
