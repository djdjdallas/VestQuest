"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ScenarioResults({ scenario }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{scenario.scenario_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Exit Value:</span>
            <span className="font-medium">${scenario.exit_value.toLocaleString()}/share</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shares Exercised:</span>
            <span className="font-medium">{scenario.shares_exercised.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Exercise Cost:</span>
            <span className="font-medium">${scenario.exercise_cost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Gross Proceeds:</span>
            <span className="font-medium">${scenario.gross_proceeds.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax Liability:</span>
            <span className="font-medium text-red-600">-${scenario.tax_liability.toLocaleString()}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Net Proceeds:</span>
            <span className="text-green-600">${scenario.net_proceeds.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ROI:</span>
            <span className="font-medium">{scenario.roi_percentage.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
