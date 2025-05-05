"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { GRANT_TYPES, VESTING_SCHEDULES } from "@/utils/constants";
import { InfoIcon, SaveIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  grant_type: z.enum(["ISO", "NSO", "RSU"], {
    required_error: "Please select a grant type",
  }),
  shares: z.number().min(1, "Must have at least 1 share"),
  strike_price: z.number().min(0, "Strike price must be positive"),
  grant_date: z.string().min(1, "Grant date is required"),
  vesting_start_date: z.string().min(1, "Vesting start date is required"),
  vesting_cliff_date: z.string().min(1, "Cliff date is required"),
  vesting_end_date: z.string().min(1, "Vesting end date is required"),
  vesting_schedule: z.enum(["monthly", "quarterly", "yearly"]),
  current_fmv: z.number().min(0, "FMV must be positive"),
  liquidity_event_only: z.boolean().optional(),
  accelerated_vesting: z.boolean().optional(),
  notes: z.string().optional(),
});

export function EquityForm({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      grant_type: "ISO",
      shares: 0,
      strike_price: 0,
      grant_date: today,
      vesting_start_date: today,
      vesting_cliff_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      vesting_end_date: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      vesting_schedule: "monthly",
      current_fmv: 0,
      liquidity_event_only: false,
      accelerated_vesting: false,
      notes: "",
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please log in first");
      }

      const { data, error } = await supabase
        .from("equity_grants")
        .insert({
          ...values,
          user_id: user.id,
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (onSuccess) {
        onSuccess(data[0]);
      }

      form.reset({
        company_name: "",
        grant_type: "ISO",
        shares: 0,
        strike_price: 0,
        grant_date: today,
        vesting_start_date: today,
        vesting_cliff_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        vesting_end_date: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        vesting_schedule: "monthly",
        current_fmv: 0,
        liquidity_event_only: false,
        accelerated_vesting: false,
        notes: "",
      });
    } catch (error) {
      if (onError) {
        onError(error.message);
      } else {
        alert("Error saving grant: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SaveIcon className="h-5 w-5 text-primary" />
          <CardTitle>Add Equity Grant</CardTitle>
        </div>
        <CardDescription>
          Save your equity grants to track and analyze them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
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
                        <Input {...field} />
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
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value || "0"))
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
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value || "0"))
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
                              <p>Current Fair Market Value of the stock</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value || "0"))
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
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
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
                        <FormLabel>Vesting Schedule</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                                (typically 1 year)
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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Grant"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
