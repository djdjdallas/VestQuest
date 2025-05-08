// src/components/profile/FinancialProfileForm.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  income: z.number().min(0, "Income must be a positive number"),
  availableCash: z.number().min(0, "Available cash must be a positive number"),
  otherInvestments: z
    .number()
    .min(0, "Investment value must be a positive number"),
  debt: z.number().min(0, "Debt must be a positive number"),
  monthlyExpenses: z
    .number()
    .min(0, "Monthly expenses must be a positive number"),
  retirementSavings: z
    .number()
    .min(0, "Retirement savings must be a positive number"),
  riskTolerance: z.enum(["very_low", "low", "medium", "high", "very_high"]),
  age: z
    .number()
    .min(18, "Age must be at least 18")
    .max(100, "Age must be less than 100"),
  hasOtherCompensation: z.boolean().default(false),
  isHomeowner: z.boolean().default(false),
});

export function FinancialProfileForm({ onSubmit, initialData }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      income: 0,
      availableCash: 0,
      otherInvestments: 0,
      debt: 0,
      monthlyExpenses: 0,
      retirementSavings: 0,
      riskTolerance: "medium",
      age: 30,
      hasOtherCompensation: false,
      isHomeowner: false,
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Save to Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("user_financial_profiles").upsert({
        user_id: user.id,
        ...values,
      });

      if (error) {
        throw error;
      }

      // Call the onSubmit callback
      if (onSubmit) {
        onSubmit(values);
      }
    } catch (error) {
      console.error("Error saving financial profile:", error);
      alert("Failed to save financial profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income field */}
          <FormField
            control={form.control}
            name="income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Income ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>
                  Your total annual income before taxes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Add other fields similar to income */}
          {/* ... */}

          <FormField
            control={form.control}
            name="riskTolerance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Tolerance</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your risk tolerance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="very_low">Very Conservative</SelectItem>
                    <SelectItem value="low">Somewhat Conservative</SelectItem>
                    <SelectItem value="medium">Moderate</SelectItem>
                    <SelectItem value="high">Somewhat Aggressive</SelectItem>
                    <SelectItem value="very_high">Very Aggressive</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Your comfort level with investment risk and volatility
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Financial Profile"}
        </Button>
      </form>
    </Form>
  );
}
