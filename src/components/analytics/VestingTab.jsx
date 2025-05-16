// src/components/analytics/VestingTab.jsx

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import VestingForecastChart from "./VestingForecastChart";
import VestingValueChart from "./VestingValueChart";
import CumulativeVestingChart from "./CumulativeVestingChart";
import { formatCurrency, formatPercentage } from "@/utils/format-utils";
import {
  CalendarIcon,
  TrendingUpIcon,
  PieChartIcon,
  ArrowUpIcon,
  ClockIcon,
  CircleDollarSignIcon
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
  Label
} from "recharts";

/**
 * Vesting Acceleration Rate calculation
 * Calculates the rate at which value is being added through vesting
 */
// Fallback format number function in case it's not imported correctly
const formatNumber = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US").format(value);
};

const calculateVestingAcceleration = (valueForecast) => {
  if (!valueForecast || valueForecast.length < 2) return { monthly: 0, annual: 0 };
  
  // Use only next 3 months for calculation to keep it relevant
  const relevantForecasts = valueForecast.slice(0, 3);
  const totalUpcoming = relevantForecasts.reduce((sum, item) => sum + item.value, 0);
  const monthlyRate = totalUpcoming / relevantForecasts.length;
  
  return {
    monthly: monthlyRate,
    annual: monthlyRate * 12
  };
};

/**
 * Calculate vesting completion percentage and remaining time
 */
const calculateVestingStatus = (analytics, grants) => {
  const totalShares = analytics.totalShares || 0;
  const vestedShares = analytics.vestedShares || 0;
  
  // Calculate percentage completed
  const percentageComplete = totalShares > 0 ? (vestedShares / totalShares) * 100 : 0;
  
  // Calculate remaining duration (find the latest vesting end date)
  const now = new Date();
  let latestEndDate = now;
  
  grants.forEach(grant => {
    if (grant.vesting_end_date) {
      const endDate = new Date(grant.vesting_end_date);
      if (endDate > latestEndDate) {
        latestEndDate = endDate;
      }
    }
  });
  
  // Calculate remaining months
  const remainingMonths = Math.max(
    0,
    Math.ceil((latestEndDate - now) / (1000 * 60 * 60 * 24 * 30.44))
  );
  
  return {
    percentageComplete,
    remainingMonths
  };
};

/**
 * Enhanced Vesting Forecast tab content
 * @param {Object} analytics - Analytics data object
 * @param {Array} grants - Equity grants
 */
export const VestingTab = ({ analytics, grants }) => {
  const [viewMode, setViewMode] = useState("forecast");
  
  // Calculate additional vesting metrics
  const accelerationRates = calculateVestingAcceleration(analytics.valueForecast);
  const vestingStatus = calculateVestingStatus(analytics, grants);
  
  // Generate vesting completion timeline data
  const generateTimelineData = () => {
    const now = new Date();
    const data = [];
    
    // Add current point
    data.push({
      date: 'Current',
      vestedValue: analytics.currentValue || 0,
      projectedValue: analytics.currentValue || 0,
      vestedShares: analytics.vestedShares || 0
    });
    
    // Add future projections (quarterly)
    for (let i = 1; i <= 4; i++) {
      const projectedDate = new Date(now);
      projectedDate.setMonth(now.getMonth() + i * 3);
      
      // Simple projection based on acceleration rate
      const additionalValue = accelerationRates.monthly * i * 3;
      
      data.push({
        date: `Q${i}`,
        vestedValue: null,
        projectedValue: (analytics.currentValue || 0) + additionalValue,
      });
    }
    
    return data;
  };
  
  const timelineData = generateTimelineData();
  
  // Calculate projected total value at the end of vesting
  const projectedTotalValue = analytics.currentValue + 
    (accelerationRates.monthly * vestingStatus.remainingMonths);
    
  return (
    <div className="space-y-6">
      {/* Vesting Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vesting Progress</p>
                <p className="text-2xl font-bold mt-1">
                  {formatPercentage(vestingStatus.percentageComplete)}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <PieChartIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(100, vestingStatus.percentageComplete)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatNumber(analytics.vestedShares)} of {formatNumber(analytics.totalShares)} shares vested
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Time</p>
                <p className="text-2xl font-bold mt-1">
                  {vestingStatus.remainingMonths} months
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <ClockIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Complete vesting expected by{" "}
              {new Date(
                new Date().setMonth(new Date().getMonth() + vestingStatus.remainingMonths)
              ).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(accelerationRates.monthly)}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {formatCurrency(accelerationRates.annual)} vesting per year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projected Value</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(projectedTotalValue)}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUpIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              At current FMV upon full vesting
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Vesting Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vesting Value Projection</CardTitle>
          <CardDescription>
            Projected equity value accumulation over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => value === 0 ? '0' : `$${(value / 1000).toFixed(0)}k`}
                />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Value']}
                />
                <ReferenceLine y={analytics.currentValue} label="Current" stroke="#6b7280" />
                <Area
                  type="monotone"
                  dataKey="vestedValue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorVested)"
                  name="Actual Vested"
                />
                <Area
                  type="monotone"
                  dataKey="projectedValue"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorProjected)"
                  name="Projected Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
            
      {/* Detailed Vesting Charts */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Vesting</TabsTrigger>
          <TabsTrigger value="value">Value Forecast</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <VestingForecastChart 
            data={analytics.vestingForecast || []} 
            grants={grants || []} 
          />
        </TabsContent>
        
        <TabsContent value="value">
          <VestingValueChart 
            data={analytics.valueForecast || []} 
            grants={grants || []} 
          />
        </TabsContent>
        
        <TabsContent value="cumulative">
          <CumulativeVestingChart
            forecastData={analytics.vestingForecast || []}
            vestedShares={analytics.vestedShares || 0}
            valueForecast={analytics.valueForecast || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VestingTab;
