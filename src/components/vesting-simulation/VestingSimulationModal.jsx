// src/components/vesting-simulation/VestingSimulationModal.jsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { Info } from "lucide-react";

export function VestingSimulationModal({
  isOpen,
  onClose,
  simulationData,
  simulationType,
}) {
  const formatDate = (date) => {
    if (!date) return "";
    return format(new Date(date), "MMM dd, yyyy");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (!simulationData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {simulationType === "scenario"
              ? `Simulation: ${simulationData.title}`
              : `Vesting Schedule: ${simulationData.title}`}
          </DialogTitle>
          <DialogDescription>{simulationData.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {simulationData.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border p-3 text-center"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-xl font-bold">
                  {metric.type === "currency"
                    ? formatCurrency(metric.value)
                    : metric.type === "percentage"
                    ? `${metric.value.toFixed(1)}%`
                    : metric.type === "text"
                    ? metric.value
                    : formatNumber(metric.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Vesting Visualization</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={simulationData.chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (typeof value === "string") {
                        return value;
                      }
                      return format(new Date(value), "MMM yyyy");
                    }}
                  />
                  <YAxis yAxisId="left" orientation="left" />
                  {simulationData.chartConfig.showValue && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                  )}
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "value")
                        return [formatCurrency(value), "Value"];
                      return [formatNumber(value), name];
                    }}
                    labelFormatter={(label) => {
                      if (typeof label === "string") return label;
                      return format(new Date(label), "MMMM d, yyyy");
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sharesVested"
                    name="Shares Vested"
                    stroke="#0f56b3"
                    yAxisId="left"
                  />
                  {simulationData.chartConfig.showPercentage && (
                    <Line
                      type="monotone"
                      dataKey="percentageVested"
                      name="Percentage Vested"
                      stroke="#8884d8"
                      yAxisId="left"
                    />
                  )}
                  {simulationData.chartConfig.showValue && (
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Value"
                      stroke="#22c55e"
                      yAxisId="right"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline Events */}
          {simulationData.events && simulationData.events.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Timeline Events</h3>
              <div className="space-y-3">
                {simulationData.events.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 rounded-full p-1.5 ${
                          event.type === "positive"
                            ? "bg-green-100 text-green-600"
                            : event.type === "negative"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <Info className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm">
                      {event.date ? formatDate(event.date) : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanatory Notes */}
          {simulationData.notes && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <h3 className="mb-2 font-medium">Important Notes</h3>
              <div className="space-y-2">
                {simulationData.notes.map((note, index) => (
                  <p key={index} className="text-muted-foreground">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
