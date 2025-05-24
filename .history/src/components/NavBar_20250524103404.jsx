"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart,
  Menu,
  X,
  UserCircle,
  LogOut,
  Settings,
  ChevronDown,
  BarChart3,
  Calculator,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavBar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    // No need to redirect - AuthContext will handle this
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <LineChart className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Veston</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/calculator"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/calculator") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Calculator
            </Link>
            <Link
              href="/scenario"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/scenario") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Scenarios
            </Link>
            <Link
              href="/education"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/education") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Learn
            </Link>

            {/* User dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              href="/calculator"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-medium">Calculator</span>
            </Link>
            <Link
              href="/scenario"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PieChart className="h-5 w-5 text-primary" />
              <span className="font-medium">Scenarios</span>
            </Link>
            <Link
              href="/education"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LineChart className="h-5 w-5 text-primary" />
              <span className="font-medium">Learn</span>
            </Link>

            <div className="pt-4 border-t">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
