"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
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
      const { data, error } = await supabase
        .from("equity_grants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate and add derived properties
      const enrichedGrants = data.map((grant) => ({
        ...grant,
        vested_shares: calculateVestedShares(grant),
        vested_percentage: (calculateVestedShares(grant) / grant.shares) * 100,
        current_value: calculateVestedShares(grant) * grant.current_fmv,
      }));

      setGrants(enrichedGrants || []);
    } catch (err) {
      console.error("Error fetching grants:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new grant
   * @param {Object} grantData - The grant data to add
   */
  const addGrant = async (grantData) => {
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase
        .from("equity_grants")
        .insert([{ ...grantData, user_id: user.id }])
        .select();

      if (error) throw error;

      // Add the new grant to state with derived properties
      const newGrant = {
        ...data[0],
        vested_shares: calculateVestedShares(data[0]),
        vested_percentage:
          (calculateVestedShares(data[0]) / data[0].shares) * 100,
        current_value: calculateVestedShares(data[0]) * data[0].current_fmv,
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
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase
        .from("equity_grants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update the grant in state with derived properties
      const updatedGrant = {
        ...data,
        vested_shares: calculateVestedShares(data),
        vested_percentage: (calculateVestedShares(data) / data.shares) * 100,
        current_value: calculateVestedShares(data) * data.current_fmv,
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
    if (!user) {
      return { error: "Not authenticated" };
    }

    try {
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
