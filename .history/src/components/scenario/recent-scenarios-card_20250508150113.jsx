"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/lib/supabase";

export function RecentScenariosCard() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch recent scenarios from Supabase
  useEffect(() => {
    async function fetchRecentScenarios() {
      try {
        setLoading(true);

        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setScenarios([]);
          return;
        }

        // Fetch the most recent scenarios (adjust table name if needed)
        const { data, error } = await supabase
          .from("scenarios") // Use your actual table name
          .select(
            `
            id,
            scenario_name,
            exit_type,
            exit_value,
            shares_exercised,
            exercise_cost,
            gross_proceeds,
            tax_liability,
            net_proceeds,
            roi_percentage,
            created_at
          `
          )
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;

        setScenarios(data || []);
      } catch (err) {
        console.error("Error fetching recent scenarios:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentScenarios();
  }, []);

  // Format currency with fallback
  const formatMoney = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "$0";
    }

    try {
      return formatCurrency(value);
    } catch (error) {
      // Fallback formatter if the imported one fails
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  // Format percentage with fallback
  const formatPercent = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0%";
    }
    return `${value.toFixed(1)}%`;
  };

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Recent Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-4 last:border-0 animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div>
                  <div className="h-3 bg-slate-200 rounded w-16 ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Recent Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-red-500">Error loading scenarios</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Recent Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scenarios.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No scenarios created yet</p>
            <Link
              href="/dashboard/scenarios/create"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Create your first scenario
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {scenarios.map((scenario) => {
              // Extract scenario data with safety checks
              const exitValue = parseFloat(scenario.exit_value) || 0;
              const sharesExercised = parseInt(scenario.shares_exercised) || 0;
              const netProceeds = parseFloat(scenario.net_proceeds) || 0;
              const roi = parseFloat(scenario.roi_percentage) || 0;

              return (
                <div
                  key={scenario.id}
                  className="flex justify-between items-center border-b pb-4 last:border-0"
                >
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">
                        {scenario.scenario_name || "Unnamed Scenario"}
                      </h3>
                      {roi > 50 && (
                        <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                          High ROI
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>
                        {scenario.exit_type || "Exit"} at $
                        {exitValue.toFixed(2)}/share
                      </span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatRelativeTime(scenario.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(netProceeds)}</p>
                    <p className="text-sm flex items-center justify-end">
                      <span
                        className={roi >= 0 ? "text-green-600" : "text-red-500"}
                      >
                        {formatPercent(roi)} ROI
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          {scenarios.length > 0 ? (
            <span>
              Last updated: {formatRelativeTime(scenarios[0]?.created_at)}
            </span>
          ) : (
            <span>No recent scenarios</span>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/scenarios">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
