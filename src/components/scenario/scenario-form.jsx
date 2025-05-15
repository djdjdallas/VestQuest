"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  LineChart,
  InfoIcon,
  BarChart3,
  PieChart,
  HelpCircle,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

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
  grant_id: z.string().min(1, { message: "Please select a grant" }),
  shares_included: z
    .number()
    .min(1, { message: "Number of shares must be positive" }),
});

export function ScenarioForm({
  initialData,
  onSubmit,
  onFormChange,
  isLoading,
  grants = [],
}) {
  const [selectedGrantData, setSelectedGrantData] = useState(null);
  const [priceMultiplier, setPriceMultiplier] = useState(3); // Default 3x current price

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
      ),
      share_price: 0,
      grant_id: "",
      shares_included: 0,
    },
  });

  // Watch form values for real-time updates
  const watchedValues = form.watch();

  // Update share price when price multiplier changes
  useEffect(() => {
    if (selectedGrantData && selectedGrantData.current_fmv) {
      const newPrice = selectedGrantData.current_fmv * priceMultiplier;
      form.setValue("share_price", parseFloat(newPrice.toFixed(2)));

      // Update scenario name if it matches the pattern
      const currentName = form.getValues("name");
      const suggestedName = `${
        selectedGrantData.company_name
      } Exit at $${newPrice.toFixed(2)}`;

      // Update scenario name if it follows the default pattern or is empty
      if (!currentName || currentName.includes("Exit at $")) {
        form.setValue("name", suggestedName);
      }

      // Notify parent about form changes
      if (onFormChange) {
        onFormChange(form.getValues());
      }
    }
  }, [priceMultiplier, selectedGrantData, form, onFormChange]);

  // Send form values to parent when they change, but debounce to prevent infinite loops
  useEffect(() => {
    // Only call onFormChange if we have valid data to preview
    if (
      onFormChange &&
      watchedValues.grant_id &&
      watchedValues.share_price > 0
    ) {
      // Create a timeout to debounce the updates
      const timeoutId = setTimeout(() => {
        onFormChange(form.getValues());
      }, 300); // 300ms debounce

      // Cleanup timeout on unmount or before next effect run
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues.grant_id, watchedValues.share_price, watchedValues.shares_included, onFormChange, form]);

  // Handle form submission
  const handleSubmit = (values) => {
    // Call the onSubmit function passed as a prop
    onSubmit(values);
  };

  // Handle grant selection
  const handleGrantChange = (grantId) => {
    if (!grantId) return;

    // Find the selected grant
    const selectedGrant = grants.find((grant) => grant.id === grantId);
    if (selectedGrant) {
      setSelectedGrantData(selectedGrant);

      // Default to including all shares from the grant
      form.setValue("shares_included", selectedGrant.shares);

      // Set default share price based on multiplier
      const newPrice = selectedGrant.current_fmv * priceMultiplier;
      form.setValue("share_price", parseFloat(newPrice.toFixed(2)));

      // Update scenario name with the grant and price info
      const suggestedName = `${
        selectedGrant.company_name
      } Exit at $${newPrice.toFixed(2)}`;
      const currentName = form.getValues("name");

      // Only auto-update the name if it's empty or follows our naming pattern
      if (!currentName || currentName.includes("Exit at $")) {
        form.setValue("name", suggestedName);
      }
    }
  };

  // Get the icon for the selected exit type
  const getExitTypeIcon = (type) => {
    switch (type) {
      case "IPO":
        return <LineChart className="h-4 w-4" />;
      case "Acquisition":
        return <BarChart3 className="h-4 w-4" />;
      case "Secondary":
        return <PieChart className="h-4 w-4" />;
      default:
        return <LineChart className="h-4 w-4" />;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="grant_id"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Select Grant</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select which equity grant to apply this scenario to</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleGrantChange(value);
                }}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grants.length > 0 ? (
                    grants.map((grant) => (
                      <SelectItem key={grant.id} value={grant.id}>
                        {grant.company_name} - {grant.grant_type} (
                        {grant.shares.toLocaleString()} shares)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no_grants" disabled>
                      No grants found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
              {selectedGrantData && (
                <FormDescription>
                  Current FMV: ${selectedGrantData.current_fmv?.toFixed(2)} |
                  Strike: ${selectedGrantData.strike_price?.toFixed(2)}
                </FormDescription>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="exit_type"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Exit Type</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        IPO: Initial Public Offering - Company lists on a stock
                        exchange
                        <br />
                        Acquisition: Company is acquired by another company
                        <br />
                        Secondary: Private sale of shares
                        <br />
                        Custom: Other exit event
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["IPO", "Acquisition", "Secondary", "Custom"].map((type) => (
                  <div
                    key={type}
                    className={`border rounded-md p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 ${
                      field.value === type
                        ? "border-primary bg-primary/10"
                        : "border-input"
                    }`}
                    onClick={() => field.onChange(type)}
                  >
                    {getExitTypeIcon(type)}
                    <span className="mt-1 text-sm">{type}</span>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Scenario Name</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A descriptive name for your exit scenario</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                <Textarea
                  placeholder="Additional details about this scenario, such as assumptions or notes"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="share_price"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Exit Price per Share ($)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expected price per share at exit</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="space-y-3">
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

                  {selectedGrantData && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Current ({selectedGrantData.current_fmv?.toFixed(2)})
                        </span>
                        <span>{priceMultiplier}x multiple</span>
                        <span>
                          ${(selectedGrantData.current_fmv * 10).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[priceMultiplier]}
                        min={1}
                        max={10}
                        step={0.5}
                        onValueChange={(values) =>
                          setPriceMultiplier(values[0])
                        }
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          Quick price multiplier
                        </div>
                        <Badge variant="outline">{priceMultiplier}x</Badge>
                      </div>
                    </div>
                  )}
                </div>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>When you expect this exit to occur</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
          name="shares_included"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Shares to Include</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of shares to include in this scenario</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
              {/* Replace FormDescription with regular div to avoid p > div nesting */}
              <div className="text-sm text-muted-foreground mt-1">
                {selectedGrantData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>
                        {field.value} of{" "}
                        {selectedGrantData.shares.toLocaleString()} total shares
                        (
                        {(
                          (field.value / selectedGrantData.shares) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() =>
                          form.setValue(
                            "shares_included",
                            selectedGrantData.shares
                          )
                        }
                      >
                        Use All
                      </Button>
                    </div>
                    {form.watch("share_price") > 0 && field.value > 0 && (
                      <div className="mt-2">
                        Estimated value: $
                        {(
                          form.watch("share_price") * field.value
                        ).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </FormItem>
          )}
        />

        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="sm:w-auto w-full"
              onClick={() => form.reset(initialData)}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="sm:w-auto w-full"
            >
              {isLoading
                ? "Saving..."
                : initialData?.id
                ? "Update Scenario"
                : "Create Scenario"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
