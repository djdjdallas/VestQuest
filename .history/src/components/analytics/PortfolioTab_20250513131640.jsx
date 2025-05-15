// src/components/analytics/PortfolioTab.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioTimeline from "./PortfolioTimeline";

/**
 * Portfolio Tab Component
 * Displays portfolio analysis data including distribution and timeline charts
 */
const PortfolioTab = ({ analytics }) => {
  // Sample data structure for the timeline (you'll need to replace with your actual data source)
  const portfolioTimelineData = [
    {
      date: "2021-01-01",
      historicalValue: 0,
      projectedValue: null,
    },
    {
      date: "2021-07-01",
      historicalValue: 45000,
      projectedValue: null,
    },
    {
      date: "2022-01-01",
      historicalValue: 52500,
      projectedValue: null,
    },
    {
      date: "2022-07-01",
      historicalValue: 52500,
      projectedValue: null,
    },
    {
      date: "2023-01-01",
      historicalValue: 64000,
      projectedValue: null,
    },
    {
      date: "2023-07-01",
      historicalValue: 64000,
      projectedValue: null,
    },
    {
      date: "2024-01-01",
      historicalValue: 64000,
      projectedValue: null,
    },
    {
      date: "2024-07-01",
      historicalValue: 64000,
      projectedValue: 64000,
    },
    {
      date: "2025-01-01",
      historicalValue: 67000,
      projectedValue: 67000,
    },
    {
      date: "2025-07-01",
      historicalValue: null,
      projectedValue: 70000,
    },
    {
      date: "2026-01-01",
      historicalValue: null,
      projectedValue: 75000,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribution Card */}
        <Card>
          <CardHeader>
            <CardTitle>Equity Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Breakdown by equity type
            </p>
          </CardHeader>
          <CardContent>
            {/* Your existing distribution chart */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                  <span>ISO: {analytics.isoPercentage}%</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2"></div>
                  <span>RSU: {analytics.rsuPercentage}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                  <span>${analytics.isoValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2"></div>
                  <span>${analytics.rsuValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Value Card */}
        <Card>
          <CardHeader>
            <CardTitle>Value by Company</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution across employers
            </p>
          </CardHeader>
          <CardContent>
            {/* Your existing company value chart */}
            {analytics.companyValues.map((company, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span>{company.name}</span>
                  <span>${company.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${company.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Timeline */}
      <PortfolioTimeline portfolioData={portfolioTimelineData} />

      {/* Add any additional analysis components here */}
    </div>
  );
};

export default PortfolioTab;
