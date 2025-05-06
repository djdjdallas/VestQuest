"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { LineChart, InfoIcon } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";

// Create form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, { message: "Scenario name is required" }),
  description: z.string().optional(),
  exit_type: z.enum(["IPO", "Acquisition", "Secondary", "Custom"], {
    required_error: "Please select an exit type",
  }),
  exit_date: z.string().min(1, { message: "Exit date is required" }),
  share_price: z
    .number()
    .min(0.01, { message: "Share price must be positive" }),
  grant_id: z.string().optional(),
  shares_included: z.number().optional(),
});

export function ScenarioForm({ initialData, onSubmit, isLoading }) {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Initialize the form with defaultValues
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      exit_type: "IPO",
      exit_date: format(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ), // 1 year from now
      share_price: 0,
      grant_id: "",
      shares_included: 0,
    },
  });

  // Fetch the user's grants to populate the grant selection dropdown
  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("equity_grants")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        setGrants(data || []);
      } catch (error) {
        console.error("Error fetching grants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [supabase]);

  // Handle form submission
  const handleSubmit = (values) => {
    // Call the onSubmit function passed as a prop
    onSubmit(values);
  };

  // Generate estimated values based on selected grant and share price
  const updateSharesIncluded = (grantId) => {
    if (!grantId) return;

    // Find the selected grant
    const selectedGrant = grants.find((grant) => grant.id === grantId);
    if (selectedGrant) {
      // Update shares_included field with the total shares from the grant
      form.setValue("shares_included", selectedGrant.shares);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Scenario Name</FormLabel>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>A descriptive name for your exit scenario</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input placeholder="e.g., IPO at $50/share" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Additional details about this scenario"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="exit_type"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Exit Type</FormLabel>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        IPO: Initial Public Offering
                        <br />
                        Acquisition: Company is acquired
                        <br />
                        Secondary: Private sale of shares
                        <br />
                        Custom: Other exit event
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IPO">IPO</SelectItem>
                    <SelectItem value="Acquisition">Acquisition</SelectItem>
                    <SelectItem value="Secondary">Secondary Sale</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exit_date"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Estimated Exit Date</FormLabel>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>When you expect this exit to occur</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="grant_id"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Apply to Grant</FormLabel>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select which equity grant to apply this scenario to</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  updateSharesIncluded(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="" disabled>
                      Loading grants...
                    </SelectItem>
                  ) : grants.length > 0 ? (
                    grants.map((grant) => (
                      <SelectItem key={grant.id} value={grant.id}>
                        {grant.company_name} - {grant.grant_type} (
                        {grant.shares} shares)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No grants found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="share_price"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Share Price ($)</FormLabel>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Expected price per share at exit</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shares_included"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Shares Included</FormLabel>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of shares to include in this scenario</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  {form.watch("grant_id") &&
                    form.watch("share_price") > 0 &&
                    form.watch("shares_included") > 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Estimated value: $
                        {(
                          form.watch("share_price") *
                          form.watch("shares_included")
                        ).toLocaleString()}
                      </div>
                    )}
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : initialData
              ? "Update Scenario"
              : "Create Scenario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
