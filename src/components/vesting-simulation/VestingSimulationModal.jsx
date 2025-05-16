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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { Info, ChevronRight, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  
  const formatPercentage = (value) => {
    return `${Number(value).toFixed(1)}%`;
  };

  if (!simulationData) return null;
  
  // Determine if this is an acceleration simulation
  const isAccelerationSimulation = 
    simulationType === "schedule" && simulationData.title?.includes("Accelerated") ||
    simulationType === "scenario" && simulationData.title?.includes("M&A");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl"
        style={{ maxHeight: "100vh", overflow: "hidden" }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">
            {simulationType === "scenario"
              ? `Simulation: ${simulationData.title}`
              : `Vesting Schedule: ${simulationData.title}`}
          </DialogTitle>
          <DialogDescription>{simulationData.description}</DialogDescription>
        </DialogHeader>

        {/* Using native scrolling instead of ScrollArea component */}
        <div
          className="overflow-y-auto pr-2"
          style={{ maxHeight: "calc(90vh - 160px)" }}
        >
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {simulationData.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border p-3 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    {metric.label}
                  </p>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Vesting Visualization</h3>
                {isAccelerationSimulation && (
                  <div className="flex items-center gap-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    <Activity size={16} />
                    <span>Acceleration Enabled</span>
                  </div>
                )}
              </div>
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
                    {simulationData.chartConfig?.showValue && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                    )}
                    <RechartsTooltip
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
                    {simulationData.chartConfig?.showPercentage && (
                      <Line
                        type="monotone"
                        dataKey="percentageVested"
                        name="Percentage Vested"
                        stroke="#8884d8"
                        yAxisId="left"
                      />
                    )}
                    {simulationData.chartConfig?.showValue && (
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Value"
                        stroke="#22c55e"
                        yAxisId="right"
                      />
                    )}
                    
                    {/* Add dotted reference line for original schedule in acceleration scenarios */}
                    {isAccelerationSimulation && simulationData.chartConfig?.showReference && (
                      <Line
                        type="monotone"
                        dataKey="referenceVesting"
                        name="Standard Schedule"
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        yAxisId="left"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Acceleration Summary - Only shown for acceleration scenarios */}
            {isAccelerationSimulation && (
              <div className="rounded-lg border p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="mb-3 font-medium flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Acceleration Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vesting Progress</p>
                    <div className="flex flex-col gap-1">
                      {simulationData.metrics.find(m => m.label === "Acceleration Factor") && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Acceleration Factor:</span>
                          <span className="font-medium">
                            {simulationData.metrics.find(m => m.label === "Acceleration Factor").value}
                          </span>
                        </div>
                      )}
                      
                      {simulationData.metrics.find(m => m.label === "Months Saved") && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Months Saved:</span>
                          <span className="font-medium text-green-600">
                            {simulationData.metrics.find(m => m.label === "Months Saved").value} months
                          </span>
                        </div>
                      )}
                      
                      {simulationData.metrics.find(m => m.label === "Accelerated Shares") && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Accelerated Shares:</span>
                          <span className="font-medium text-green-600">
                            {formatNumber(simulationData.metrics.find(m => m.label === "Accelerated Shares").value)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {/* If M&A event, show details */}
                    {simulationData.title?.includes("M&A") && (
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-muted-foreground mb-1">M&A Impact</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Stock Price Multiplier:</span>
                          <span className="font-medium">1.5x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Acceleration Type:</span>
                          <span className="font-medium">Single-Trigger</span>
                        </div>
                      </div>
                    )}
                    
                    {/* For accelerated schedule, show date comparison */}
                    {simulationData.metrics.find(m => m.label === "Standard End Date") && (
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-muted-foreground mb-1">Timeline Comparison</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Standard End:</span>
                          <span className="font-medium">
                            {simulationData.metrics.find(m => m.label === "Standard End Date").value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Accelerated End:</span>
                          <span className="font-medium text-green-600">
                            {simulationData.metrics.find(m => m.label === "Accelerated End Date").value}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
                              : event.type === "acceleration"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {event.type === "positive" ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : event.type === "negative" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : event.type === "acceleration" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <Info className="h-3 w-3" />
                          )}
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
              <div className="rounded-lg bg-muted/50 p-4 text-sm mb-4">
                <h3 className="mb-2 font-medium flex items-center gap-2">
                  <Info size={16} />
                  Important Notes
                </h3>
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
        </div>

        <DialogFooter className="border-t mt-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {simulationType === "schedule" && (
            <Button 
              variant="secondary"
              onClick={() => window.print()}
              className="hidden md:flex"
            >
              Print / Save as PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
