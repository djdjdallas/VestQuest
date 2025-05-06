// src/components/decisions/DecisionLayout.jsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";

export function DecisionLayout({
  title,
  description,
  children,
  steps,
  currentStep = 0,
  onBack,
  onNext,
  isComplete = false,
}) {
  return (
    <DashboardShell>
      <DashboardHeader heading={title} text={description}>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/education">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Education
          </Link>
        </Button>
      </DashboardHeader>

      <div className="mb-8">
        {/* Progress steps */}
        {steps && steps.length > 0 && (
          <div className="flex items-center justify-between max-w-md mx-auto mb-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                    ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                <span
                  className={`text-xs ${
                    index === currentStep
                      ? "font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        <Card className="p-6">{children}</Card>

        {/* Navigation buttons */}
        {steps && steps.length > 0 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <Button onClick={onNext} disabled={isComplete}>
              {currentStep < steps.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
