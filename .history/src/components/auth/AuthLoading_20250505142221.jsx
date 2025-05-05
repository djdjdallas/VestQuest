"use client";

import { LineChart } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 mb-4">
        <LineChart className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">VestQuest</h1>
      </div>
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
      <p className="mt-4 text-muted-foreground">Loading your account...</p>
    </div>
  );
}
