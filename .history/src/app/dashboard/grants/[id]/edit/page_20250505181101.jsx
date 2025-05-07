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
import AuthLoading from "@/components/auth/AuthLoading";

export default function EditGrantPage({ params }) {
  const router = useRouter();
  const [grant, setGrant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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
          setError("You do not have permission to edit this grant");
          setLoading(false);
          return;
        }

        setGrant(data);
      } catch (error) {
        console.error("Error fetching grant:", error);
        setError(error.message || "Failed to load grant");
      } finally {
        setLoading(false);
      }
    };

    fetchGrant();
  }, [supabase, params.id, router]);

  const handleUpdateGrant = async (updatedData) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("equity_grants")
        .update(updatedData)
        .eq("id", params.id)
        .select();

      if (error) throw error;

      // Show success toast
      toast.success("Grant updated successfully");

      // Redirect to the grants page
      router.push("/dashboard/grants");
      router.refresh();
    } catch (error) {
      console.error("Error updating grant:", error);
      toast.error(error.message || "Failed to update grant");
    } finally {
      setSaving(false);
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
          heading="Edit Grant"
          text="Update your equity grant details."
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/grants")}
          >
            Back
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

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Edit Grant"
        text="Update your equity grant details."
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/grants")}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
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
                  router.refresh();
                } catch (error) {
                  toast.error(error.message || "Failed to delete grant");
                }
              }
            }}
          >
            Delete
          </Button>
        </div>
      </DashboardHeader>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grant Details</CardTitle>
            <CardDescription>
              Update information about your equity grant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrantForm
              initialData={grant}
              onSubmit={handleUpdateGrant}
              isLoading={saving}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
