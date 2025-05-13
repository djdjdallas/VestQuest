"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const checkUserAndFetchGrants = async () => {
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
        console.error("Error checking auth state:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkUserAndFetchGrants();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  /**
   * Fetch all grants for the current user
   */
  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching grants from Supabase...");

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        console.log("No authenticated user found");
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

      console.log("Grants fetched successfully:", data);

      // Calculate and add derived properties
      const enrichedGrants = data.map((grant) => {
        const vested = calculateVestedShares(grant);
        return {
          ...grant,
          vested_shares: vested,
          vested_percentage: (vested / grant.shares) * 100,
          current_value: vested * grant.current_fmv,
        };
      });

      setGrants(enrichedGrants || []);
    } catch (err) {
      console.error("Error fetching grants:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Add a new grant
   * @param {Object} grantData - The grant data to add
   */
  const addGrant = async (grantData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .insert([{ ...grantData, user_id: user.id }])
        .select();

      if (error) throw error;

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
      console.error("Error adding grant:", err);
      return { data: null, error: err.message };
    }
  };

  /**
   * Update an existing grant
   * @param {string} id - The ID of the grant to update
   * @param {Object} updates - The updated grant data
   */
  const updateGrant = async (id, updates) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

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
      console.error("Error updating grant:", err);
      return { data: null, error: err.message };
    }
  };

  /**
   * Delete a grant
   * @param {string} id - The ID of the grant to delete
   */
  const deleteGrant = async (id) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Not authenticated" };
      }

      const { error } = await supabase
        .from("equity_grants")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Remove the deleted grant from state
      setGrants(grants.filter((grant) => grant.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error deleting grant:", err);
      return { error: err.message };
    }
  };

  /**
   * Get a single grant by ID
   * @param {string} id - The ID of the grant to retrieve
   */
  const getGrantById = (id) => {
    return grants.find((grant) => grant.id === id) || null;
  };

  /**
   * Calculate total value of all grants
   */
  const calculateTotalValue = () => {
    return grants.reduce(
      (total, grant) =>
        total + calculateVestedShares(grant) * grant.current_fmv,
      0
    );
  };

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
