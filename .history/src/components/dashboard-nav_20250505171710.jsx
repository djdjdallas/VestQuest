"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart,
  Clock,
  FileText,
  Home,
  LineChart,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DashboardNav() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Grants",
      href: "/dashboard/grants",
      icon: FileText,
      isActive: pathname === "/dashboard/grants",
    },
    {
      title: "Vesting",
      href: "/dashboard/vesting",
      icon: Clock,
      isActive: pathname === "/dashboard/vesting",
    },
    {
      title: "Scenarios",
      href: "/dashboard/scenarios",
      icon: LineChart,
      isActive: pathname === "/dashboard/scenarios",
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart,
      isActive: pathname === "/dashboard/analytics",
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      isActive: pathname === "/dashboard/settings",
    },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "relative h-full transition-all duration-300 ease-in-out border-r bg-background/95 group",
        expanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => !expanded && setExpanded(true)}
      onMouseLeave={() => window.innerWidth < 1024 && setExpanded(false)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-[-12px] top-3 h-6 w-6 rounded-full border bg-background shadow-md hidden md:flex"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <div className="flex h-16 items-center justify-center border-b">
        <LineChart className={cn("h-6 w-6 text-primary", expanded && "mr-2")} />
        {expanded && <span className="text-xl font-bold">VestQuest</span>}
      </div>

      <nav className="grid items-start gap-2 p-4">
        {items.map((item, index) => (
          <Link key={index} href={item.href}>
            <Button
              variant={item.isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                item.isActive ? "bg-primary/10 text-primary font-medium" : "",
                !expanded && "justify-center"
              )}
              title={!expanded ? item.title : undefined}
            >
              <item.icon className={cn("h-5 w-5", expanded && "mr-2")} />
              {expanded && <span>{item.title}</span>}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
}
