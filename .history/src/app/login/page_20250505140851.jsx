"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import LoginDecoration from "@/components/auth/LoginDecoration";
import {
  LineChart,
  ChevronRightIcon,
  BarChart3,
  PieChartIcon,
  DollarSignIcon,
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Color background with content */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
        {/* Add visual decoration */}
        <LoginDecoration />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <LineChart className="h-8 w-8" />
            <h1 className="text-3xl font-bold">VestQuest</h1>
          </div>
          <p className="mt-2 text-lg">
            Make informed decisions about your equity
          </p>
        </div>

        <div className="space-y-16 relative z-10">
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Why join VestQuest?</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Visualize Your Vesting</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Track your equity grants with intuitive dashboards and
                    charts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Model Different Scenarios</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    See potential outcomes with our powerful calculator
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <DollarSignIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Optimize Tax Impact</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Make better decisions with tax-aware recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
            <blockquote className="text-sm italic">
              "VestQuest helped me understand the true value of my options
              package when negotiating my job offer. I was able to make an
              informed decision and negotiate better terms."
            </blockquote>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-semibold text-xs">
                JD
              </div>
              <div>
                <p className="text-sm font-medium">Jamie Dimon</p>
                <p className="text-xs opacity-80">
                  Senior Engineer at TechStartup
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm relative z-10">
          <span>&copy; {new Date().getFullYear()} VestQuest, Inc.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              Terms
            </a>
            <a href="#" className="hover:underline">
              Privacy
            </a>
            <a href="#" className="hover:underline">
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* Right side - White background with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Show logo on mobile only */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LineChart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">VestQuest</h1>
          </div>

          <LoginForm />

          {/* Mobile features summary */}
          <div className="mt-8 lg:hidden space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Key Features</h2>
              <a
                href="#"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                Learn more <ChevronRightIcon className="h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-medium">Visualize Vesting</h3>
              </div>

              <div className="p-4 border rounded-lg">
                <PieChartIcon className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-medium">Model Scenarios</h3>
              </div>

              <div className="p-4 border rounded-lg">
                <DollarSignIcon className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-medium">Tax Optimization</h3>
              </div>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="mt-12 text-xs text-center text-muted-foreground lg:hidden">
            &copy; {new Date().getFullYear()} VestQuest, Inc. All rights
            reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
