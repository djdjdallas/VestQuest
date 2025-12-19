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
  Share2,
  Download,
  Users,
  ArrowUpRight,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AuthLoading from "@/components/auth/AuthLoading";
import { calculateScenarioResult } from "@/utils/calculations";

export default function ScenarioDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [scenario, setScenario] = useState(null);
  const [grant, setGrant] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

        // Clean up the scenario data to ensure all numerical fields are properly typed
        const cleanedScenario = {
          ...scenarioData,
          share_price: parseFloat(scenarioData.share_price) || 0,
          shares_included: parseInt(scenarioData.shares_included) || 0,
          exercise_cost: parseFloat(scenarioData.exercise_cost) || 0,
          tax_liability: parseFloat(scenarioData.tax_liability) || 0,
          gross_proceeds: parseFloat(scenarioData.gross_proceeds) || 0,
          net_proceeds: parseFloat(scenarioData.net_proceeds) || 0,
          roi_percentage: parseFloat(scenarioData.roi_percentage) || 0,
          effective_tax_rate: parseFloat(scenarioData.effective_tax_rate) || 0,
        };

        setScenario(cleanedScenario);

        // If there's a grant_id, fetch the grant data
        if (cleanedScenario.grant_id) {
          const { data: grantData, error: grantError } = await supabase
            .from("equity_grants")
            .select("*")
            .eq("id", cleanedScenario.grant_id)
            .single();

          if (grantError) {
            // Don't throw - we can still show scenario without grant
          } else {
            setGrant(grantData);

            // Calculate scenario results if needed
            // If we already have calculated fields in the scenario, use those
            if (
              cleanedScenario.gross_proceeds &&
              cleanedScenario.net_proceeds
            ) {
              setResults(cleanedScenario);
            } else if (grantData && cleanedScenario) {
              // Otherwise recalculate
              const calculatedResults = calculateScenarioResult(
                grantData,
                cleanedScenario.share_price,
                cleanedScenario.shares_included || grantData.shares,
                cleanedScenario.scenario_name
              );
              setResults(calculatedResults);
            }
          }
        } else {
          // If there's no grant but we have calculated fields, use those
          if (cleanedScenario.gross_proceeds && cleanedScenario.net_proceeds) {
            setResults(cleanedScenario);
          }
        }
      } catch (error) {
        setError(error.message || "Failed to load scenario details");
      } finally {
        setLoading(false);
      }
    };

    fetchScenarioAndGrant();
  }, [supabase, params.id, router]);

  const handleDeleteScenario = async () => {
    try {
      const { error } = await supabase
        .from("scenarios")
        .delete()
        .eq("id", params.id);

      if (error) throw error;

      toast.success("Scenario deleted successfully");
      router.push("/dashboard/scenarios");
    } catch (error) {
      toast.error(error.message || "Failed to delete scenario");
    } finally {
      setShowDeleteDialog(false);
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency helper
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "$0";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentages
  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0%";
    }
    return `${value.toFixed(1)}%`;
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

  const ScenarioIcon = getScenarioIcon(scenario.exit_type || "Custom");

  return (
    <DashboardShell>
      <DashboardHeader
        heading={scenario.scenario_name || "Scenario Details"}
        text={`${scenario.exit_type || "Exit"} scenario with ${(
          scenario.shares_included || 0
        ).toLocaleString()} shares at $${
          scenario.share_price?.toFixed(2) || "0.00"
        }`}
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
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Scenario
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Share2 className="mr-2 h-4 w-4" />
                Share Scenario
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
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
              Information about your{" "}
              {scenario.exit_type ? scenario.exit_type.toLowerCase() : "exit"}{" "}
              scenario
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
                  {scenario.exit_type || "Custom"}
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
                  <DollarSign className="mr-1 h-4 w-4 text-primary" />
                  {scenario.share_price
                    ? `$${scenario.share_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "$0.00"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Shares Included
                </h3>
                <p className="flex items-center mt-0.5">
                  <Users className="mr-1 h-4 w-4 text-primary" />
                  {scenario.shares_included?.toLocaleString() || "0"}
                </p>
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
                    {grant.shares?.toLocaleString() || "0"} shares at $
                    {grant.strike_price?.toFixed(2) || "0.00"}
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
                  {formatCurrency(results.gross_proceeds)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scenario.shares_included?.toLocaleString() || "0"} shares × $
                  {scenario.share_price?.toFixed(2) || "0.00"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Exercise Cost
                  </h3>
                  <p className="text-lg text-red-500">
                    {formatCurrency(
                      results.exercise_cost && results.exercise_cost > 0
                        ? -results.exercise_cost
                        : 0
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tax Liability
                  </h3>
                  <p className="text-lg text-red-500">
                    {formatCurrency(
                      results.tax_liability && results.tax_liability > 0
                        ? -results.tax_liability
                        : 0
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Net Proceeds
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(results.net_proceeds)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Return on Investment
                  </h3>
                  <p className="font-medium">
                    {formatPercentage(results.roi_percentage)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Effective Tax Rate
                  </h3>
                  <p className="font-medium">
                    {formatPercentage(results.effective_tax_rate * 100)}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Breakdown</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Exercise Cost</span>
                      <span>
                        {formatPercentage(
                          (results.exercise_cost / results.gross_proceeds) * 100
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        (results.exercise_cost / results.gross_proceeds) * 100
                      }
                      className="h-2 bg-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tax Liability</span>
                      <span>
                        {formatPercentage(
                          (results.tax_liability / results.gross_proceeds) * 100
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        (results.tax_liability / results.gross_proceeds) * 100
                      }
                      className="h-2 bg-red-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Net Proceeds</span>
                      <span>
                        {formatPercentage(
                          (results.net_proceeds / results.gross_proceeds) * 100
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        (results.net_proceeds / results.gross_proceeds) * 100
                      }
                      className="h-2 bg-green-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/decisions/exit">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Run Exit Planning Guide
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteScenario}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
