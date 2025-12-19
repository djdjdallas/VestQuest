// src/hooks/useGrants.js

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
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        setGrants([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

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
              return {
                ...grant,
                vested_shares: 0,
                vested_percentage: 0,
                current_value: 0,
              };
            }
          })
        : [];

      setGrants(enrichedGrants);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Check if user is authenticated and fetch grants on initial load
  useEffect(() => {
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
        setError(err.message);
        setLoading(false);
      }
    };

    initialFetch();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

      if (error) {
        throw error;
      }

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
      return { data: null, error: err.message };
    }
  };

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

      if (error) {
        throw error;
      }

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
      return { data: null, error: err.message };
    }
  };

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

      if (error) {
        throw error;
      }

      // Remove the deleted grant from state
      setGrants((grants) => grants.filter((grant) => grant.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const getGrantById = (id) => {
    return grants.find((grant) => grant.id === id) || null;
  };

  const calculateTotalValue = () => {
    return grants.reduce((total, grant) => {
      const vested = calculateVestedShares(grant);
      return total + vested * grant.current_fmv;
    }, 0);
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
