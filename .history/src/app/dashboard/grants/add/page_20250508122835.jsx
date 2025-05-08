"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
import { GrantForm } from "@/components/grants/grant-form";
import { calculateVestedShares } from "@/utils/calculations";
import AuthLoading from "@/components/auth/AuthLoading";

export default function AddGrantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const supabase = createClient();

  // Check user authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        setUser(user);

        if (!user) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast.error("Authentication error. Please log in again.");
        router.push("/login");
      } finally {
        setUserLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleCreateGrant = async (grantData) => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error("You must be logged in to create a grant");
      }

      // Ensure all dates are valid
      const currentDate = new Date();
      const grantDate = grantData.grant_date
        ? new Date(grantData.grant_date)
        : currentDate;
      const vestingStartDate = grantData.vesting_start_date
        ? new Date(grantData.vesting_start_date)
        : grantDate;

      // Ensure cliff date is valid
      let cliffDate = null;
      if (grantData.vesting_cliff_date) {
        cliffDate = new Date(grantData.vesting_cliff_date);
      } else {
        // Default to 1 year after vesting start
        cliffDate = new Date(vestingStartDate);
        cliffDate.setFullYear(cliffDate.getFullYear() + 1);
      }

      // Ensure vesting end date is valid
      let vestingEndDate = null;
      if (grantData.vesting_end_date) {
        vestingEndDate = new Date(grantData.vesting_end_date);
      } else {
        // Default to 4 years after vesting start
        vestingEndDate = new Date(vestingStartDate);
        vestingEndDate.setFullYear(vestingEndDate.getFullYear() + 4);
      }

      // Format dates as ISO strings
      const formattedGrantDate = grantDate.toISOString();
      const formattedVestingStartDate = vestingStartDate.toISOString();
      const formattedCliffDate = cliffDate.toISOString();
      const formattedVestingEndDate = vestingEndDate.toISOString();

      // Ensure all numeric values are converted to numbers
      const shares = Number(grantData.shares) || 0;
      const strikePrice = Number(grantData.strike_price) || 0;
      const currentFmv = Number(grantData.current_fmv) || 0;

      // Validate numbers to prevent NaN
      if (isNaN(shares) || shares <= 0) {
        throw new Error("Number of shares must be a positive number");
      }

      if (isNaN(strikePrice) || strikePrice < 0) {
        throw new Error("Strike price must be a non-negative number");
      }

      if (isNaN(currentFmv) || currentFmv < 0) {
        throw new Error("Current FMV must be a non-negative number");
      }

      // Prepare processed data with defaults for any missing fields
      const processedData = {
        ...grantData,
        company_name: grantData.company_name || "Untitled Company",
        grant_type: grantData.grant_type || "ISO",
        shares: shares,
        strike_price: strikePrice,
        current_fmv: currentFmv,
        grant_date: formattedGrantDate,
        vesting_start_date: formattedVestingStartDate,
        vesting_cliff_date: formattedCliffDate,
        vesting_end_date: formattedVestingEndDate,
        vesting_schedule: grantData.vesting_schedule || "monthly",
        user_id: user.id,
      };

      // Pre-calculate vested shares to verify data is correct
      const testGrant = {
        ...processedData,
        shares: shares,
        vesting_start_date: formattedVestingStartDate,
        vesting_cliff_date: formattedCliffDate,
        vesting_end_date: formattedVestingEndDate,
      };

      const vestedShares = calculateVestedShares(testGrant);

      // Console log to verify calculations are working
      console.log("Pre-submission verification:", {
        processedData,
        calculatedVestedShares: vestedShares,
      });

      // Insert the grant into the database
      const { data, error } = await supabase
        .from("equity_grants")
        .insert(processedData)
        .select();

      if (error) throw error;

      // Show success toast
      toast.success("Equity grant created successfully");

      // Redirect to the grants page
      router.push("/dashboard/grants");
      router.refresh();
    } catch (error) {
      console.error("Error creating grant:", error);
      toast.error(error.message || "Failed to create grant");
    } finally {
      setLoading(false);
    }
  };

  // Show loading if checking authentication
  if (userLoading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Add Equity Grant"
        text="Record a new equity grant to track and analyze in your portfolio."
      >
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/grants")}
        >
          Cancel
        </Button>
      </DashboardHeader>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grant Details</CardTitle>
            <CardDescription>
              Enter information about your equity grant to track vesting and
              value over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrantForm onSubmit={handleCreateGrant} isLoading={loading} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
