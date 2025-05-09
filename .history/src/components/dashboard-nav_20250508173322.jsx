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
  Calculator,
  BookOpen,
  Calendar,
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
      subItems: [
        {
          title: "Timeline",
          href: "/dashboard/vesting",
          isActive:
            pathname === "/dashboard/vesting" &&
            pathname !== "/dashboard/upcoming-events",
        },
        {
          title: "Upcoming Events",
          href: "/dashboard/upcoming-events",
          isActive: pathname === "/dashboard/upcoming-events",
        },
      ],
    },
    {
      title: "Scenarios",
      href: "/dashboard/scenarios",
      icon: LineChart,
      isActive: pathname === "/dashboard/scenarios",
    },
    {
      title: "Calculator",
      href: "/dashboard/calculator",
      icon: Calculator,
      isActive: pathname === "/dashboard/calculator",
      subItems: [
        {
          title: "Tax",
          href: "/dashboard/calculator/tax",
          isActive: pathname === "/dashboard/calculator/tax",
        },
      ],
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart,
      isActive: pathname === "/dashboard/analytics",
    },
    {
      title: "Education",
      href: "/dashboard/education",
      icon: BookOpen,
      isActive: pathname === "/dashboard/education",
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
          <div key={index}>
            <Link href={item.href}>
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

            {/* Show sub-items if expanded and the item has sub-items */}
            {expanded && item.subItems && (
              <div className="ml-7 mt-1 space-y-1">
                {item.subItems.map((subItem, subIndex) => (
                  <Link key={subIndex} href={subItem.href}>
                    <Button
                      variant={subItem.isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-8 text-sm",
                        subItem.isActive
                          ? "bg-primary/5 text-primary font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      <span>{subItem.title}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
