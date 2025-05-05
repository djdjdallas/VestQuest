"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ScenarioComparison({ scenarios }) {
  const chartData = scenarios.map(scenario => ({
    name: scenario.scenario_name,
    'Gross Proceeds': scenario.gross_proceeds,
    'Exercise Cost': scenario.exercise_cost,
    'Tax Liability': scenario.tax_liability,
    'Net Proceeds': scenario.net_proceeds,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Net Proceeds" fill="#22c55e" />
              <Bar dataKey="Tax Liability" fill="#ef4444" />
              <Bar dataKey="Exercise Cost" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
