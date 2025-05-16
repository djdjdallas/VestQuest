// src/hooks/useAnalyticsData.js

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  processAnalyticsData,
  generateVestingForecast,
  generatePortfolioHistory,
  processScenarioComparisons,
} from "@/utils/analytics-utils";

/**
 * Custom hook for fetching and processing analytics data
 * @param {string} timeframe - Time period filter
 * @param {string} companyFilter - Company name filter
 * @returns {Object} Analytics data, loading state, and error
 */
export const useAnalyticsData = (timeframe, companyFilter) => {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [rawData, setRawData] = useState({ grants: [], scenarios: [] });
  const [error, setError] = useState(null);
  const supabase = createClient();
  
  // Process analytics data using memoization to avoid unnecessary recalculations
  const analytics = useMemo(() => {
    if (rawData.grants.length === 0) {
      return {
        totalShares: 0,
        vestedShares: 0,
        unvestedShares: 0,
        currentValue: 0,
        exerciseCost: 0,
        potentialGain: 0,
        valueByGrantType: [],
        valueByCompany: [],
        vestingForecast: [],
        valueForecast: [],
        comparisonData: [],
        portfolioHistory: [],
      };
    }
    
    const result = processAnalyticsData(
      rawData.grants,
      rawData.scenarios,
      timeframe,
      companyFilter
    );
    
    // Debug logging for vesting forecast
    console.log("Analytics processed - vesting forecast:", result.vestingForecast);
    
    // Ensure vestingForecast is always defined
    if (!result.vestingForecast) {
      result.vestingForecast = [];
    }
    
    return result;
  }, [rawData, timeframe, companyFilter]);

  // Enhanced export analytics data with multiple format options
  const exportData = useCallback((format = 'json') => {
    try {
      // Create analytics data object with more comprehensive data
      const exportData = {
        metadata: {
          generated: new Date().toISOString(),
          timeframe,
          companyFilter,
          exportVersion: '2.0',
        },
        summary: {
          totalShares: analytics.totalShares,
          vestedShares: analytics.vestedShares,
          unvestedShares: analytics.unvestedShares,
          currentValue: analytics.currentValue,
          exerciseCost: analytics.exerciseCost,
          potentialGain: analytics.potentialGain,
          isoValue: analytics.isoValue || 0,
          rsuValue: analytics.rsuValue || 0,
          isoPercentage: analytics.isoPercentage || 0,
          rsuPercentage: analytics.rsuPercentage || 0,
        },
        distribution: {
          byGrantType: analytics.valueByGrantType || [],
          byCompany: analytics.valueByCompany || [],
        },
        forecasts: {
          vesting: analytics.vestingForecast || [],
          value: analytics.valueForecast || [],
          portfolio: analytics.portfolioHistory || [],
        },
        scenarios: analytics.comparisonData || [],
        grants: grants.map(grant => ({
          id: grant.id,
          company: grant.company_name,
          type: grant.grant_type,
          shares: grant.shares,
          vestedShares: calculateDetailedVesting(grant).vestedShares,
          unvestedShares: calculateDetailedVesting(grant).unvestedShares,
          currentFMV: grant.current_fmv,
          strikePrice: grant.strike_price,
          grantDate: grant.grant_date,
          vestingStartDate: grant.vesting_start_date,
          vestingEndDate: grant.vesting_end_date,
          vestingSchedule: grant.vesting_schedule,
        })),
      };

      // Format selection handling
      if (format === 'csv') {
        // Generate CSV for main metrics
        const csvRows = [];
        
        // Add headers
        csvRows.push([
          'Metric', 'Value'
        ].join(','));
        
        // Add summary metrics
        Object.entries(exportData.summary).forEach(([key, value]) => {
          csvRows.push([
            key, 
            typeof value === 'number' ? value : `"${value}"`
          ].join(','));
        });
        
        // Add distribution data
        csvRows.push(['\nDistribution by Grant Type'].join(','));
        csvRows.push(['Type', 'Value'].join(','));
        exportData.distribution.byGrantType.forEach(item => {
          csvRows.push([`"${item.name}"`, item.value].join(','));
        });
        
        csvRows.push(['\nDistribution by Company'].join(','));
        csvRows.push(['Company', 'Value'].join(','));
        exportData.distribution.byCompany.forEach(item => {
          csvRows.push([`"${item.name}"`, item.value].join(','));
        });
        
        // Convert to CSV string
        const csvContent = csvRows.join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const formattedDate = new Date().toISOString().split("T")[0];
        link.download = `vestquest-analytics-${formattedDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Default JSON export
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create and download file
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const formattedDate = new Date().toISOString().split("T")[0];
        link.download = `vestquest-analytics-${formattedDate}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success(`Analytics data exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export analytics data");
    }
  }, [analytics, grants, timeframe, companyFilter]);

  // Fetch data from Supabase
  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        // Use Promise.all to fetch grants and scenarios in parallel
        const [grantsResponse, scenariosResponse] = await Promise.all([
          supabase
            .from("equity_grants")
            .select("*")
            .eq("user_id", user.id),
          supabase
            .from("scenarios")
            .select("*")
            .eq("user_id", user.id)
        ]);
        
        // Check for errors
        if (grantsResponse.error) throw grantsResponse.error;
        if (scenariosResponse.error) throw scenariosResponse.error;
        
        const grantsData = grantsResponse.data || [];
        const scenariosData = scenariosResponse.data || [];
        
        if (isMounted) {
          setGrants(grantsData);
          setScenarios(scenariosData);
          setRawData({ grants: grantsData, scenarios: scenariosData });
          // Analytics processing happens in the useMemo hook now
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        if (isMounted) {
          setError(err.message);
          toast.error("Failed to load analytics data. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalyticsData();
    
    // Cleanup function to prevent state updates if the component unmounts
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Helper to get company options for filter
  const companyOptions = useMemo(() => {
    const options = [{ value: "all", label: "All Companies" }];

    // Build unique company options from grants
    const uniqueCompanies = new Map();
    grants.forEach((grant) => {
      if (
        grant &&
        grant.company_name &&
        !uniqueCompanies.has(grant.company_name)
      ) {
        uniqueCompanies.set(grant.company_name, {
          value: grant.company_name,
          label: grant.company_name,
        });
      }
    });

    return [...options, ...uniqueCompanies.values()];
  }, [grants]);

  return {
    loading,
    grants,
    scenarios,
    analytics,
    error,
    exportData,
    companyOptions,
  };
};
