import { BarChart3, ExternalLink, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RecentScenariosCard() {
  const scenarios = [
    {
      id: 1,
      name: "IPO at $50/share",
      date: "2 days ago",
      value: "$625,000",
      icon: LineChart,
    },
    {
      id: 2,
      name: "Acquisition at $40/share",
      date: "1 week ago",
      value: "$500,000",
      icon: BarChart3,
    },
    {
      id: 3,
      name: "Secondary sale at $35/share",
      date: "2 weeks ago",
      value: "$437,500",
      icon: LineChart,
    },
  ];

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <scenario.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {scenario.name}
                </p>
                <p className="text-sm text-muted-foreground">{scenario.date}</p>
              </div>
              <div className="ml-auto font-medium">{scenario.value}</div>
              <Button variant="ghost" size="icon" className="ml-2">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View scenario</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
