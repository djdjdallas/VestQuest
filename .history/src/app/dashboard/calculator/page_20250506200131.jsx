"use client";

import { useState, useEffect } from "react";
import { useGrants } from "@/hooks/useGrants";
import { useCalculator } from "@/hooks/useCalculator";
import { SimpleCalculator } from "@/components/calculator/SimpleCalculator";
import { EquityForm } from "@/components/calculator/EquityForm";
import { EquityExplainer } from "@/components/calculator/EquityExplainer";
import EnhancedCalculator from "@/components/calculator/EnhancedCalculator";
import EquityVisualizations from "@/components/calculator/EquityVisualizations";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  PlusIcon,
  CalculatorIcon,
  SaveIcon,
  BookIcon,
  BarChart3,
  LineChart,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { calculateVestedShares } from "@/utils/calculations";

export default function Calculator() {
  const { grants, addGrant, loading } = useGrants();
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
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equity Calculator</h1>
          <p className="text-muted-foreground">
            Model and analyze your equity compensation
          </p>
        </div>

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
      </div>

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
              <CardTitle className="text-lg">Recent Grants</CardTitle>
              <CardDescription>Your saved equity grants</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading your grants...
                  </p>
                </div>
              ) : grants.length > 0 ? (
                <div className="divide-y">
                  {grants.slice(0, 5).map((grant) => (
                    <div
                      key={grant.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{grant.company_name}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {grant.grant_type}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {grant.shares.toLocaleString()} shares at $
                        {grant.strike_price.toFixed(2)}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Current FMV: ${grant.current_fmv.toFixed(2)}
                        </span>
                        <span>
                          Added{" "}
                          {new Date(grant.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    No equity grants found. Add your first grant to get started.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("add")}
                    className="gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Your First Grant
                  </Button>
                </div>
              )}

              {grants.length > 0 && (
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    View All Grants
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>
      </div>
    </div>
  );
}
