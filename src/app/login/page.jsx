// src/app/login/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  ChevronRightIcon,
  BarChart3,
  PieChartIcon,
  DollarSignIcon,
  LockIcon,
  MailIcon,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.user) {
        // Ensure the session is set
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Use window.location for a hard redirect to ensure middleware runs
          window.location.href = "/dashboard";
        } else {
          setError("Session could not be established. Please try again.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Color background with content */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
        {/* Abstract shapes for decoration */}
        <div className="absolute top-24 right-24 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-12 left-12 w-48 h-48 rounded-full bg-white/5 blur-xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-lg" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        {/* Animated elements */}
        <div className="absolute top-1/2 right-1/3 w-6 h-6 rounded-full bg-white/20 animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 rounded-full bg-white/20 animate-ping opacity-75" />

        {/* Top content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <LineChart className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Veston</h1>
          </div>
          <p className="mt-2 text-lg">
            Make informed decisions about your equity
          </p>
        </div>

        {/* Middle content */}
        <div className="space-y-16 relative z-10">
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Why join Veston?</h2>

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
              "Veston helped me understand the true value of my options package
              when negotiating my job offer. I was able to make an informed
              decision and negotiate better terms."
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

        {/* Bottom footer */}
        <div className="flex items-center justify-between text-sm relative z-10">
          <span>&copy; {new Date().getFullYear()} Veston, Inc.</span>
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
            <h1 className="text-2xl font-bold">Veston</h1>
          </div>

          <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Veston</CardTitle>
                  <CardDescription className="text-xs">
                    Equity Modeling Platform
                  </CardDescription>
                </div>
              </div>
              <CardTitle className="text-xl pt-2">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to manage your equity portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <MailIcon className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <LockIcon className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 h-11"
                >
                  {loading ? "Processing..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-6">
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/register")}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                By continuing, you agree to Veston's Terms of Service and
                Privacy Policy.
              </div>
            </CardFooter>
          </Card>

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
            &copy; {new Date().getFullYear()} Veston, Inc. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
