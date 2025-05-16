// src/components/analytics/PortfolioTab.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from "recharts";
import PortfolioTimeline from "./PortfolioTimeline";
import { formatCurrency } from "@/lib/utils";
import GrantTypeChart from "./GrantTypeChart";
import CompanyValueChart from "./CompanyValueChart";

/**
 * Portfolio Tab Component
 * Displays portfolio analysis data including distribution and timeline charts
 */
const PortfolioTab = ({ analytics = {} }) => {
  const [analysisView, setAnalysisView] = useState("overview");

  // Prepare equity distribution data for pie chart
  const equityDistributionData = [
    { name: 'ISO', value: analytics?.isoValue || 0, color: '#3B82F6' },
    { name: 'RSU', value: analytics?.rsuValue || 0, color: '#10B981' }
  ].filter(item => item.value > 0);
  
  // Format company values data for visualization
  const companyValueData = analytics?.companyValues || [];
  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

  // Prepare data for shares breakdown
  const sharesData = [
    { name: 'Vested', value: analytics?.vestedShares || 0, color: '#10B981' },
    { name: 'Unvested', value: analytics?.unvestedShares || 0, color: '#3B82F6' },
  ];

  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-xs text-muted-foreground">
            {`${(payload[0].payload.percent * 100).toFixed(1)}% of total`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Tabs value={analysisView} onValueChange={setAnalysisView} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equity">Equity Details</TabsTrigger>
          <TabsTrigger value="timeline">Value Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Enhanced Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Equity Distribution</CardTitle>
                <CardDescription>
                  Breakdown by equity type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={equityDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {equityDistributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">ISO Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics?.isoValue || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">RSU Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics?.rsuValue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Shares Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Shares Breakdown</CardTitle>
                <CardDescription>
                  Vested vs Unvested Status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sharesData}
                      layout="vertical"
                      margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                      <RechartsTooltip
                        formatter={(value) => [`${value.toLocaleString()} shares`, '']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {sharesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          formatter={(value) => value.toLocaleString()}
                          style={{ fill: '#374151', fontWeight: 500 }} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vesting Progress</p>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ 
                          width: `${analytics.totalShares ? 
                            (analytics.vestedShares / analytics.totalShares) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {analytics.totalShares ? 
                        `${Math.round((analytics.vestedShares / analytics.totalShares) * 100)}% vested` : 
                        'No shares'
                      }
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium">Total Shares</p>
                    <p className="text-lg">{analytics.totalShares?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="equity" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Enhanced Grant Type Chart */}
            <GrantTypeChart data={analytics?.valueByGrantType || []} />
            
            {/* Enhanced Company Value Chart */}
            <CompanyValueChart data={analytics?.companyValues || []} />
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          {/* Enhanced Portfolio Timeline */}
          <PortfolioTimeline portfolioData={analytics?.portfolioHistory || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioTab;
