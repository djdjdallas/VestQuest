"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User,
  Mail,
  Building,
  Lock,
  BellRing,
  Settings as SettingsIcon,
  Save,
  LogOut,
  Calculator,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import AuthLoading from "@/components/auth/AuthLoading";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
  });
  const [taxSettings, setTaxSettings] = useState({
    federal_rate: 22.0,
    state_rate: 5.0,
    capital_gains_rate: 15.0,
    medicare_rate: 1.45,
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    vesting_reminders: true,
    grant_milestones: true,
    exit_opportunities: false,
    weekly_summaries: true,
  });
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch user data on page load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profileData) {
          setProfile({
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            email: profileData.email || user.email || "",
            company: profileData.company || "",
          });
        } else {
          // Set defaults from auth user
          setProfile({
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            email: user.email || "",
            company: user.user_metadata?.company || "",
          });
        }

        // Fetch tax settings
        const { data: taxData, error: taxError } = await supabase
          .from("tax_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (taxError && taxError.code !== "PGRST116") {
          throw taxError;
        }

        if (taxData) {
          setTaxSettings({
            federal_rate: taxData.federal_rate,
            state_rate: taxData.state_rate,
            capital_gains_rate: taxData.capital_gains_rate,
            medicare_rate: taxData.medicare_rate,
          });
        }

        // For now, notification settings are mocked - in real app, fetch from DB
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase, router]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      // Update profile in database
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        company: profile.company,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
        },
      });

      if (authError) throw authError;

      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle tax settings update
  const handleTaxSettingsUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("tax_settings").upsert({
        user_id: user.id,
        federal_rate: taxSettings.federal_rate,
        state_rate: taxSettings.state_rate,
        capital_gains_rate: taxSettings.capital_gains_rate,
        medicare_rate: taxSettings.medicare_rate,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Tax settings updated successfully");
    } catch (err) {
      console.error("Error updating tax settings:", err);
      toast.error(err.message || "Failed to update tax settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle notification settings update
  const handleNotificationUpdate = async () => {
    setSaving(true);
    try {
      // In a real app, you would save to a notifications_settings table
      // For now, we'll just show a success message
      toast.success("Notification settings updated successfully");
    } catch (err) {
      console.error("Error updating notifications:", err);
      toast.error(err.message || "Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  if (loading) {
    return <AuthLoading />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences."
      >
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tax">Tax Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="firstName"
                      value={profile.first_name}
                      onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="lastName"
                      value={profile.last_name}
                      onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email changes require verification and are handled through
                  account settings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) =>
                      setProfile({ ...profile, company: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure your tax rates for more accurate calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="federalRate">Federal Tax Rate (%)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <Input
                        id="federalRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxSettings.federal_rate}
                        onChange={(e) =>
                          setTaxSettings({
                            ...taxSettings,
                            federal_rate: parseFloat(e.target.value),
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateRate">State Tax Rate (%)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <Input
                        id="stateRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxSettings.state_rate}
                        onChange={(e) =>
                          setTaxSettings({
                            ...taxSettings,
                            state_rate: parseFloat(e.target.value),
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capitalGainsRate">
                      Capital Gains Rate (%)
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <Input
                        id="capitalGainsRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxSettings.capital_gains_rate}
                        onChange={(e) =>
                          setTaxSettings({
                            ...taxSettings,
                            capital_gains_rate: parseFloat(e.target.value),
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicareRate">Medicare Rate (%)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <Input
                        id="medicareRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxSettings.medicare_rate}
                        onChange={(e) =>
                          setTaxSettings({
                            ...taxSettings,
                            medicare_rate: parseFloat(e.target.value),
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Calculator className="h-4 w-4 mr-2 text-primary" />
                  Estimated Tax Impact
                </h3>
                <p className="text-sm text-muted-foreground">
                  With your current settings, your effective tax rate on equity
                  sales would be approximately
                  <span className="font-medium text-foreground">
                    {" "}
                    {(
                      taxSettings.federal_rate +
                      taxSettings.state_rate +
                      taxSettings.medicare_rate
                    ).toFixed(2)}
                    %
                  </span>{" "}
                  for short-term gains and{" "}
                  <span className="font-medium text-foreground">
                    {(
                      taxSettings.capital_gains_rate +
                      taxSettings.state_rate +
                      taxSettings.medicare_rate
                    ).toFixed(2)}
                    %
                  </span>{" "}
                  for long-term capital gains.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleTaxSettingsUpdate} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="emailNotifications"
                    className="flex flex-col space-y-1"
                  >
                    <span>Email Notifications</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Receive notifications via email
                    </span>
                  </Label>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email_notifications: checked,
                      })
                    }
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="vestingReminders"
                    className="flex flex-col space-y-1"
                  >
                    <span>Vesting Reminders</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Get notified about upcoming vesting events
                    </span>
                  </Label>
                  <Switch
                    id="vestingReminders"
                    checked={notifications.vesting_reminders}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        vesting_reminders: checked,
                      })
                    }
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="grantMilestones"
                    className="flex flex-col space-y-1"
                  >
                    <span>Grant Milestones</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Receive updates when you reach vesting milestones
                    </span>
                  </Label>
                  <Switch
                    id="grantMilestones"
                    checked={notifications.grant_milestones}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        grant_milestones: checked,
                      })
                    }
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="exitOpportunities"
                    className="flex flex-col space-y-1"
                  >
                    <span>Exit Opportunities</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Get updates about potential exit events for your companies
                    </span>
                  </Label>
                  <Switch
                    id="exitOpportunities"
                    checked={notifications.exit_opportunities}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        exit_opportunities: checked,
                      })
                    }
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="weeklySummaries"
                    className="flex flex-col space-y-1"
                  >
                    <span>Weekly Summaries</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Receive weekly updates about your equity portfolio
                    </span>
                  </Label>
                  <Switch
                    id="weeklySummaries"
                    checked={notifications.weekly_summaries}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        weekly_summaries: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNotificationUpdate} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Change Password</Label>
                  <Card className="border">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">
                            Current Password
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              id="currentPassword"
                              type="password"
                              className="pl-10"
                              placeholder="Enter your current password"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              id="newPassword"
                              type="password"
                              className="pl-10"
                              placeholder="Enter new password"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              id="confirmPassword"
                              type="password"
                              className="pl-10"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Cancel</Button>
                      <Button>Update Password</Button>
                    </CardFooter>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base">Account Preferences</Label>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label
                        htmlFor="darkMode"
                        className="flex flex-col space-y-1"
                      >
                        <span>Dark Mode</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Toggle dark mode theme
                        </span>
                      </Label>
                      <Switch id="darkMode" />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <Label
                        htmlFor="advancedMode"
                        className="flex flex-col space-y-1"
                      >
                        <span>Advanced Mode</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Show advanced options and calculations
                        </span>
                      </Label>
                      <Switch id="advancedMode" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base text-destructive">
                    Danger Zone
                  </Label>
                  <div className="border border-destructive/20 rounded-lg p-4 mt-2">
                    <h3 className="font-medium text-destructive mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. This
                      action cannot be undone.
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
