"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  CardFooter,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { ScenarioForm } from "@/components/scenario/ScenarioForm";
import { useGrants } from "@/hooks/useGrants";
import { format } from "date-fns";
import { calculateScenarioResult } from "@/utils/calculations";
import { InfoIcon, ArrowLeft } from "lucide-react";
import AuthLoading from "@/components/auth/AuthLoading";

export default function AddScenarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const supabase = createClient();
  const { grants, loading: grantsLoading } = useGrants();

  // Get default values for the form based on available grants - memoized to prevent recalculation
  const defaultValues = useMemo(() => {
    const defaultGrant = grants?.length > 0 ? grants[0] : null;

    const values = {
      name: defaultGrant
        ? `${defaultGrant.company_name} Exit at $${(
            defaultGrant.current_fmv * 3
          ).toFixed(2)}`
        : "New Exit Scenario",
      description: "",
      exit_type: "IPO",
      exit_date: format(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      share_price: defaultGrant ? defaultGrant.current_fmv * 3 : 10,
      grant_id: defaultGrant ? defaultGrant.id : "",
      shares_included: defaultGrant ? defaultGrant.shares : 1000,
    };

    return values;
  }, [grants]);

  // Handle preview calculations - use useCallback to prevent recreation on each render
  const handlePreview = useCallback(
    (formData) => {
      try {
        if (!formData.grant_id) {
          setPreviewData(null);
          return;
        }

        const selectedGrant = grants?.find((g) => g.id === formData.grant_id);

        if (!selectedGrant) {
          setPreviewData(null);
          return;
        }

        const result = calculateScenarioResult(
          selectedGrant,
          formData.share_price,
          formData.shares_included,
          formData.name
        );

        setPreviewData(result);
      } catch (err) {
        setPreviewData(null);
      }
    },
    [grants]
  );

  // Handle creating a new scenario - use useCallback to prevent recreation on each render
  const handleCreateScenario = useCallback(
    async (scenarioData) => {
      setLoading(true);
      try {
        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("You must be logged in to create a scenario");
        }

        // Ensure numeric values are stored as numbers
        const processedData = {
          ...scenarioData,
          share_price: parseFloat(scenarioData.share_price),
          shares_included: parseInt(scenarioData.shares_included),
          user_id: user.id,
          created_at: new Date().toISOString(),
        };

        // If we have calculated a preview, include those calculated values
        if (previewData) {
          processedData.gross_proceeds = previewData.gross_proceeds;
          processedData.exercise_cost = previewData.exercise_cost;
          processedData.tax_liability = previewData.tax_liability;
          processedData.net_proceeds = previewData.net_proceeds;
          processedData.roi_percentage = previewData.roi_percentage;
          processedData.effective_tax_rate =
            previewData.effective_tax_rate || 0;
        }

        // Insert the scenario into the database
        const { data, error } = await supabase
          .from("scenarios")
          .insert(processedData)
          .select();

        if (error) throw error;

        // Show success toast
        toast.success("Scenario created successfully");

        // Redirect to the scenario details page
        router.push(`/dashboard/scenarios/${data[0].id}`);
      } catch (error) {
        toast.error(error.message || "Failed to create scenario");
      } finally {
        setLoading(false);
      }
    },
    [previewData, router, supabase]
  );

  // Always define useMemo hook, regardless of loading state
  const previewCardContent = useMemo(() => {
    if (grantsLoading) {
      return <AuthLoading />;
    }
    
    if (!previewData) {
      return (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <InfoIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {grants?.length > 0
                ? "Select a grant and enter scenario details to see a preview"
                : "No grants found. Add a grant first to create detailed scenarios."}
            </p>
            {(!grants || grants.length === 0) && (
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/grants/add")}
              >
                Add Grant
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Estimated outcome based on current inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Gross Proceeds</div>
            <div className="text-xl font-medium">
              ${previewData.gross_proceeds?.toLocaleString() || "0"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Exercise Cost</div>
              <div className="text-md text-red-500">
                -${previewData.exercise_cost?.toLocaleString() || "0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tax Liability</div>
              <div className="text-md text-red-500">
                -${previewData.tax_liability?.toLocaleString() || "0"}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">Net Proceeds</div>
            <div className="text-xl font-medium text-green-600">
              ${previewData.net_proceeds?.toLocaleString() || "0"}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            ROI: {previewData.roi_percentage?.toFixed(1) || "0"}%
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          This is an estimate. Actual results may vary based on tax laws and
          other factors.
        </CardFooter>
      </Card>
    );
  }, [previewData, grants, router, grantsLoading]);
  
  // Early return moved inside the render function to maintain hook order
  if (grantsLoading) {
    return <AuthLoading />;
  }

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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scenarios
        </Button>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
              <CardDescription>
                Create a new scenario to model different exit strategies for
                your equity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScenarioForm
                initialData={defaultValues}
                onSubmit={handleCreateScenario}
                onFormChange={handlePreview}
                isLoading={loading}
                grants={grants || []}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          {previewCardContent}
        </div>
      </div>
    </DashboardShell>
  );
}
