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

      // Add the user ID to the grant data
      const dataWithUserId = {
        ...grantData,
        user_id: user.id,
      };

      // Insert the grant into the database
      const { data, error } = await supabase
        .from("equity_grants")
        .insert(dataWithUserId)
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
