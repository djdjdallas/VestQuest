import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Info, Calendar, DollarSign, Building, BarChart } from "lucide-react";

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form validation schema
const grantFormSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  grant_type: z.enum(["ISO", "NSO", "RSU"], {
    required_error: "Please select a grant type",
  }),
  shares: z.coerce.number().min(1, "Number of shares must be at least 1"),
  strike_price: z.coerce.number().min(0, "Strike price must be at least 0"),
  current_fmv: z.coerce.number().min(0, "Fair market value must be at least 0"),
  grant_date: z.string().min(1, "Grant date is required"),
  vesting_start_date: z.string().min(1, "Vesting start date is required"),
  vesting_cliff_date: z.string().min(1, "Cliff date is required"),
  vesting_end_date: z.string().min(1, "Vesting end date is required"),
  vesting_schedule: z.enum(["monthly", "quarterly", "yearly"], {
    required_error: "Please select a vesting schedule",
  }),
  liquidity_event_only: z.boolean().default(false),
  accelerated_vesting: z.boolean().default(false),
  notes: z.string().optional(),
});

const EquityGrantForm = ({
  onSubmit,
  initialData,
  submitButtonText = "Save Grant",
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Set default dates
  const today = new Date().toISOString().split("T")[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const oneYearFromNowStr = oneYearFromNow.toISOString().split("T")[0];

  const fourYearsFromNow = new Date();
  fourYearsFromNow.setFullYear(fourYearsFromNow.getFullYear() + 4);
  const fourYearsFromNowStr = fourYearsFromNow.toISOString().split("T")[0];

  // Initialize form with defaults or initial data
  const form = useForm({
    resolver: zodResolver(grantFormSchema),
    defaultValues: initialData || {
      company_name: "",
      grant_type: "ISO",
      shares: 0,
      strike_price: 0,
      current_fmv: 0,
      grant_date: today,
      vesting_start_date: today,
      vesting_cliff_date: oneYearFromNowStr,
      vesting_end_date: fourYearsFromNowStr,
      vesting_schedule: "monthly",
      liquidity_event_only: false,
      accelerated_vesting: false,
      notes: "",
    },
  });

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
      }
      // Reset form if not in edit mode
      if (!initialData) {
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <CardTitle>
            {initialData ? "Edit Equity Grant" : "Add New Equity Grant"}
          </CardTitle>
        </div>
        <CardDescription>
          {initialData
            ? "Update the details of your existing equity grant"
            : "Add a new equity grant to track your startup equity"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="vesting">Vesting Details</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Company Name</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="w-80">
                                The name of the company that granted you the
                                equity
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <Input placeholder="Example: Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Grant Type */}
                  <FormField
                    control={form.control}
                    name="grant_type"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Grant Type</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="w-80">
                                  <strong>ISO:</strong> Incentive Stock Options
                                  (tax advantages)
                                  <br />
                                  <strong>NSO:</strong> Non-Qualified Stock
                                  Options
                                  <br />
                                  <strong>RSU:</strong> Restricted Stock Units
                                  (value is taxed as income when vested)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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

                  {/* Number of Shares */}
                  <FormField
                    control={form.control}
                    name="shares"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Number of Shares</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  Total number of shares in this grant
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strike Price */}
                  <FormField
                    control={form.control}
                    name="strike_price"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Strike Price ($)</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  The price per share at which you can purchase
                                  the stock. For RSUs, this is typically $0.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Current FMV */}
                  <FormField
                    control={form.control}
                    name="current_fmv"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Current FMV ($)</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  Current Fair Market Value per share, typically
                                  from the most recent 409A valuation
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Grant Date */}
                <FormField
                  control={form.control}
                  name="grant_date"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Grant Date</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">
                                The date when your equity was officially granted
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="date" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="vesting" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vesting Start Date */}
                  <FormField
                    control={form.control}
                    name="vesting_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Vesting Start Date</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  The date when your vesting period begins
                                  (often the same as grant date)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-8" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vesting Schedule */}
                  <FormField
                    control={form.control}
                    name="vesting_schedule"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Vesting Schedule</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  How frequently shares vest after the cliff
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vesting schedule" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cliff Date */}
                  <FormField
                    control={form.control}
                    name="vesting_cliff_date"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Cliff Date</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  The date when your first chunk of equity vests
                                  (typically 1 year after vesting start)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-8" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vesting End Date */}
                  <FormField
                    control={form.control}
                    name="vesting_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Vesting End Date</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  The date when your vesting is complete
                                  (typically 4 years after vesting start)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-8" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add any additional information about this grant"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Any details you'd like to remember about this grant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button
          onClick={form.handleSubmit(handleFormSubmit)}
          disabled={submitting}
        >
          {submitting ? "Saving..." : submitButtonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EquityGrantForm;
