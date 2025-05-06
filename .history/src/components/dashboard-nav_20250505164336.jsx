import Link from "next/link";
import {
  BarChart,
  Clock,
  FileText,
  Home,
  LineChart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DashboardNav() {
  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Grants",
      href: "/dashboard/grants",
      icon: FileText,
    },
    {
      title: "Vesting",
      href: "/dashboard/vesting",
      icon: Clock,
    },
    {
      title: "Scenarios",
      href: "/dashboard/scenarios",
      icon: LineChart,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];
  return (
    <nav className="grid items-start gap-2 py-4">
      {items.map((item, index) => (
        <Link key={index} href={item.href}>
          <Button
            variant={item.isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              item.isActive ? "bg-primary/10 text-primary font-medium" : ""
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
