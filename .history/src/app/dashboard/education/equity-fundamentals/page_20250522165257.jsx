"use client";

import { EquityFundamentalsModule } from "@/components/education/EquityFundamentalsModule";
import { UserProgressProvider } from "@/components/education/UserProgressProvider";
import { EducationLevelProvider } from "@/context/EducationContext";
import { DashboardShell } from "@/components/dashboard-shell";

export default function EquityFundamentalsPage() {
  return (
    <DashboardShell>
      <EducationLevelProvider>
        <UserProgressProvider>
          <EquityFundamentalsModule />
        </UserProgressProvider>
      </EducationLevelProvider>
    </DashboardShell>
  );
}
