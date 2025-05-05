"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { calculateExerciseCost, calculateGrossProceeds, calculateTaxes } from '@/utils/calculations';

export function SimpleCalculator() {
  const [shares, setShares] = useState(1000);
  const [strikePrice, setStrikePrice] = useState(1.0);
  const [currentFMV, setCurrentFMV] = useState(10.0);
  const [exitPrice, setExitPrice] = useState(50.0);
  const [result, setResult] = useState(null);

  const calculate = () => {
    const exerciseCost = calculateExerciseCost(shares, strikePrice);
    const grossProceeds = calculateGrossProceeds(shares, exitPrice);
    const taxes = calculateTaxes(
      {
        grant_type: 'ISO',
        strike_price: strikePrice,
        shares,
      },
      strikePrice,
      exitPrice,
      shares
    );
    
    const netProceeds = grossProceeds - exerciseCost - taxes.total_tax;
    
    setResult({
      exerciseCost,
      grossProceeds,
      taxes,
      netProceeds,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Equity Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shares">Number of Shares</Label>
            <Input
              id="shares"
              type="number"
              value={shares}
              onChange={(e) => setShares(parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="strikePrice">Strike Price ($)</Label>
            <Input
              id="strikePrice"
              type="number"
              step="0.01"
              value={strikePrice}
              onChange={(e) => setStrikePrice(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currentFMV">Current FMV ($)</Label>
            <Input
              id="currentFMV"
              type="number"
              step="0.01"
              value={currentFMV}
              onChange={(e) => setCurrentFMV(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exitPrice">Exit Price ($)</Label>
            <Input
              id="exitPrice"
              type="number"
              step="0.01"
              value={exitPrice}
              onChange={(e) => setExitPrice(parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <Button onClick={calculate} className="w-full">Calculate</Button>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
            <div className="space-y-1">
              <p>Exercise Cost: ${result.exerciseCost.toLocaleString()}</p>
              <p>Gross Proceeds: ${result.grossProceeds.toLocaleString()}</p>
              <p>Total Taxes: ${result.taxes.total_tax.toLocaleString()}</p>
              <p className="font-bold text-green-600">
                Net Proceeds: ${result.netProceeds.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
