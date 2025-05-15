"use client";

import { useState } from "react";
import { UnifiedCalculator } from "@/components/calculator/UnifiedCalculator";
import { EquityExplainer } from "@/components/calculator/EquityExplainer";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard-header";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  BookIcon,
  ArrowUpRightIcon,
  LightbulbIcon,
  BarChart4,
  Lightbulb,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UnifiedCalculatorPage() {
  const [activeTab, setActiveTab] = useState("calculator");
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Enhanced Equity Calculator"
        text="Make smarter decisions about your equity with our all-in-one calculator"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setActiveTab("calculator")}
            variant={activeTab === "calculator" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <BarChart4 className="h-4 w-4" />
            <span>Calculator</span>
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
          <Link href="/dashboard/scenarios">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpRightIcon className="h-4 w-4" />
              <span>Scenarios</span>
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {activeTab === "calculator" && <UnifiedCalculator />}
          {activeTab === "learn" && <EquityExplainer />}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Use This Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Comprehensive Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our enhanced calculator considers tax implications, timing factors, and company 
                  stage to provide a holistic view of your equity's potential value.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Decision Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Beyond simple calculations, get personalized recommendations based on 
                  your financial situation and risk tolerance.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Advanced Tax Modeling</h3>
                <p className="text-sm text-muted-foreground">
                  Model complex tax scenarios including AMT implications for ISOs, multi-state 
                  allocations, and ISO/NSO conversion analysis.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pro Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="exercise">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="exercise">Exercise</TabsTrigger>
                  <TabsTrigger value="tax">Tax</TabsTrigger>
                  <TabsTrigger value="timing">Timing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="exercise" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Early Exercise Strategy</h4>
                    <p className="text-xs text-muted-foreground">
                      If your company allows early exercise of unvested options, consider 
                      exercising early when the spread (FMV - strike) is low to minimize taxes.
                      File an 83(b) election within 30 days.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Cashless Exercise</h4>
                    <p className="text-xs text-muted-foreground">
                      For companies approaching IPO, you may be able to use a cashless exercise 
                      strategy to exercise without out-of-pocket costs. This sacrifices some upside 
                      but eliminates cash requirements.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="tax" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">ISO AMT Credit</h4>
                    <p className="text-xs text-muted-foreground">
                      If you pay AMT when exercising ISOs, you may be eligible for an AMT credit 
                      in future tax years. This can partially offset the AMT impact long-term.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Multi-Year Exercise</h4>
                    <p className="text-xs text-muted-foreground">
                      Spread your ISO exercises across multiple tax years to stay under AMT 
                      thresholds. Consider exercising in December and January to split the impact 
                      across two tax years.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="timing" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Post-Termination Window</h4>
                    <p className="text-xs text-muted-foreground">
                      Most options expire 90 days after leaving the company. Some companies offer 
                      extended exercise windows (5-10 years). Understand your grant terms before 
                      changing jobs.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Market Timing</h4>
                    <p className="text-xs text-muted-foreground">
                      For public companies, consider the stock's volatility and general market 
                      conditions when exercising. High volatility may present opportunities for 
                      optimal exercise timing.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need More Guidance?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our equity advisors can provide personalized guidance on your grant, 
                tax implications, and optimal exercise strategies.
              </p>
              
              <Link href="/dashboard/advisor">
                <Button className="w-full gap-2">
                  Get Personalized Advice
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