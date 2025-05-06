import { BarChart3, ExternalLink, LineChart, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

export function RecentScenariosCard({ scenarios = [] }) {
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  // If no scenarios provided, show placeholder
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <p className="text-muted-foreground text-center">
          No scenarios yet. Create your first exit scenario to compare different
          outcomes.
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard/scenarios/add">Create Scenario</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => {
        const ScenarioIcon = getScenarioIcon(scenario.exit_type);
        // Calculate estimated value (this is simplified and should be replaced with actual data)
        const estimatedValue = scenario.share_price
          ? `$${Math.round(
              scenario.share_price * (scenario.shares_included || 1000)
            ).toLocaleString()}`
          : "N/A";

        return (
          <Card key={scenario.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ScenarioIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {scenario.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(scenario.created_at)}
                  </p>
                </div>
                <div className="ml-auto font-medium">{estimatedValue}</div>
                <Button variant="ghost" size="icon" className="ml-2" asChild>
                  <Link href={`/dashboard/scenarios/${scenario.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View scenario</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
