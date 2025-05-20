"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  DollarSign, 
  BarChart, 
  TrendingUp, 
  HelpCircle, 
  ChevronRight,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { EnhancedExerciseDecisionTool } from "@/components/decisions/EnhancedExerciseDecisionTool";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DecisionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const decisionTools = [
    {
      id: "exercise",
      title: "Exercise Decision Tool",
      description: "Determine the optimal timing and amount for exercising your stock options",
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      path: "/dashboard/decisions/exercise",
      tags: ["Tax Planning", "Financial Analysis"],
      timeEstimate: "5-10 minutes",
    },
    {
      id: "exit",
      title: "Exit Strategy Planner",
      description: "Plan your exit strategy to maximize returns and minimize tax implications",
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      path: "/dashboard/decisions/exit",
      tags: ["Long-term Planning", "Tax Optimization"],
      timeEstimate: "10-15 minutes",
    },
  ];

  const educationalContent = [
    {
      id: "basics",
      title: "Equity Decision Basics",
      description: "Learn the fundamental concepts behind stock option exercise decisions",
      icon: <HelpCircle className="h-5 w-5 text-blue-500" />,
    },
    {
      id: "tax",
      title: "Tax Implications Guide",
      description: "Understand the tax implications of different exercise and exit strategies",
      icon: <BarChart className="h-5 w-5 text-blue-500" />,
    },
  ];

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Equity Decision Tools"
        text="Get personalized guidance to optimize your equity decisions."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Decision Tools</TabsTrigger>
          <TabsTrigger value="education">Educational Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equity Decision Hub</CardTitle>
              <CardDescription>
                Make informed decisions about your equity with our comprehensive suite of tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("tools")}>
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center text-lg">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Decision Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Interactive tools to help you analyze exercise timing, exit strategies, and more
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" size="sm">Explore Tools</Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("education")}>
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center text-lg">
                      <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                      Educational Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Learn about equity concepts, tax implications, and decision frameworks
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" size="sm">Explore Resources</Button>
                  </CardFooter>
                </Card>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Your Decision Journey</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs font-bold text-primary block w-4 h-4 text-center">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Assess Your Situation</p>
                      <p className="text-sm text-muted-foreground">
                        Understand your financial position, risk tolerance, and goals
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs font-bold text-primary block w-4 h-4 text-center">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Analyze Your Options</p>
                      <p className="text-sm text-muted-foreground">
                        Use our interactive tools to model different scenarios
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs font-bold text-primary block w-4 h-4 text-center">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Make Informed Decisions</p>
                      <p className="text-sm text-muted-foreground">
                        Get personalized recommendations based on comprehensive analysis
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/20 border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  Quick Exercise Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Not sure where to start? Our Exercise Decision Tool provides personalized guidance on when to exercise your options.
                </p>
                <Button onClick={() => router.push("/dashboard/decisions/exercise")}>
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  Decision Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Understanding when to make key decisions is crucial for optimizing your equity value.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("education")}>
                  View Timeline Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-6">
            {decisionTools.map((tool) => (
              <Card key={tool.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {tool.icon}
                      <CardTitle className="ml-2">{tool.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Completion time: {tool.timeEstimate}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4 pb-4">
                  <Button variant="outline" asChild>
                    <Link href={tool.path}>
                      Start Tool
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Need Immediate Guidance?</CardTitle>
              <CardDescription>Try our simplified exercise decision analyzer right here</CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedExerciseDecisionTool />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Educational Resources</CardTitle>
              <CardDescription>
                Learn about key concepts to make better equity decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {educationalContent.map((content) => (
                  <Card key={content.id} className="border-primary/10 hover:border-primary/30 transition-all">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base flex items-center">
                        {content.icon}
                        <span className="ml-2">{content.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground">{content.description}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button variant="outline" size="sm">Read More</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Key Decision Factors</h3>
                <div className="space-y-4">
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-primary" />
                      Financial Capacity
                    </h4>
                    <p className="text-sm mt-1">
                      Your ability to afford exercise costs and associated taxes without overextending yourself financially.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                      Company Outlook
                    </h4>
                    <p className="text-sm mt-1">
                      Assessment of the company's future prospects, growth potential, and likely exit scenarios.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-primary" />
                      Tax Implications
                    </h4>
                    <p className="text-sm mt-1">
                      Understanding how different exercise timings affect your tax burden, including AMT considerations.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      Timing Considerations
                    </h4>
                    <p className="text-sm mt-1">
                      Expiration windows, vesting schedules, and potential company exit timelines that affect optimal decision timing.
                    </p>
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