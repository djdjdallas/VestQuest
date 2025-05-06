"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
import { EnhancedExerciseDecisionTool } from "@/components/decisions/EnhancedExerciseDecisionTool";

export default function DecisionsPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Decision Tools"
        text="Get personalized guidance for your equity decisions."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </DashboardHeader>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exercise Decision Analyzer</CardTitle>
            <CardDescription>
              Answer a few questions to get a personalized recommendation on
              whether to exercise your options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedExerciseDecisionTool />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
