"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EquityOverview } from '@/components/dashboard/EquityOverview';
import { VestingChart } from '@/components/dashboard/VestingChart';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Dashboard() {
  const [grants, setGrants] = useState([]);
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
      <h1 className="text-3xl font-bold">Equity Dashboard</h1>
      
      <EquityOverview grants={grants} />
      
      <div className="grid gap-6 md:grid-cols-2">
        {grants.map((grant) => (
          <VestingChart key={grant.id} grant={grant} />
        ))}
      </div>
      
      {grants.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              No equity grants found. Add your first grant in the calculator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
