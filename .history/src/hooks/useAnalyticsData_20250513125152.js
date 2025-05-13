// src/hooks/useAnalyticsData.js
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { processAnalyticsData } from "@/utils/analytics-utils";

export const useAnalyticsData = (timeframe, companyFilter) => {
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [analytics, setAnalytics] = useState({
    // default values...
  });
  const [error, setError] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Fetch data logic...
        // Process data with imported utility functions
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

  return { loading, grants, scenarios, analytics, error };
};
