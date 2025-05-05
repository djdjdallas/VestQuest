"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateVestedShares } from '@/utils/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, addMonths } from 'date-fns';

export function VestingChart({ grant }) {
  const generateVestingData = () => {
    const data = [];
    const startDate = new Date(grant.vesting_start_date);
    const endDate = new Date(grant.vesting_end_date);
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      data.push({
        date: format(currentDate, 'MMM yyyy'),
        vested: calculateVestedShares(grant, currentDate),
        percentage: (calculateVestedShares(grant, currentDate) / grant.shares) * 100,
      });
      currentDate = addMonths(currentDate, 3); // Quarterly data points
    }
    
    return data;
  };
  
  const data = generateVestingData();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vesting Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="vested" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Vested Shares"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Total Shares: {grant.shares.toLocaleString()}</p>
          <p>Currently Vested: {calculateVestedShares(grant).toLocaleString()}</p>
          <p>Vesting Progress: {((calculateVestedShares(grant) / grant.shares) * 100).toFixed(1)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
