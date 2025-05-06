"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";

export function DashboardShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-hidden p-4 md:p-6">{children}</main>
    </div>
  );
}
