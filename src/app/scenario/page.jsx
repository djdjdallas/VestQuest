"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ScenarioForm } from '@/components/scenario/ScenarioForm';
import { ScenarioResults } from '@/components/scenario/ScenarioResults';
import { ScenarioComparison } from '@/components/scenario/ScenarioComparison';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Scenario() {
  const [grants, setGrants] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchGrants();
    } else {
      setLoading(false);
    }
  };

  const fetchGrants = async () => {
    const { data, error } = await supabase
      .from('equity_grants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching grants:', error);
    } else {
      setGrants(data || []);
    }
    setLoading(false);
  };

  const handleScenarioCreate = (scenario) => {
    setScenarios([...scenarios, scenario]);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Scenario Modeling</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ScenarioForm grants={grants} onScenarioCreate={handleScenarioCreate} />
        
        <div className="space-y-6">
          {scenarios.map((scenario, index) => (
            <ScenarioResults key={index} scenario={scenario} />
          ))}
        </div>
      </div>
      
      {scenarios.length > 1 && (
        <ScenarioComparison scenarios={scenarios} />
      )}
    </div>
  );
}
