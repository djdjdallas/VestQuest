"use client";

import { useState } from "react";
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

export default function AddGrantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreateGrant = async (grantData) => {
    setLoading(true);
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a grant");
      }

      // Ensure all numeric values are converted to numbers
      const processedData = {
        ...grantData,
        shares: Number(grantData.shares),
        strike_price: Number(grantData.strike_price),
        current_fmv: Number(grantData.current_fmv),
        user_id: user.id,
      };

      // Validate numbers to prevent NaN
      if (isNaN(processedData.shares) || processedData.shares <= 0) {
        throw new Error("Number of shares must be a positive number");
      }

      if (isNaN(processedData.strike_price) || processedData.strike_price < 0) {
        throw new Error("Strike price must be a non-negative number");
      }

      if (isNaN(processedData.current_fmv) || processedData.current_fmv < 0) {
        throw new Error("Current FMV must be a non-negative number");
      }

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
