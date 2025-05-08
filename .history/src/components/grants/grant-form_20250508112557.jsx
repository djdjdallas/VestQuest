"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { FileText, InfoIcon, Calculator } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GRANT_TYPES, VESTING_SCHEDULES } from "@/utils/constants";

// Create form schema with Zod
const formSchema = z.object({
  company_name: z.string().min(1, { message: "Company name is required" }),
  grant_type: z.enum(["ISO", "NSO", "RSU"], {
    required_error: "Please select a grant type",
  }),
  shares: z.coerce
    .number()
    .min(1, { message: "Number of shares must be at least 1" }),
  strike_price: z.coerce
    .number()
    .min(0, { message: "Strike price must be positive" }),
  grant_date: z.string().min(1, { message: "Grant date is required" }),
  vesting_start_date: z
    .string()
    .min(1, { message: "Vesting start date is required" }),
  vesting_cliff_date: z.string().min(1, { message: "Cliff date is required" }),
  vesting_end_date: z
    .string()
    .min(1, { message: "Vesting end date is required" }),
  vesting_schedule: z.enum(["monthly", "quarterly", "yearly"], {
    required_error: "Please select a vesting schedule",
  }),
  current_fmv: z.coerce.number().min(0, { message: "FMV must be positive" }),
  liquidity_event_only: z.boolean().optional(),
  accelerated_vesting: z.boolean().optional(),
  notes: z.string().optional(),
});

export function GrantForm({ initialData, onSubmit, isLoading }) {
  const today = new Date().toISOString().split("T")[0];

  // Generate default cliff and end dates
  const defaultCliffDate = new Date();
  defaultCliffDate.setFullYear(defaultCliffDate.getFullYear() + 1);
  const defaultCliffDateString = defaultCliffDate.toISOString().split("T")[0];

  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 4);
  const defaultEndDateString = defaultEndDate.toISOString().split("T")[0];

  // Parse any numeric values from initialData to ensure they're numbers
  const parsedInitialData = initialData
    ? {
        ...initialData,
        shares: Number(initialData.shares) || 0,
        strike_price: Number(initialData.strike_price) || 0,
        current_fmv: Number(initialData.current_fmv) || 0,
      }
    : null;

  // Initialize the form with defaultValues
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: parsedInitialData || {
      company_name: "",
      grant_type: "ISO",
      shares: 0,
      strike_price: 0,
      grant_date: today,
      vesting_start_date: today,
      vesting_cliff_date: defaultCliffDateString,
      vesting_end_date: defaultEndDateString,
      vesting_schedule: "monthly",
      current_fmv: 0,
      liquidity_event_only: false,
      accelerated_vesting: false,
      notes: "",
    },
  });

  // Watch values for calculations
  const shares = form.watch("shares") || 0;
  const strikePrice = form.watch("strike_price") || 0;
  const currentFMV = form.watch("current_fmv") || 0;
  const grantType = form.watch("grant_type");

  // Calculate exercise cost and potential value
  const exerciseCost = shares * strikePrice;
  const currentValue = shares * currentFMV;
  const potentialGain = currentValue - exerciseCost;

  // Handle form submission
  const handleSubmit = (values) => {
    // Ensure numeric values are properly converted
    const processedValues = {
      ...values,
      shares: Number(values.shares),
      strike_price: Number(values.strike_price),
      current_fmv: Number(values.current_fmv),
    };

    // Call the onSubmit function passed as a prop
    onSubmit(processedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Company Name</FormLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The name of the company issuing the equity</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Input {...field} placeholder="e.g., TechCorp Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grant_type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Grant Type</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            ISO: Incentive Stock Options
                            <br />
                            NSO: Non-Qualified Stock Options
                            <br />
                            RSU: Restricted Stock Units
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
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
                    <FormDescription>
                      {field.value === "ISO" &&
                        "Incentive Stock Options have potential tax advantages"}
                      {field.value === "NSO" &&
                        "Non-Qualified Stock Options are taxed at exercise"}
                      {field.value === "RSU" &&
                        "Restricted Stock Units vest into shares with no purchase required"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shares"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Number of Shares</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total number of shares in this grant</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value !== ""
                              ? parseInt(e.target.value, 10)
                              : ""
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="strike_price"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Strike Price ($)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            The price at which you can exercise your options
                            {grantType === "RSU" && " (usually N/A for RSUs)"}
                          </p>
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
                          field.onChange(
                            e.target.value !== ""
                              ? parseFloat(e.target.value)
                              : ""
                          )
                        }
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
                    <div className="flex items-center gap-2">
                      <FormLabel>Current FMV ($)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Current Fair Market Value of the stock (409A
                            valuation)
                          </p>
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
                          field.onChange(
                            e.target.value !== ""
                              ? parseFloat(e.target.value)
                              : ""
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grant_date"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Grant Date</FormLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The date when your equity was granted</p>
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

            {/* Equity Value Preview */}
            {shares > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 border mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Equity Value Preview</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Exercise Cost:</p>
                    <p className="font-medium">
                      $
                      {!isNaN(exerciseCost)
                        ? exerciseCost.toLocaleString()
                        : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Value:</p>
                    <p className="font-medium">
                      $
                      {!isNaN(currentValue)
                        ? currentValue.toLocaleString()
                        : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Potential Gain:</p>
                    <p
                      className={`font-medium ${
                        !isNaN(potentialGain) && potentialGain >= 0
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      $
                      {!isNaN(potentialGain)
                        ? potentialGain.toLocaleString()
                        : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Return %:</p>
                    <p className="font-medium">
                      {!isNaN(exerciseCost) &&
                      exerciseCost > 0 &&
                      !isNaN(potentialGain)
                        ? `${((potentialGain / exerciseCost) * 100).toFixed(
                            1
                          )}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Vesting Schedule</h3>

              <div className="grid grid-cols-2 gap-4">
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
                  name="vesting_schedule"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Vesting Schedule</FormLabel>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How often shares vest after the cliff period</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vesting_cliff_date"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Cliff Date</FormLabel>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              The date when your first chunk of equity vests
                              (typically 1 year after start)
                            </p>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormField
                control={form.control}
                name="liquidity_event_only"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Liquidity Event Only</FormLabel>
                      <FormDescription>
                        RSUs that only vest upon a liquidity event (IPO or
                        acquisition)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accelerated_vesting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Accelerated Vesting</FormLabel>
                      <FormDescription>
                        Vesting accelerates in case of acquisition
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add any additional information about this grant"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : initialData
              ? "Update Grant"
              : "Create Grant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
