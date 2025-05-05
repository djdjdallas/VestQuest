import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useGrants() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGrants();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchGrants = async () => {
    try {
      const { data, error } = await supabase
        .from('equity_grants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrants(data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addGrant = async (grantData) => {
    try {
      const { data, error } = await supabase
        .from('equity_grants')
        .insert([{ ...grantData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setGrants([data, ...grants]);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const updateGrant = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('equity_grants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setGrants(grants.map(grant => grant.id === id ? data : grant));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const deleteGrant = async (id) => {
    try {
      const { error } = await supabase
        .from('equity_grants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGrants(grants.filter(grant => grant.id !== id));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  return {
    grants,
    loading,
    error,
    addGrant,
    updateGrant,
    deleteGrant,
    refetch: fetchGrants,
  };
}
