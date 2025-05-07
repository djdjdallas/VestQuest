"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  LineChart,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import AuthLoading from "@/components/auth/AuthLoading";
import { calculateScenarioResult } from "@/utils/calculations";

export default function ScenarioDetailsPage() {
  const router = useRouter();
  const params = useParams(); // Using useParams hook instead of receiving params as a prop
  const [scenario, setScenario] = useState(null);
  const [grant, setGrant] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch the scenario and related grant data
  useEffect(() => {
    const fetchScenarioAndGrant = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get the scenario ID from params
        const scenarioId = params.id;

        // Fetch scenario
        const { data: scenarioData, error: scenarioError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("id", scenarioId)
          .single();

        if (scenarioError) throw scenarioError;

        // Verify that the scenario belongs to the current user
        if (scenarioData.user_id !== user.id) {
          setError("You do not have permission to view this scenario");
          setLoading(false);
          return;
        }

        setScenario(scenarioData);

        // If there's a grant_id, fetch the grant data
        if (scenarioData.grant_id) {
          const { data: grantData, error: grantError } = await supabase
            .from("equity_grants")
            .select("*")
            .eq("id", scenarioData.grant_id)
            .single();

          if (grantError) throw grantError;

          setGrant(grantData);

          // Calculate scenario results
          if (grantData && scenarioData) {
            const results = calculateScenarioResult(
              grantData,
              scenarioData.share_price,
              scenarioData.shares_included || grantData.shares,
              scenarioData.name
            );
            setResults(results);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load scenario details");
      } finally {
        setLoading(false);
      }
    };

    fetchScenarioAndGrant();
  }, [supabase, params.id, router]);

  const handleDeleteScenario = async () => {
    if (confirm("Are you sure you want to delete this scenario?")) {
      try {
        const { error } = await supabase
          .from("scenarios")
          .delete()
          .eq("id", params.id);

        if (error) throw error;

        toast.success("Scenario deleted successfully");
        router.push("/dashboard/scenarios");
      } catch (error) {
        console.error("Error deleting scenario:", error);
        toast.error(error.message || "Failed to delete scenario");
      }
    }
  };

  // Get the icon based on exit type
  const getScenarioIcon = (type) => {
    switch (type) {
      case "IPO":
        return LineChart;
      case "Acquisition":
        return BarChart3;
      case "Secondary":
        return PieChart;
      default:
        return LineChart;
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
          heading="Scenario Details"
          text="View your equity exit scenario details."
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/scenarios")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
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

  if (!scenario) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Scenario Details"
          text="View your equity exit scenario details."
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/scenarios")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Button>
        </DashboardHeader>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p>Scenario not found</p>
              <Button onClick={() => router.push("/dashboard/scenarios")}>
                Go back to Scenarios
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const ScenarioIcon = getScenarioIcon(scenario.exit_type);

  return (
    <DashboardShell>
      <DashboardHeader
        heading={scenario.name}
        text={`${scenario.exit_type} scenario with ${
          scenario.shares_included?.toLocaleString() || "N/A"
        } shares at $${scenario.share_price}`}
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/scenarios")}
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
                <Link href={`/dashboard/scenarios/${scenario.id}/edit`}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Scenario
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteScenario}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Scenario
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scenario Details</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ScenarioIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardDescription>
              Information about your {scenario.exit_type.toLowerCase()} scenario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scenario.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p>{scenario.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Exit Type
                </h3>
                <p className="flex items-center mt-0.5">
                  <ScenarioIcon className="mr-1 h-4 w-4 text-primary" />
                  {scenario.exit_type}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Exit Date
                </h3>
                <p className="flex items-center mt-0.5">
                  <Calendar className="mr-1 h-4 w-4 text-primary" />
                  {formatDate(scenario.exit_date)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Share Price
                </h3>
                <p className="flex items-center mt-0.5">
                  <DollarSign className="mr-1 h-4 w-4 text-primary" />$
                  {scenario.share_price?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Shares Included
                </h3>
                <p>{scenario.shares_included?.toLocaleString() || "N/A"}</p>
              </div>
            </div>

            {grant && (
              <div className="pt-4 border-t mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Applied to Grant
                </h3>
                <Link
                  href={`/dashboard/grants/${grant.id}`}
                  className="block p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{grant.company_name}</span>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {grant.grant_type}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {grant.shares?.toLocaleString()} shares at $
                    {grant.strike_price?.toFixed(2)}
                  </div>
                </Link>
              </div>
            )}

            <div className="pt-4 border-t mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Created
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(scenario.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Outcome</CardTitle>
              <CardDescription>
                Estimated financial results based on this scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Gross Proceeds
                </h3>
                <p className="text-2xl font-bold">
                  ${results.gross_proceeds?.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Exercise Cost
                  </h3>
                  <p className="text-lg text-red-500">
                    -${results.exercise_cost?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tax Liability
                  </h3>
                  <p className="text-lg text-red-500">
                    -${results.tax_liability?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Net Proceeds
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  ${results.net_proceeds?.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Return on Investment
                  </h3>
                  <p className="font-medium">
                    {results.roi_percentage?.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Effective Tax Rate
                  </h3>
                  <p className="font-medium">
                    {(results.effective_tax_rate * 100)?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 text-xs text-muted-foreground">
              <p>
                This is an estimate based on current information. Actual results
                may vary based on tax laws and other factors at the time of
                exit.
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
