"use client";

import { DashboardNav } from "@/components/dashboard-nav";

export function DashboardShell({ children }) {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="ml-16 transition-all duration-300 overflow-x-hidden p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
