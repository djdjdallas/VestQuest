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
import { VestingTimeline } from "@/components/vesting-timeline";

export default function VestingPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Vesting Timeline"
        text="Track your past and future vesting events."
      >
        <Button>Export Data</Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Vesting Schedule</CardTitle>
          <CardDescription>
            Monthly breakdown of your vesting schedule across all grants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VestingTimeline />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
