"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  LineChart,
  BarChart3,
  PieChart,
  ExternalLink,
  Edit2,
  Trash2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { ScenarioComparison } from "@/components/scenario-comparison";
import AuthLoading from "@/components/auth/AuthLoading";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("scenarios")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setScenarios(data || []);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [supabase]);

  const handleDeleteScenario = async (id) => {
    if (confirm("Are you sure you want to delete this scenario?")) {
      try {
        const { error } = await supabase
          .from("scenarios")
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Update the local state by filtering out the deleted scenario
        setScenarios(scenarios.filter((scenario) => scenario.id !== id));
        toast.success("Scenario deleted successfully");
      } catch (error) {
        console.error("Error deleting scenario:", error);
        toast.error(error.message || "Failed to delete scenario");
      }
    }
  };

  // Show loading state
  if (loading) {
    return <AuthLoading />;
  }

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

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Scenarios"
        text="Compare different exit scenarios for your equity."
      >
        <Button asChild>
          <Link href="/dashboard/scenarios/add">
            <Plus className="mr-2 h-4 w-4" />
            Create New Scenario
          </Link>
        </Button>
      </DashboardHeader>

      {/* No scenarios state */}
      {scenarios.length === 0 && !error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <LineChart className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No scenarios yet</h3>
              <p className="text-muted-foreground">
                Create your first scenario to compare different exit strategies
                for your equity.
              </p>
              <Button asChild>
                <Link href="/dashboard/scenarios/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Scenario
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Scenario cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => {
              const ScenarioIcon = getScenarioIcon(scenario.exit_type);
              return (
                <Card key={scenario.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-medium">
                        {scenario.name}
                      </CardTitle>
                      <CardDescription>
                        {scenario.exit_type} • {formatDate(scenario.exit_date)}
                      </CardDescription>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ScenarioIcon className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Share Price:
                        </span>
                        <span className="font-medium">
                          $
                          {scenario.share_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shares:</span>
                        <span className="font-medium">
                          {scenario.shares_included?.toLocaleString() || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Value:
                        </span>
                        <span className="font-medium">
                          $
                          {(
                            (scenario.share_price || 0) *
                            (scenario.shares_included || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="text-xs"
                        >
                          <Link href={`/dashboard/scenarios/${scenario.id}`}>
                            <ExternalLink className="mr-1 h-3 w-3" />
                            View Details
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/scenarios/${scenario.id}/edit`}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteScenario(scenario.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Scenario comparison */}
          {scenarios.length > 1 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
                <CardDescription>
                  Compare your scenarios side-by-side to make informed
                  decisions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioComparison scenarios={scenarios} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardShell>
  );
}
