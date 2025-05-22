"use client";

import { EquityFundamentalsModule } from "@/components/education/EquityFundamentalsModule";
import { UserProgressProvider } from "@/components/education/UserProgressProvider";
import { EducationLevelProvider } from "@/context/EducationContext";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard-header";

export default function EquityFundamentalsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Equity Fundamentals"
        text="A beginner-friendly course on equity compensation basics"
      />
      
      <EducationLevelProvider>
        <UserProgressProvider>
          <EquityFundamentalsModule />
        </UserProgressProvider>
      </EducationLevelProvider>
    </DashboardShell>
  );
}