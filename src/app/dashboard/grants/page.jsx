import { Plus } from "lucide-react";
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
import { GrantsTable } from "@/components/grants-table";

export default function GrantsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Equity Grants"
        text="Manage and track all your equity grants."
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Grant
        </Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Your Grants</CardTitle>
          <CardDescription>
            View and manage your equity grants across all companies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GrantsTable />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
