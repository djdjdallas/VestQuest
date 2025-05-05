"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateVestedShares, calculateExerciseCost } from '@/utils/calculations';

export function EquityOverview({ grants }) {
  const totalShares = grants.reduce((sum, grant) => sum + grant.shares, 0);
  const totalVested = grants.reduce((sum, grant) => sum + calculateVestedShares(grant), 0);
  const totalValue = grants.reduce((sum, grant) => 
    sum + (calculateVestedShares(grant) * grant.current_fmv), 0
  );
  const totalExerciseCost = grants.reduce((sum, grant) => 
    sum + calculateExerciseCost(calculateVestedShares(grant), grant.strike_price), 0
  );
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalShares.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vested Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVested.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {((totalVested / totalShares) * 100).toFixed(1)}% vested
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Based on current FMV</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Exercise Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalExerciseCost.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">For vested shares</p>
        </CardContent>
      </Card>
    </div>
  );
}
