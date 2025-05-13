"use client";

import { useState } from "react";
import { SimpleCalculator } from "@/components/calculator/SimpleCalculator";
import { EquityForm } from "@/components/calculator/EquityForm";
import { EquityExplainer } from "@/components/calculator/EquityExplainer";
import EnhancedCalculator from "@/components/calculator/EnhancedCalculator";
import EquityVisualizations from "@/components/EquityVisualizations";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard-header";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  PlusIcon,
  CalculatorIcon,
  BookIcon,
  BarChart3,
  LineChart,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function Calculator() {
  const [activeTab, setActiveTab] = useState("calculator");

  const handleSaveSuccess = (data) => {
    toast({
      title: "Grant saved successfully",
      description: `Your ${
        data.grant_type
      } grant for ${data.shares.toLocaleString()} shares has been saved.`,
      variant: "success",
    });
  };

  const handleSaveError = (error) => {
    toast({
      title: "Error saving grant",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Equity Calculator"
        text="Model and analyze your equity compensation"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setActiveTab("calculator")}
            variant={activeTab === "calculator" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <CalculatorIcon className="h-4 w-4" />
            <span>Simple</span>
          </Button>
          <Button
            onClick={() => setActiveTab("enhanced")}
            variant={activeTab === "enhanced" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Enhanced</span>
          </Button>
          <Button
            onClick={() => setActiveTab("visualize")}
            variant={activeTab === "visualize" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <LineChart className="h-4 w-4" />
            <span>Visualize</span>
          </Button>
          <Button
            onClick={() => setActiveTab("add")}
            variant={activeTab === "add" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Grant</span>
          </Button>
          <Button
            onClick={() => setActiveTab("learn")}
            variant={activeTab === "learn" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <BookIcon className="h-4 w-4" />
            <span>Learn</span>
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {activeTab === "calculator" && <SimpleCalculator />}

          {activeTab === "enhanced" && <EnhancedCalculator />}

          {activeTab === "visualize" && <EquityVisualizations />}

          {activeTab === "add" && (
            <EquityForm
              onSuccess={handleSaveSuccess}
              onError={handleSaveError}
            />
          )}

          {activeTab === "learn" && <EquityExplainer />}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Understanding Strike Price</h3>
                <p className="text-sm text-muted-foreground">
                  The strike price is the fixed price at which you can purchase
                  your company's shares. It's usually set to the fair market
                  value at grant date.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Tax Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Consider exercising early if the spread between strike price
                  and FMV is small to minimize tax implications.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Exit Strategy Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Model multiple exit scenarios rather than assuming the
                  best-case outcome for more realistic planning.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 w-full"
                onClick={() => setActiveTab("learn")}
              >
                <BookIcon className="h-4 w-4" />
                Learn More About Equity
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Want more sophisticated equity modeling? Try our enhanced
                calculator for dilution impact, secondary market analysis, and
                tax optimization strategies.
              </p>
              <Button
                className="w-full"
                onClick={() => setActiveTab("enhanced")}
              >
                Try Enhanced Calculator
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scenario Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create different exit scenarios to compare potential outcomes
                and make informed decisions about your equity strategy.
              </p>
              <Link href="/dashboard/scenarios" passHref>
                <Button variant="outline" className="w-full gap-2">
                  Explore Scenarios
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
