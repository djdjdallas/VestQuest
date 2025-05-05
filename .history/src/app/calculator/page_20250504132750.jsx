"use client";

import { SimpleCalculator } from '@/components/calculator/SimpleCalculator';
import { EquityForm } from '@/components/calculator/EquityForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Calculator() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Equity Calculator</h1>
      
      <Tabs defaultValue="simple" className="w-full">
        <TabsList>
          <TabsTrigger value="simple">Quick Calculator</TabsTrigger>
          <TabsTrigger value="add">Add Grant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simple">
          <SimpleCalculator />
        </TabsContent>
        
        <TabsContent value="add">
          <EquityForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
