"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/sonner";

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

export default function AddScenarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreateScenario = async (scenarioData) => {
    setLoading(true);
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a scenario");
      }

      // Add the user ID to the scenario data
      const dataWithUserId = {
        ...scenarioData,
        user_id: user.id,
      };

      // Insert the scenario into the database
      const { data, error } = await supabase
        .from("scenarios")
        .insert(dataWithUserId)
        .select();

      if (error) throw error;

      // Show success toast
      toast.success("Scenario created successfully");

      // Redirect to the scenarios page
      router.push("/dashboard/scenarios");
      router.refresh();
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast.error(error.message || "Failed to create scenario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Scenario"
        text="Add a new equity exit scenario to compare different outcomes."
      >
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/scenarios")}
        >
          Cancel
        </Button>
      </DashboardHeader>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scenario Details</CardTitle>
            <CardDescription>
              Create a new scenario to model different exit strategies for your
              equity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScenarioForm onSubmit={handleCreateScenario} isLoading={loading} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
