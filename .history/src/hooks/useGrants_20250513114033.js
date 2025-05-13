"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateVestedShares } from "@/utils/calculations";

/**
 * Custom hook for managing equity grants
 * Provides functions for fetching, adding, updating, and deleting grants
 */
export function useGrants() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClient();

  // Check if user is authenticated and fetch grants on initial load
  useEffect(() => {
    console.log("useGrants hook initialized");

    const checkUserAndFetchGrants = async () => {
      console.log("Running checkUserAndFetchGrants");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log(
          "Auth user check result:",
          user ? "Logged in" : "Not logged in"
        );
        setUser(user);

        if (user) {
          console.log("User is authenticated, fetching grants");
          await fetchGrants();
        } else {
          console.log("No authenticated user, setting grants to empty array");
          setGrants([]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in checkUserAndFetchGrants:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkUserAndFetchGrants();

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
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        console.log("Cleaning up auth listener subscription");
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

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

      if (!data || data.length === 0) {
        console.log("No grants found for user");
        setGrants([]);
        setLoading(false);
        return;
      }

      // Calculate and add derived properties
      console.log("Processing grant data...");
      const enrichedGrants = data.map((grant) => {
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
      });

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

  /**
   * Add a new grant
   * @param {Object} grantData - The grant data to add
   */
  const addGrant = async (grantData) => {
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

  /**
   * Update an existing grant
   * @param {string} id - The ID of the grant to update
   * @param {Object} updates - The updated grant data
   */
  const updateGrant = async (id, updates) => {
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

      setGrants(
        grants.map((grant) => (grant.id === id ? updatedGrant : grant))
      );

      return { data: updatedGrant, error: null };
    } catch (err) {
      console.error("Error in updateGrant:", err);
      return { data: null, error: err.message };
    }
  };

  /**
   * Delete a grant
   * @param {string} id - The ID of the grant to delete
   */
  const deleteGrant = async (id) => {
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
      setGrants(grants.filter((grant) => grant.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error in deleteGrant:", err);
      return { error: err.message };
    }
  };

  /**
   * Get a single grant by ID
   * @param {string} id - The ID of the grant to retrieve
   */
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

  /**
   * Calculate total value of all grants
   */
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
