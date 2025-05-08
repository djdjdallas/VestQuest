// src/components/recent-scenarios-card.jsx
"use client";

import Link from "next/link";
import { formatCurrency } from "@/utils/formatters";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export function RecentScenariosCard({ scenarios = [] }) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No recent scenarios created</p>
        <Link
          href="/dashboard/scenarios/add"
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          Create your first scenario
        </Link>
      </div>
    );
  }

  // Format currency helper if not imported
  const formatCurrencyFallback = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "$0";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Use imported function or fallback
  const currencyFormatter = formatCurrency || formatCurrencyFallback;

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => {
        // Safely get numeric values with fallbacks to prevent NaN
        const sharePrice = parseFloat(scenario.share_price) || 0;
        const sharesIncluded = parseInt(scenario.shares_included) || 0;
        const totalValue = sharePrice * sharesIncluded;

        return (
          <div
            key={scenario.id}
            className="flex justify-between items-center border-b pb-4 last:border-0"
          >
            <div>
              <h3 className="font-medium">
                {scenario.name || "Unnamed Scenario"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {scenario.exit_type || "Exit"} at{" "}
                {sharePrice ? `$${sharePrice.toFixed(2)}` : "$0.00"} per share
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{currencyFormatter(totalValue)}</p>
              <p className="text-sm text-muted-foreground">
                {sharesIncluded.toLocaleString()} shares
              </p>
            </div>
          </div>
        );
      })}

      {scenarios.length > 0 && (
        <Link
          href="/dashboard/scenarios"
          className="flex items-center text-sm text-primary hover:underline"
        >
          View all scenarios
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      )}
    </div>
  );
}
