// src/components/analytics/OverviewMetrics.jsx

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  DollarSign,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  formatPercentage,
  safeValue,
} from "@/utils/format-utils";

/**
 * Component that displays an overview of key equity metrics
 * @param {Object} analytics - The analytics data object
 */
export const OverviewMetrics = ({ analytics }) => {
  // Calculate ROI percentage for display
  const roiPercentage =
    analytics.exerciseCost > 0
      ? (analytics.potentialGain / analytics.exerciseCost) * 100
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Current Portfolio Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(analytics.currentValue)}
          </div>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <span className="text-green-500 font-medium flex items-center">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {formatPercentage(roiPercentage)}
            </span>
            <span className="ml-2">return on cost</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vested vs Unvested
          </CardTitle>
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold">
              {formatCurrency(
                analytics.vestedShares *
                  (analytics.currentValue / Math.max(analytics.vestedShares, 1))
              )}
            </div>
            <div className="ml-2 text-sm text-muted-foreground">
              of{" "}
              {formatCurrency(
                analytics.totalShares *
                  (analytics.currentValue / Math.max(analytics.vestedShares, 1))
              )}
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{
                width: `${
                  analytics.totalShares > 0
                    ? (analytics.vestedShares / analytics.totalShares) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {analytics.totalShares > 0
                ? formatPercentage(
                    (analytics.vestedShares / analytics.totalShares) * 100
                  )
                : "0%"}{" "}
              Vested
            </span>
            <span>
              {analytics.totalShares > 0
                ? formatPercentage(
                    (analytics.unvestedShares / analytics.totalShares) * 100
                  )
                : "0%"}{" "}
              Unvested
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Gain</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(analytics.potentialGain)}
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exercise Cost</span>
            <span>{formatCurrency(analytics.exerciseCost)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewMetrics;
