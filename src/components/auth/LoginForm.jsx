"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  User,
} from "lucide-react";
import { toast } from "sonner";

export function LoginForm({ className, ...props }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const supabase = createClient();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // Login process
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Force a HARD navigation
        window.location.href = "/dashboard";
      } else {
        // Validate signup data
        if (!firstName || !lastName) {
          throw new Error("First name and last name are required");
        }

        // Signup process with profile creation
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              company: company || null,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          // Create profile entry
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: email,
              first_name: firstName,
              last_name: lastName,
              company: company || null,
            });

          if (profileError) {
            // Profile creation failed but user was created successfully
            // Continue without throwing
          }

          setSuccess(
            "Account created successfully! Please check your email for the confirmation link."
          );

          // Reset the form
          setEmail("");
          setPassword("");
          setFirstName("");
          setLastName("");
          setCompany("");

          // Switch back to login mode
          setIsLogin(true);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`w-full max-w-md shadow-lg border-t-4 border-t-primary ${className}`}
      {...props}
    >
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
        <CardTitle className="text-xl pt-2">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Sign in to manage your equity portfolio"
            : "Get started with your equity management journey"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company (Optional)
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
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
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              {isLogin && (
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <LockIcon className="h-4 w-4" />
              </div>
              <Input
                id="password"
                type="password"
                placeholder={isLogin ? "••••••••" : "Create a password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="border-green-500 text-green-600 bg-green-50"
            >
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full py-2 h-11">
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t pt-6">
        <div className="text-sm text-center text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-primary hover:underline font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          By continuing, you agree to VestQuest's Terms of Service and Privacy
          Policy.
        </div>
      </CardFooter>
    </Card>
  );
}
