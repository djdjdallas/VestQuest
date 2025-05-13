// src/app/register/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  UserIcon,
  CheckIcon,
} from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      // Register the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.user) {
        // Check if email confirmation is required
        if (data.session) {
          // No email confirmation required
          setSuccess("Registration successful!");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          // Email confirmation required
          setSuccess(
            "Registration successful! Please check your email to confirm your account."
          );
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
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
            <h1 className="text-3xl font-bold">VestQuest</h1>
          </div>
          <p className="mt-2 text-lg">
            Make informed decisions about your equity
          </p>
        </div>

        {/* Middle content */}
        <div className="space-y-16 relative z-10">
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Benefits of joining</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Interactive Dashboards</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Track your equity in real-time with customizable views
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Advanced Scenario Planning</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Compare multiple exit scenarios to optimize your strategy
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <DollarSignIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Tax-Optimized Decisions</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Minimize tax impact with our intelligent recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
            <blockquote className="text-sm italic">
              "Signing up for VestQuest changed the way I think about my equity
              compensation. The scenario modeling alone has saved me thousands
              in potential taxes."
            </blockquote>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-semibold text-xs">
                SJ
              </div>
              <div>
                <p className="text-sm font-medium">Sarah Johnson</p>
                <p className="text-xs opacity-80">
                  Product Manager at GrowthCo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
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

      {/* Right side - White background with registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Show logo on mobile only */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LineChart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">VestQuest</h1>
          </div>

          <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">VestQuest</CardTitle>
                  <CardDescription className="text-xs">
                    Equity Modeling Platform
                  </CardDescription>
                </div>
              </div>
              <CardTitle className="text-xl pt-2">Create an Account</CardTitle>
              <CardDescription>
                Sign up to start optimizing your equity decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckIcon className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

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
                  <label htmlFor="company" className="text-sm font-medium">
                    Company (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Your startup or company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
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
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <LockIcon className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={setAgreeTerms}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-none text-muted-foreground"
                  >
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 h-11 mt-2"
                >
                  {loading ? "Processing..." : "Sign Up"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-6">
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                By signing up, you agree to VestQuest's Terms of Service and
                Privacy Policy.
              </div>
            </CardFooter>
          </Card>

          {/* Mobile features summary */}
          <div className="mt-8 lg:hidden space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Why Register?</h2>
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
                <h3 className="font-medium">Track Grants</h3>
              </div>

              <div className="p-4 border rounded-lg">
                <PieChartIcon className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-medium">Model Scenarios</h3>
              </div>

              <div className="p-4 border rounded-lg">
                <DollarSignIcon className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-medium">Save on Taxes</h3>
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
