// src/app/grants/new/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import EquityGrantForm from "@/components/grants/EquityGrantForm";

export default function NewGrantPage() {
  const router = useRouter();
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to add a grant");
      }

      // Add user_id to the form data
      const grantData = {
        ...formData,
        user_id: user.id,
      };

      // Remove fields that don't exist in your database
      delete grantData.liquidity_event_only;
      delete grantData.accelerated_vesting;

      const { data, error } = await supabase
        .from("equity_grants")
        .insert(grantData)
        .select();

      if (error) throw error;

      // Success! Redirect to the dashboard
      router.push("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Grant</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <EquityGrantForm onSubmit={handleSubmit} />
    </div>
  );
}
