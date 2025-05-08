// src/hooks/useFinancialProfile.js
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useFinancialProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return null;
      }

      const { data, error } = await supabase
        .from("user_financial_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfile(data || null);
      return data;
    } catch (err) {
      console.error("Error fetching financial profile:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (values) => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("user_financial_profiles")
        .upsert({
          user_id: user.id,
          ...values,
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err) {
      console.error("Error updating financial profile:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}
