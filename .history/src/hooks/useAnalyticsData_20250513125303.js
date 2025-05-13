// src/hooks/useAnalyticsData.js

import { useState, useEffect, useCallback } from "react";
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
  const [analytics, setAnalytics] = useState({
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
  });
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Export analytics data
  const exportData = useCallback(() => {
    try {
      // Create analytics data object
      const exportData = {
        generated: new Date().toISOString(),
        metrics: {
          totalShares: analytics.totalShares,
          vestedShares: analytics.vestedShares,
          unvestedShares: analytics.unvestedShares,
          currentValue: analytics.currentValue,
          exerciseCost: analytics.exerciseCost,
          potentialGain: analytics.potentialGain,
        },
        valueByGrantType: analytics.valueByGrantType,
        valueByCompany: analytics.valueByCompany,
        vestingForecast: analytics.vestingForecast,
        scenarios: analytics.comparisonData,
      };

      // Convert to JSON
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

      toast.success("Analytics data exported successfully");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export analytics data");
    }
  }, [analytics]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch grants
        const { data: grantsData, error: grantsError } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("user_id", user.id);

        if (grantsError) throw grantsError;

        // Fetch scenarios
        const { data: scenariosData, error: scenariosError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("user_id", user.id);

        if (scenariosError) throw scenariosError;

        setGrants(grantsData || []);
        setScenarios(scenariosData || []);

        // Process data for analytics
        if (grantsData && grantsData.length > 0) {
          const analyticsData = processAnalyticsData(
            grantsData,
            scenariosData || [],
            timeframe,
            companyFilter
          );
          setAnalytics(analyticsData);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err.message);
        toast.error("Failed to load analytics data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [supabase, timeframe, companyFilter]);

  // Helper to get company options for filter
  const getCompanyOptions = useCallback(() => {
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
    companyOptions: getCompanyOptions(),
  };
};
