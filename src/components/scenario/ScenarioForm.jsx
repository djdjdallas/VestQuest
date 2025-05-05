"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateScenarioResult } from '@/utils/calculations';

export function ScenarioForm({ grants, onScenarioCreate }) {
  const [selectedGrant, setSelectedGrant] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [exitValue, setExitValue] = useState(100);
  const [sharesToExercise, setSharesToExercise] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGrant) return;

    const grant = grants.find(g => g.id === selectedGrant);
    const result = calculateScenarioResult(
      grant,
      exitValue,
      sharesToExercise,
      scenarioName
    );

    onScenarioCreate(result);
    
    // Reset form
    setScenarioName('');
    setExitValue(100);
    setSharesToExercise(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Scenario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grant">Select Grant</Label>
            <Select value={selectedGrant} onValueChange={setSelectedGrant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a grant" />
              </SelectTrigger>
              <SelectContent>
                {grants.map((grant) => (
                  <SelectItem key={grant.id} value={grant.id}>
                    {grant.company_name} - {grant.shares} shares
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenarioName">Scenario Name</Label>
            <Input
              id="scenarioName"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., IPO at $500M"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitValue">Exit Price per Share ($)</Label>
            <Input
              id="exitValue"
              type="number"
              step="0.01"
              value={exitValue}
              onChange={(e) => setExitValue(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sharesToExercise">Shares to Exercise</Label>
            <Input
              id="sharesToExercise"
              type="number"
              value={sharesToExercise}
              onChange={(e) => setSharesToExercise(parseInt(e.target.value))}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Calculate Scenario
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
