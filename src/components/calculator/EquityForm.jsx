"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  grant_type: z.enum(['ISO', 'NSO', 'RSU']),
  shares: z.number().min(1, 'Must have at least 1 share'),
  strike_price: z.number().min(0, 'Strike price must be positive'),
  grant_date: z.string(),
  vesting_start_date: z.string(),
  vesting_cliff_date: z.string(),
  vesting_end_date: z.string(),
  current_fmv: z.number().min(0, 'FMV must be positive'),
});

export function EquityForm() {
  const [loading, setLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: '',
      grant_type: 'ISO',
      shares: 0,
      strike_price: 0,
      grant_date: new Date().toISOString().split('T')[0],
      vesting_start_date: new Date().toISOString().split('T')[0],
      vesting_cliff_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vesting_end_date: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      current_fmv: 0,
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Please log in first');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('equity_grants').insert({
      ...values,
      user_id: user.id,
      vesting_schedule: 'monthly', // Default for MVP
    });

    if (error) {
      alert('Error saving grant: ' + error.message);
    } else {
      alert('Grant saved successfully!');
      form.reset();
    }
    
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Equity Grant</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="grant_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grant type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ISO">ISO</SelectItem>
                      <SelectItem value="NSO">NSO</SelectItem>
                      <SelectItem value="RSU">RSU</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shares"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Shares</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strike_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strike Price ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_fmv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current FMV ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grant_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vesting_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vesting Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vesting_cliff_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliff Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vesting_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vesting End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Grant'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
