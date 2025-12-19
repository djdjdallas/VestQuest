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
import { ScenarioForm } from "@/components/scenario/scenario-form";
import AuthLoading from "@/components/auth/AuthLoading";

export default function EditScenarioPage({ params }) {
  const router = useRouter();
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch the scenario data
  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("scenarios")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;

        // Verify that the scenario belongs to the current user
        if (data.user_id !== user.id) {
          setError("You do not have permission to edit this scenario");
          setLoading(false);
          return;
        }

        setScenario(data);
      } catch (error) {
        setError(error.message || "Failed to load scenario");
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, [supabase, params.id, router]);

  const handleUpdateScenario = async (updatedData) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("scenarios")
        .update(updatedData)
        .eq("id", params.id)
        .select();

      if (error) throw error;

      // Show success toast
      toast.success("Scenario updated successfully");

      // Redirect to the scenarios page
      router.push("/dashboard/scenarios");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to update scenario");
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
          heading="Edit Scenario"
          text="Update your equity exit scenario."
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/scenarios")}
          >
            Back
          </Button>
        </DashboardHeader>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => router.push("/dashboard/scenarios")}>
                Go back to Scenarios
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
        heading="Edit Scenario"
        text="Update your equity exit scenario."
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/scenarios")}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this scenario?")) {
                try {
                  const { error } = await supabase
                    .from("scenarios")
                    .delete()
                    .eq("id", params.id);

                  if (error) throw error;

                  toast.success("Scenario deleted successfully");
                  router.push("/dashboard/scenarios");
                  router.refresh();
                } catch (error) {
                  toast.error(error.message || "Failed to delete scenario");
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
            <CardTitle>Scenario Details</CardTitle>
            <CardDescription>
              Update your scenario to model different exit strategies for your
              equity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScenarioForm
              initialData={scenario}
              onSubmit={handleUpdateScenario}
              isLoading={saving}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
