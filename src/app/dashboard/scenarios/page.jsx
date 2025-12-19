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
  Download,
  Filter,
  SlidersHorizontal,
  Share,
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
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { EnhancedScenarioComparison } from "@/components/scenario/EnhancedScenarioComparison";
import { IntegratedScenarioTaxAnalysis } from "@/components/tax/IntegratedScenarioTaxAnalysis";
import AuthLoading from "@/components/auth/AuthLoading";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredScenarios, setFilteredScenarios] = useState([]);
  const [filters, setFilters] = useState({
    exitType: "all",
    sortBy: "created_at",
    sortDirection: "desc",
    showArchived: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState(null);
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

        // Add some additional calculated fields for display
        const processedScenarios =
          data?.map((scenario) => ({
            ...scenario,
            // Calculate fields if they don't exist in the DB
            roi_percentage: scenario.roi_percentage || calculateROI(scenario),
            gross_proceeds: scenario.gross_proceeds || calculateGross(scenario),
            net_proceeds: scenario.net_proceeds || calculateNet(scenario),
          })) || [];

        setScenarios(processedScenarios);
        applyFilters(processedScenarios, filters);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [supabase]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters(scenarios, filters);
  }, [filters, scenarios]);

  // Helper functions for calculations
  const calculateROI = (scenario) => {
    if (!scenario.exercise_cost || scenario.exercise_cost === 0) return 0;
    return (
      ((scenario.gross_proceeds -
        scenario.exercise_cost -
        scenario.tax_liability) /
        scenario.exercise_cost) *
      100
    );
  };

  const calculateGross = (scenario) => {
    return (scenario.exit_value || 0) * (scenario.shares_exercised || 0);
  };

  const calculateNet = (scenario) => {
    const gross = calculateGross(scenario);
    return (
      gross - (scenario.exercise_cost || 0) - (scenario.tax_liability || 0)
    );
  };

  // Filter and sort scenarios
  const applyFilters = (allScenarios, currentFilters) => {
    let filtered = [...allScenarios];

    // Filter by exit type
    if (currentFilters.exitType !== "all") {
      filtered = filtered.filter(
        (scenario) => scenario.exit_type === currentFilters.exitType
      );
    }

    // Filter archived scenarios
    if (!currentFilters.showArchived) {
      filtered = filtered.filter((scenario) => !scenario.is_archived);
    }

    // Sort scenarios
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (currentFilters.sortBy) {
        case "exit_value":
          valueA = a.exit_value || 0;
          valueB = b.exit_value || 0;
          break;
        case "roi_percentage":
          valueA = a.roi_percentage || calculateROI(a);
          valueB = b.roi_percentage || calculateROI(b);
          break;
        case "name":
          valueA = a.scenario_name || "";
          valueB = b.scenario_name || "";
          return currentFilters.sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "created_at":
        default:
          valueA = new Date(a.created_at || 0).getTime();
          valueB = new Date(b.created_at || 0).getTime();
      }

      return currentFilters.sortDirection === "asc"
        ? valueA - valueB
        : valueB - valueA;
    });

    setFilteredScenarios(filtered);
  };

  const handleDeleteScenario = async (id) => {
    setShowDeleteConfirm(false);

    try {
      const { error } = await supabase.from("scenarios").delete().eq("id", id);

      if (error) throw error;

      // Update the local state by filtering out the deleted scenario
      setScenarios(scenarios.filter((scenario) => scenario.id !== id));
      setFilteredScenarios(
        filteredScenarios.filter((scenario) => scenario.id !== id)
      );
      setSelectedScenarios(
        selectedScenarios.filter((scenarioId) => scenarioId !== id)
      );
      toast.success("Scenario deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete scenario");
    }
  };

  const handleArchiveScenario = async (id, archive = true) => {
    try {
      const { error } = await supabase
        .from("scenarios")
        .update({ is_archived: archive })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      const updatedScenarios = scenarios.map((scenario) =>
        scenario.id === id ? { ...scenario, is_archived: archive } : scenario
      );

      setScenarios(updatedScenarios);
      applyFilters(updatedScenarios, filters);

      toast.success(archive ? "Scenario archived" : "Scenario unarchived");
    } catch (error) {
      toast.error(error.message || "Failed to update scenario");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedScenarios.length === 0) return;

    try {
      const { error } = await supabase
        .from("scenarios")
        .delete()
        .in("id", selectedScenarios);

      if (error) throw error;

      // Update local state
      const remainingScenarios = scenarios.filter(
        (scenario) => !selectedScenarios.includes(scenario.id)
      );

      setScenarios(remainingScenarios);
      applyFilters(remainingScenarios, filters);
      setSelectedScenarios([]);

      toast.success(`${selectedScenarios.length} scenarios deleted`);
    } catch (error) {
      toast.error(error.message || "Failed to delete scenarios");
    }
  };

  const toggleSelectScenario = (id) => {
    setSelectedScenarios((prev) =>
      prev.includes(id)
        ? prev.filter((scenarioId) => scenarioId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedScenarios.length === filteredScenarios.length) {
      setSelectedScenarios([]);
    } else {
      setSelectedScenarios(filteredScenarios.map((scenario) => scenario.id));
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

  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null) {
      return "$0";
    }
    return `$${parseFloat(value)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Show loading state
  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Scenarios"
        text="Compare different exit scenarios for your equity."
      >
        <div className="flex gap-2">
          {selectedScenarios.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete {selectedScenarios.length} Selected
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button asChild>
            <Link href="/dashboard/scenarios/add">
              <Plus className="h-4 w-4 mr-2" />
              Create New Scenario
            </Link>
          </Button>
        </div>
      </DashboardHeader>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Exit Type
                </label>
                <Select
                  value={filters.exitType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, exitType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="IPO">IPO</SelectItem>
                    <SelectItem value="Acquisition">Acquisition</SelectItem>
                    <SelectItem value="Secondary">Secondary</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters({ ...filters, sortBy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Date created" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="exit_value">Exit value</SelectItem>
                    <SelectItem value="roi_percentage">ROI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Sort Direction
                </label>
                <Select
                  value={filters.sortDirection}
                  onValueChange={(value) =>
                    setFilters({ ...filters, sortDirection: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Descending" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showArchived"
                    checked={filters.showArchived}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, showArchived: checked })
                    }
                  />
                  <label
                    htmlFor="showArchived"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show archived scenarios
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <Tabs defaultValue="grid" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="tax">Tax Analysis</TabsTrigger>
              </TabsList>

              {(selectedScenarios.length > 0 ||
                filteredScenarios.length > 0) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Checkbox
                    id="selectAll"
                    className="mr-2"
                    checked={
                      selectedScenarios.length === filteredScenarios.length &&
                      filteredScenarios.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="selectAll">
                    {selectedScenarios.length} of {filteredScenarios.length}{" "}
                    selected
                  </label>
                </div>
              )}
            </div>

            <TabsContent value="grid" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredScenarios.map((scenario) => {
                  const ScenarioIcon = getScenarioIcon(scenario.exit_type);

                  return (
                    <Card
                      key={scenario.id}
                      className={`${scenario.is_archived ? "opacity-60" : ""}`}
                    >
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1 flex items-start">
                          <Checkbox
                            className="mr-3 mt-1"
                            checked={selectedScenarios.includes(scenario.id)}
                            onCheckedChange={() =>
                              toggleSelectScenario(scenario.id)
                            }
                          />
                          <div>
                            <CardTitle className="text-base font-medium">
                              {scenario.scenario_name || "Unnamed Scenario"}
                              {scenario.is_archived && (
                                <Badge variant="outline" className="ml-2">
                                  Archived
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {scenario.exit_type || "N/A"} •{" "}
                              {formatDate(scenario.exit_date)}
                            </CardDescription>
                          </div>
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
                              {formatCurrency(scenario.exit_value)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Shares:
                            </span>
                            <span className="font-medium">
                              {scenario.shares_exercised?.toLocaleString() ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Net Proceeds:
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(scenario.net_proceeds)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ROI:</span>
                            <span className="font-medium">
                              {(scenario.roi_percentage || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="pt-2 flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="text-xs"
                            >
                              <Link
                                href={`/dashboard/scenarios/${scenario.id}`}
                              >
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
                                {scenario.is_archived ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveScenario(scenario.id, false)
                                    }
                                  >
                                    <LineChart className="mr-2 h-4 w-4" />
                                    Unarchive
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveScenario(scenario.id, true)
                                    }
                                  >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setScenarioToDelete(scenario.id);
                                    setShowDeleteConfirm(true);
                                  }}
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
            </TabsContent>

            <TabsContent value="table">
              <Card>
                <CardContent className="p-0">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">
                            <Checkbox
                              checked={
                                selectedScenarios.length ===
                                  filteredScenarios.length &&
                                filteredScenarios.length > 0
                              }
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium">
                            Name
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium">
                            Type
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            Share Price
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            Shares
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            Net Proceeds
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            ROI
                          </th>
                          <th className="h-12 px-4 text-center align-middle font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredScenarios.map((scenario) => (
                          <tr
                            key={scenario.id}
                            className={`border-b transition-colors hover:bg-muted/50 ${
                              scenario.is_archived ? "opacity-60" : ""
                            }`}
                          >
                            <td className="p-4 align-middle">
                              <Checkbox
                                checked={selectedScenarios.includes(
                                  scenario.id
                                )}
                                onCheckedChange={() =>
                                  toggleSelectScenario(scenario.id)
                                }
                              />
                            </td>
                            <td className="p-4 align-middle font-medium">
                              <div className="flex flex-col">
                                <span>
                                  {scenario.scenario_name || "Unnamed"}
                                </span>
                                {scenario.is_archived && (
                                  <Badge
                                    variant="outline"
                                    className="w-fit mt-1"
                                  >
                                    Archived
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              {scenario.exit_type}
                            </td>
                            <td className="p-4 align-middle text-right">
                              {formatCurrency(scenario.exit_value)}
                            </td>
                            <td className="p-4 align-middle text-right">
                              {scenario.shares_exercised?.toLocaleString() ||
                                "N/A"}
                            </td>
                            <td className="p-4 align-middle text-right text-green-600">
                              {formatCurrency(scenario.net_proceeds)}
                            </td>
                            <td className="p-4 align-middle text-right">
                              {(scenario.roi_percentage || 0).toFixed(1)}%
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex justify-center space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                      >
                                        <Link
                                          href={`/dashboard/scenarios/${scenario.id}`}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                      >
                                        <Link
                                          href={`/dashboard/scenarios/${scenario.id}/edit`}
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit scenario</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setScenarioToDelete(scenario.id);
                                          setShowDeleteConfirm(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete scenario</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison">
              {filteredScenarios.length >= 2 ? (
                <EnhancedScenarioComparison scenarios={filteredScenarios} />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      You need at least 2 scenarios to compare. Create another
                      scenario to enable comparison.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/dashboard/scenarios/add">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Another Scenario
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tax">
              {filteredScenarios.length > 0 ? (
                <IntegratedScenarioTaxAnalysis
                  scenarios={filteredScenarios}
                  selectedScenarioId={filteredScenarios[0]?.id}
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No scenarios available for tax analysis. Create a scenario
                      first.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/dashboard/scenarios/add">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Scenario
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Scenario summary card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Scenario Summary</CardTitle>
              <CardDescription>
                Overview of all your equity exit scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Total Scenarios
                  </p>
                  <p className="text-2xl font-bold">{scenarios.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {scenarios.filter((s) => !s.is_archived).length} active,{" "}
                    {scenarios.filter((s) => s.is_archived).length} archived
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Average Exit Value
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      scenarios.length > 0
                        ? scenarios.reduce(
                            (sum, s) => sum + (s.exit_value || 0),
                            0
                          ) / scenarios.length
                        : 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">per share</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Highest ROI</p>
                  <p className="text-2xl font-bold">
                    {scenarios.length > 0
                      ? Math.max(
                          ...scenarios.map((s) => s.roi_percentage || 0)
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">
                    from{" "}
                    {scenarios.length > 0
                      ? scenarios.find(
                          (s) =>
                            (s.roi_percentage || 0) ===
                            Math.max(
                              ...scenarios.map((s) => s.roi_percentage || 0)
                            )
                        )?.scenario_name || "Unknown"
                      : "N/A"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Best Net Outcome
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      scenarios.length > 0
                        ? Math.max(...scenarios.map((s) => s.net_proceeds || 0))
                        : 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    from{" "}
                    {scenarios.length > 0
                      ? scenarios.find(
                          (s) =>
                            (s.net_proceeds || 0) ===
                            Math.max(
                              ...scenarios.map((s) => s.net_proceeds || 0)
                            )
                        )?.scenario_name || "Unknown"
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Last updated: {formatDate(new Date().toISOString())}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {scenarioToDelete
                ? "Are you sure you want to delete this scenario? This action cannot be undone."
                : `Are you sure you want to delete ${selectedScenarios.length} selected scenarios? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                scenarioToDelete
                  ? handleDeleteScenario(scenarioToDelete)
                  : handleBulkDelete()
              }
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
