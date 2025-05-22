"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlossaryTooltip } from "@/components/education/GlossaryTooltip";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  DollarSign,
  ArrowDownUp,
  Check,
  X,
  Scales,
  CalendarDays,
  FileText,
  BarChart,
  PieChart,
  Clock,
  AlertTriangle,
} from "lucide-react";

export function Lesson2EquityTypes() {
  const [activeType, setActiveType] = useState("iso");
  
  // Interactive comparison state
  const [scenarioTab, setScenarioTab] = useState("startup");
  
  const equityTypeData = {
    iso: {
      fullName: "Incentive Stock Options",
      description: "Tax-advantaged stock options that can qualify for special tax treatment if certain conditions are met.",
      commonAt: "Startups and private companies",
      taxAtGrant: "None",
      taxAtVesting: "None",
      taxAtExercise: "Potentially AMT (Alternative Minimum Tax)",
      taxAtSale: "Long-term capital gains if qualified holding periods are met",
      advantages: [
        "Potential for favorable tax treatment",
        "No tax due at grant or vesting",
        "Control over when to exercise and create a tax event"
      ],
      disadvantages: [
        "Must pay to exercise (cash outlay)",
        "Risk of AMT tax on paper gains",
        "Complex tax rules and holding requirements",
        "Potential loss if company value decreases after exercise"
      ],
      example: "You receive 10,000 ISOs with a $1 strike price. After vesting, you exercise when the FMV is $5/share, paying $10,000. If you hold the shares for 1+ year after exercise and 2+ years after grant, when you sell at $20/share, you pay long-term capital gains tax on the $19/share profit."
    },
    nso: {
      fullName: "Non-Qualified Stock Options",
      description: "Stock options that don't qualify for special tax treatment. More flexible than ISOs but with less favorable taxation.",
      commonAt: "Companies of all stages, often for consultants or contractors",
      taxAtGrant: "None (typically)",
      taxAtVesting: "None",
      taxAtExercise: "Ordinary income tax on the spread (FMV minus strike price)",
      taxAtSale: "Capital gains on any appreciation after exercise",
      advantages: [
        "No tax due at grant or vesting",
        "More flexible than ISOs (no income limits, can be granted to non-employees)",
        "Control over when to exercise and create a tax event"
      ],
      disadvantages: [
        "Must pay to exercise (cash outlay)",
        "Less favorable tax treatment than ISOs",
        "Potential loss if company value decreases after exercise"
      ],
      example: "You receive 5,000 NSOs with a $2 strike price. After vesting, you exercise when the FMV is $8/share, paying $10,000 to exercise. You immediately owe ordinary income tax on the $30,000 spread ($6/share × 5,000 shares). If you later sell at $15/share, you'll pay capital gains tax on the additional $7/share gain."
    },
    rsu: {
      fullName: "Restricted Stock Units",
      description: "A promise to deliver actual shares of company stock upon vesting. Unlike options, no purchase is required.",
      commonAt: "Later-stage private companies and public companies",
      taxAtGrant: "None",
      taxAtVesting: "Ordinary income tax on full FMV of vested shares",
      taxAtExercise: "N/A (no exercise required)",
      taxAtSale: "Capital gains on any appreciation after vesting",
      advantages: [
        "No purchase required - shares are simply delivered upon vesting",
        "Always have value as long as company stock has value",
        "Simpler to understand than options"
      ],
      disadvantages: [
        "Tax due at vesting regardless of liquidity",
        "No control over timing of taxation",
        "Typically fewer shares than equivalent stock options"
      ],
      example: "You're granted 2,000 RSUs. When they vest, the shares are worth $10 each. You immediately owe ordinary income tax on $20,000 (typically some shares are automatically sold to cover taxes). If you hold the remaining shares and sell later at $15/share, you'll pay capital gains tax on the $5/share appreciation."
    },
    rs: {
      fullName: "Restricted Stock",
      description: "Actual shares granted upfront, but subject to vesting restrictions and possible forfeiture until vested.",
      commonAt: "Very early-stage startups, founders, and early employees",
      taxAtGrant: "None if 83(b) election is filed; otherwise tax at vesting",
      taxAtVesting: "Ordinary income tax on FMV at vesting (unless 83(b) election filed)",
      taxAtExercise: "N/A (no exercise required)",
      taxAtSale: "Capital gains on appreciation since grant (with 83(b)) or vesting",
      advantages: [
        "Shareholder rights from day one (voting, dividends)",
        "With 83(b) election, can start capital gains clock early when FMV is low",
        "Always have value as long as company stock has value"
      ],
      disadvantages: [
        "Upfront purchase may be required",
        "Complex 83(b) election required for optimal tax treatment",
        "Risk of losing money if shares are forfeited before vesting"
      ],
      example: "You receive 1,000 restricted shares when the FMV is $0.50/share. You file an 83(b) election and pay income tax on $500. After 4 years of vesting, you sell the shares for $25/share, paying long-term capital gains tax on $24.50/share profit."
    }
  };
  
  // Comparison data for different company stages
  const comparisonData = {
    startup: {
      title: "Early-Stage Startup",
      scenario: "You join an early-stage startup with a $500K valuation and uncertain future.",
      comparison: [
        { type: "ISO", frequency: "Very Common", shares: "10,000", value: "$0.10/share", initialCost: "$1,000", potentialValue: "$100,000 at 10x growth", notes: "Best tax treatment if company succeeds" },
        { type: "NSO", frequency: "Common", shares: "10,000", value: "$0.10/share", initialCost: "$1,000", potentialValue: "$100,000 at 10x growth", notes: "Similar to ISOs but less favorable tax treatment" },
        { type: "RSU", frequency: "Rare", shares: "1,000", value: "$1/share", initialCost: "$0", potentialValue: "$10,000 at 10x growth", notes: "Uncommon at early stage" },
        { type: "Restricted Stock", frequency: "Sometimes", shares: "2,000", value: "$0.50/share", initialCost: "$1,000", potentialValue: "$20,000 at 10x growth", notes: "Good for very early employees with 83(b) election" }
      ]
    },
    growth: {
      title: "Growth-Stage Company",
      scenario: "You join a growth-stage company valued at $100M with strong revenue.",
      comparison: [
        { type: "ISO", frequency: "Common", shares: "5,000", value: "$5/share", initialCost: "$25,000", potentialValue: "$250,000 at 10x growth", notes: "Higher exercise cost but still tax-advantaged" },
        { type: "NSO", frequency: "Common", shares: "5,000", value: "$5/share", initialCost: "$25,000", potentialValue: "$250,000 at 10x growth", notes: "Similar to ISOs but immediate tax at exercise" },
        { type: "RSU", frequency: "Common", shares: "1,000", value: "$25/share", initialCost: "$0", potentialValue: "$250,000 at 10x growth", notes: "Becoming more common at this stage" },
        { type: "Restricted Stock", frequency: "Rare", shares: "N/A", value: "N/A", initialCost: "N/A", potentialValue: "N/A", notes: "Rarely offered at this stage" }
      ]
    },
    public: {
      title: "Public Company",
      scenario: "You join a public company with a $5B market cap and steady growth.",
      comparison: [
        { type: "ISO", frequency: "Sometimes", shares: "2,000", value: "$50/share", initialCost: "$100,000", potentialValue: "$200,000 at 2x growth", notes: "High exercise cost, but known market value" },
        { type: "NSO", frequency: "Common", shares: "2,000", value: "$50/share", initialCost: "$100,000", potentialValue: "$200,000 at 2x growth", notes: "Immediate taxation on exercise" },
        { type: "RSU", frequency: "Very Common", shares: "1,000", value: "$100/share", initialCost: "$0", potentialValue: "$200,000 at 2x growth", notes: "Most common for public companies" },
        { type: "Restricted Stock", frequency: "Very Rare", shares: "N/A", value: "N/A", initialCost: "N/A", potentialValue: "N/A", notes: "Almost never offered at public companies" }
      ]
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="space-y-4">
        <p>
          There are several types of equity compensation, each with different characteristics, tax implications, and use cases. Understanding the differences will help you evaluate your compensation package and make informed decisions.
        </p>
        
        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            Different types of equity are typically offered at different company stages. Early-stage startups often offer options, while later-stage and public companies typically offer RSUs.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Types Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Main Types of Equity Compensation</h3>
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="iso">ISOs</TabsTrigger>
            <TabsTrigger value="nso">NSOs</TabsTrigger>
            <TabsTrigger value="rsu">RSUs</TabsTrigger>
            <TabsTrigger value="rs">Restricted Stock</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeType} className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium">
                {equityTypeData[activeType].fullName}
                <Badge variant="outline" className="ml-2">
                  {activeType.toUpperCase()}
                </Badge>
              </h4>
              <Badge variant="secondary">
                Common at: {equityTypeData[activeType].commonAt}
              </Badge>
            </div>
            
            <p>{equityTypeData[activeType].description}</p>
            
            <div className="space-y-3">
              <h5 className="font-medium text-sm flex items-center">
                <Scales className="h-4 w-4 mr-1 text-primary" />
                Tax Treatment
              </h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/40 rounded-md">
                  <span className="block font-medium">At Grant:</span>
                  {equityTypeData[activeType].taxAtGrant}
                </div>
                <div className="p-2 bg-muted/40 rounded-md">
                  <span className="block font-medium">At Vesting:</span>
                  {equityTypeData[activeType].taxAtVesting}
                </div>
                <div className="p-2 bg-muted/40 rounded-md">
                  <span className="block font-medium">At Exercise:</span>
                  {equityTypeData[activeType].taxAtExercise}
                </div>
                <div className="p-2 bg-muted/40 rounded-md">
                  <span className="block font-medium">At Sale:</span>
                  {equityTypeData[activeType].taxAtSale}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm flex items-center mb-2">
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  Advantages
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {equityTypeData[activeType].advantages.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-sm flex items-center mb-2">
                  <X className="h-4 w-4 mr-1 text-red-500" />
                  Disadvantages
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {equityTypeData[activeType].disadvantages.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-md mt-2">
              <h5 className="font-medium text-sm flex items-center mb-1">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                Example
              </h5>
              <p className="text-sm">{equityTypeData[activeType].example}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Separator />
      
      {/* Key Differences Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <ArrowDownUp className="h-5 w-5 mr-2 text-primary" />
          Key Differences At-a-Glance
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left font-medium">Feature</th>
                <th className="p-2 text-left font-medium">ISOs</th>
                <th className="p-2 text-left font-medium">NSOs</th>
                <th className="p-2 text-left font-medium">RSUs</th>
                <th className="p-2 text-left font-medium">Restricted Stock</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b">
                <td className="p-2 font-medium">Need to Purchase?</td>
                <td className="p-2">Yes (exercise)</td>
                <td className="p-2">Yes (exercise)</td>
                <td className="p-2">No</td>
                <td className="p-2">Sometimes</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Value if Stock Price Drops Below Grant Price</td>
                <td className="p-2 text-red-500">$0 (underwater)</td>
                <td className="p-2 text-red-500">$0 (underwater)</td>
                <td className="p-2 text-green-500">Still has value</td>
                <td className="p-2 text-green-500">Still has value</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Tax Benefit</td>
                <td className="p-2 text-green-500">Highest</td>
                <td className="p-2 text-yellow-500">Medium</td>
                <td className="p-2 text-red-500">Lowest</td>
                <td className="p-2 text-green-500">High (with 83(b))</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Tax Complexity</td>
                <td className="p-2 text-red-500">High</td>
                <td className="p-2 text-yellow-500">Medium</td>
                <td className="p-2 text-green-500">Low</td>
                <td className="p-2 text-red-500">High</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Expiration</td>
                <td className="p-2">10 years from grant</td>
                <td className="p-2">Typically 10 years</td>
                <td className="p-2">None</td>
                <td className="p-2">None</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Post-Termination Exercise Window</td>
                <td className="p-2">Typically 90 days</td>
                <td className="p-2">Typically 90 days</td>
                <td className="p-2">N/A</td>
                <td className="p-2">N/A</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Cash Needed</td>
                <td className="p-2 text-red-500">Yes (exercise + possible AMT)</td>
                <td className="p-2 text-red-500">Yes (exercise + taxes)</td>
                <td className="p-2 text-yellow-500">For taxes only</td>
                <td className="p-2 text-yellow-500">Possible purchase + taxes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Try It Yourself - Interactive Comparison */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-primary" />
          Try It Yourself: Compare by Company Stage
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="space-y-4">
            <p>
              The type of equity you're offered often depends on the company's stage. Explore how equity grants typically differ:
            </p>
            
            <Tabs value={scenarioTab} onValueChange={setScenarioTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="startup">Early-Stage Startup</TabsTrigger>
                <TabsTrigger value="growth">Growth-Stage Company</TabsTrigger>
                <TabsTrigger value="public">Public Company</TabsTrigger>
              </TabsList>
              
              <TabsContent value={scenarioTab} className="mt-4 space-y-4">
                <div className="bg-primary/5 p-3 rounded-md">
                  <h4 className="font-medium">{comparisonData[scenarioTab].title}</h4>
                  <p className="text-sm">{comparisonData[scenarioTab].scenario}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left font-medium">Equity Type</th>
                        <th className="p-2 text-left font-medium">Frequency</th>
                        <th className="p-2 text-left font-medium">Typical Grant</th>
                        <th className="p-2 text-left font-medium">Current Value</th>
                        <th className="p-2 text-left font-medium">Initial Cost</th>
                        <th className="p-2 text-left font-medium">Potential Value</th>
                        <th className="p-2 text-left font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData[scenarioTab].comparison.map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{row.type}</td>
                          <td className="p-2">
                            <Badge variant={
                              row.frequency === "Very Common" ? "default" :
                              row.frequency === "Common" ? "secondary" :
                              row.frequency === "Sometimes" ? "outline" :
                              row.frequency === "Rare" ? "destructive" : "outline"
                            } className="text-xs">
                              {row.frequency}
                            </Badge>
                          </td>
                          <td className="p-2">{row.shares}</td>
                          <td className="p-2">{row.value}</td>
                          <td className="p-2">{row.initialCost}</td>
                          <td className="p-2">{row.potentialValue}</td>
                          <td className="p-2">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Special Considerations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Special Considerations</h3>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              Double-Trigger Acceleration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Some equity grants include provisions for "acceleration" – when vesting speeds up due to certain events. 
              <strong> Double-trigger acceleration</strong> means your equity vests faster if two events occur: 
              typically (1) the company is acquired AND (2) you're terminated within a certain timeframe (often 12 months).
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-500" />
              Post-Termination Exercise Windows
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              For stock options, you typically have a limited time to exercise after leaving the company (usually 90 days). 
              Some companies offer extended post-termination exercise windows (1-10 years). This can be a valuable benefit, 
              as it gives you more time to decide whether to exercise and pay for your options.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-yellow-500" />
              Liquidity Considerations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              For private companies, even if your equity has theoretical value, you may not be able to sell it until a 
              "liquidity event" (IPO, acquisition). Some companies allow for "secondary sales" where employees can sell 
              shares to investors before an IPO, but this is not guaranteed.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Key Takeaways */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Key Takeaways</h3>
        <div className="space-y-2">
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              1
            </div>
            <p>
              <strong>Stock options</strong> (ISOs/NSOs) require you to purchase shares by exercising, while <strong>RSUs</strong> convert directly to shares upon vesting without requiring purchase.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              2
            </div>
            <p>
              <strong>ISOs</strong> offer the best tax treatment if you meet holding requirements, but have complex rules and potential AMT implications.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              3
            </div>
            <p>
              <strong>RSUs</strong> are simpler and always have value if the company has value, but offer less upside potential and less favorable tax treatment than options.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              4
            </div>
            <p>
              The type of equity you're offered often correlates with company stage – early-stage startups offer options, while later-stage and public companies typically offer RSUs.
            </p>
          </div>
        </div>
      </div>
      
      {/* What's Next */}
      <Alert className="bg-muted border">
        <CalendarDays className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Coming up next:</span> We'll dive into vesting schedules - how equity ownership is earned over time, including cliffs, acceleration, and different vesting patterns.
        </AlertDescription>
      </Alert>
    </div>
  );
}