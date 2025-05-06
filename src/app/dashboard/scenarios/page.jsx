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
import { ScenarioComparison } from "@/components/scenario-comparison";

export default function ScenariosPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Scenario Comparison"
        text="Compare different exit scenarios for your equity."
      >
        <Button>Create New Scenario</Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Exit Scenarios</CardTitle>
          <CardDescription>
            Compare potential outcomes based on different company valuations and
            exit events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScenarioComparison />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
