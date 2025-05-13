// src/hooks/useGrants.js - Fixed version

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateVestedShares } from "@/utils/calculations";

export function useGrants() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClient();

  /**
   * Fetch all grants for the current user
   */
  const fetchGrants = useCallback(async () => {
    console.log("fetchGrants called");
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        console.error("User error in fetchGrants:", userError);
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        console.log("No authenticated user found in fetchGrants");
        setGrants([]);
        setLoading(false);
        return;
      }

      console.log("Fetching grants for user:", user.id);

      // Make the query to get grants
      const { data, error } = await supabase
        .from("equity_grants")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log(
        "Grants fetch complete. Result count:",
        data ? data.length : 0
      );

      // Calculate and add derived properties
      const enrichedGrants = data
        ? data.map((grant) => {
            try {
              const vested = calculateVestedShares(grant);
              return {
                ...grant,
                vested_shares: vested,
                vested_percentage: (vested / grant.shares) * 100,
                current_value: vested * grant.current_fmv,
              };
            } catch (calcError) {
              console.error(
                "Error calculating vested shares for grant:",
                grant.id,
                calcError
              );
              return {
                ...grant,
                vested_shares: 0,
                vested_percentage: 0,
                current_value: 0,
              };
            }
          })
        : [];

      console.log("Setting grants state with enriched data");
      setGrants(enrichedGrants);
    } catch (err) {
      console.error("Error in fetchGrants:", err);
      setError(err.message);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  }, [supabase]);

  // Check if user is authenticated and fetch grants on initial load
  useEffect(() => {
    console.log("useGrants hook initialized");

    // Immediate function to fetch grants
    const initialFetch = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          await fetchGrants();
        } else {
          setGrants([]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initial fetch:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    initialFetch();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        const currentUser = session?.user;
        setUser(currentUser);

        if (currentUser) {
          await fetchGrants();
        } else {
          setGrants([]);
          setLoading(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchGrants, supabase.auth]);

  // Rest of the hook implementation...
  const addGrant = async (grantData) => {
    // Implementation remains the same
    console.log("addGrant called with data:", grantData);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No authenticated user found in addGrant");
        return { data: null, error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .insert([{ ...grantData, user_id: user.id }])
        .select();

      if (error) {
        console.error("Error adding grant to Supabase:", error);
        throw error;
      }

      console.log("Grant added successfully:", data[0]);

      // Add the new grant to state with derived properties
      const vested = calculateVestedShares(data[0]);
      const newGrant = {
        ...data[0],
        vested_shares: vested,
        vested_percentage: (vested / data[0].shares) * 100,
        current_value: vested * data[0].current_fmv,
      };

      setGrants((prevGrants) => [newGrant, ...prevGrants]);
      return { data: newGrant, error: null };
    } catch (err) {
      console.error("Error in addGrant:", err);
      return { data: null, error: err.message };
    }
  };

  const updateGrant = async (id, updates) => {
    // Implementation remains the same
    console.log("updateGrant called for ID:", id, "with updates:", updates);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No authenticated user found in updateGrant");
        return { data: null, error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating grant in Supabase:", error);
        throw error;
      }

      console.log("Grant updated successfully:", data);

      // Update the grant in state with derived properties
      const vested = calculateVestedShares(data);
      const updatedGrant = {
        ...data,
        vested_shares: vested,
        vested_percentage: (vested / data.shares) * 100,
        current_value: vested * data.current_fmv,
      };

      setGrants((grants) =>
        grants.map((grant) => (grant.id === id ? updatedGrant : grant))
      );

      return { data: updatedGrant, error: null };
    } catch (err) {
      console.error("Error in updateGrant:", err);
      return { data: null, error: err.message };
    }
  };

  const deleteGrant = async (id) => {
    // Implementation remains the same
    console.log("deleteGrant called for ID:", id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No authenticated user found in deleteGrant");
        return { error: "Not authenticated" };
      }

      const { error } = await supabase
        .from("equity_grants")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting grant from Supabase:", error);
        throw error;
      }

      console.log("Grant deleted successfully");

      // Remove the deleted grant from state
      setGrants((grants) => grants.filter((grant) => grant.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error in deleteGrant:", err);
      return { error: err.message };
    }
  };

  const getGrantById = (id) => {
    const grant = grants.find((grant) => grant.id === id);
    console.log(
      "getGrantById called for ID:",
      id,
      "Result:",
      grant ? "Found" : "Not found"
    );
    return grant || null;
  };

  const calculateTotalValue = () => {
    const total = grants.reduce((total, grant) => {
      const vested = calculateVestedShares(grant);
      return total + vested * grant.current_fmv;
    }, 0);
    console.log("calculateTotalValue called, result:", total);
    return total;
  };

  console.log(
    "useGrants hook returning, grants count:",
    grants.length,
    "loading:",
    loading,
    "error:",
    error
  );

  return {
    grants,
    loading,
    error,
    user,
    addGrant,
    updateGrant,
    deleteGrant,
    getGrantById,
    calculateTotalValue,
    refetch: fetchGrants,
  };
}
