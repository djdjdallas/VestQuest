"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlossaryTooltip } from "@/components/education/GlossaryTooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Lightbulb,
  DollarSign,
  FileText,
  CalendarDays,
  BarChart2,
  TrendingUp,
  Calendar,
  Rocket,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ShoppingCart,
  Clock,
  Building,
  ArrowRight,
} from "lucide-react";

export function Lesson6ExitsAndLiquidity() {
  // State for exit scenario calculator
  const [exitType, setExitType] = useState("ipo");
  const [initialShares, setInitialShares] = useState(10000);
  const [initialPrice, setInitialPrice] = useState(1);
  const [exitPrice, setExitPrice] = useState(20);
  const [sellStrategy, setSellStrategy] = useState("staged");
  const [taxRate, setTaxRate] = useState(30);
  
  // Calculate exit scenario results
  const calculateExitResults = () => {
    const initialValue = initialShares * initialPrice;
    const exitValue = initialShares * exitPrice;
    const totalGain = exitValue - initialValue;
    
    // Staged selling vs immediate selling
    let netProceeds = 0;
    let effectiveTaxRate = 0;
    let sellScenario = [];
    
    if (exitType === "ipo") {
      if (sellStrategy === "staged") {
        // Simulate staged selling over 2 years
        // Assumptions: 20% after lockup, 30% after 1 year, 50% after 2 years
        // First 20% at exit price
        const firstSell = {
          timing: "After lockup (6 months)",
          shares: initialShares * 0.2,
          price: exitPrice,
          proceeds: initialShares * 0.2 * exitPrice,
          tax: initialShares * 0.2 * (exitPrice - initialPrice) * (taxRate / 100),
        };
        
        // Next 30% at exit price * 1.2 (assuming 20% growth)
        const secondSell = {
          timing: "After 1 year",
          shares: initialShares * 0.3,
          price: exitPrice * 1.2,
          proceeds: initialShares * 0.3 * exitPrice * 1.2,
          tax: initialShares * 0.3 * (exitPrice * 1.2 - initialPrice) * (taxRate / 100) * 0.8, // Lower tax rate for long-term
        };
        
        // Final 50% at exit price * 1.5 (assuming 50% growth)
        const thirdSell = {
          timing: "After 2 years",
          shares: initialShares * 0.5,
          price: exitPrice * 1.5,
          proceeds: initialShares * 0.5 * exitPrice * 1.5,
          tax: initialShares * 0.5 * (exitPrice * 1.5 - initialPrice) * (taxRate / 100) * 0.8, // Lower tax rate for long-term
        };
        
        sellScenario = [firstSell, secondSell, thirdSell];
        
        // Calculate total proceeds and taxes
        const totalProceeds = sellScenario.reduce((sum, sell) => sum + sell.proceeds, 0);
        const totalTaxes = sellScenario.reduce((sum, sell) => sum + sell.tax, 0);
        netProceeds = totalProceeds - totalTaxes;
        effectiveTaxRate = (totalTaxes / (totalProceeds - initialValue)) * 100;
      } else {
        // Immediate selling
        const taxes = totalGain * (taxRate / 100);
        netProceeds = exitValue - taxes;
        effectiveTaxRate = taxRate;
        
        sellScenario = [
          {
            timing: "After lockup (6 months)",
            shares: initialShares,
            price: exitPrice,
            proceeds: exitValue,
            tax: taxes,
          }
        ];
      }
    } else {
      // Acquisition - typically a single liquidity event
      const taxes = totalGain * (taxRate / 100);
      netProceeds = exitValue - taxes;
      effectiveTaxRate = taxRate;
      
      sellScenario = [
        {
          timing: "At acquisition",
          shares: initialShares,
          price: exitPrice,
          proceeds: exitValue,
          tax: taxes,
        }
      ];
    }
    
    return {
      initialValue: initialValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      exitValue: exitValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      totalGain: totalGain.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      netProceeds: netProceeds.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      effectiveTaxRate: effectiveTaxRate.toFixed(1) + '%',
      sellScenario,
      multiplier: (exitValue / initialValue).toFixed(1) + 'x',
    };
  };
  
  const exitResults = calculateExitResults();
  
  // Generate comparison data for IPO vs Acquisition
  const generateExitComparisonData = () => {
    const data = [
      {
        name: 'IPO',
        value: initialShares * exitPrice,
        advantages: [
          'Potential for continued stock growth',
          'Staged selling for tax optimization',
          'More control over timing',
        ],
        disadvantages: [
          'Lockup period restrictions',
          'Market volatility risk',
          'Usually longer timeline to liquidity',
        ],
      },
      {
        name: 'Acquisition',
        value: initialShares * exitPrice,
        advantages: [
          'Immediate liquidity (typically)',
          'Less market risk',
          'Potentially earlier timeline',
        ],
        disadvantages: [
          'Limited control over timing',
          'One-time tax event (less optimization)',
          'No future upside in the company',
        ],
      },
    ];
    
    return data;
  };
  
  const exitComparisonData = generateExitComparisonData();

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="space-y-4">
        <p>
          After understanding the basics of equity compensation, it's important to learn about <GlossaryTooltip term="liquidity event">liquidity events</GlossaryTooltip> - the moments when your equity can actually be converted to cash. For most private company equity, these events are critical, as they represent your opportunity to realize the value of your equity.
        </p>
        
        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            Until a liquidity event occurs, private company equity typically cannot be sold and has no guaranteed value. Understanding how these events work helps you make informed decisions about your equity.
          </AlertDescription>
        </Alert>
      </div>

      {/* Major Types of Liquidity Events */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Major Types of Liquidity Events</h3>
        <Tabs defaultValue="ipo" value={exitType} onValueChange={setExitType}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="ipo">IPO</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="secondary">Secondary Sales</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ipo" className="space-y-4 pt-4">
            <h4 className="font-medium">Initial Public Offering (IPO)</h4>
            <p>
              An <GlossaryTooltip term="ipo">IPO</GlossaryTooltip> occurs when a company offers its shares to the public for the first time on a stock exchange. This is a significant milestone that allows shareholders to sell their shares on the public market.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    IPO Process Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="w-1 bg-primary/20 relative mr-4">
                        <div className="absolute w-3 h-3 rounded-full bg-primary -left-1 top-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">Pre-IPO Preparations</p>
                        <p className="text-muted-foreground">Company selects underwriters, conducts financial audits, and files S-1 registration with SEC.</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1 bg-primary/20 relative mr-4">
                        <div className="absolute w-3 h-3 rounded-full bg-primary -left-1 top-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">Roadshow & Pricing</p>
                        <p className="text-muted-foreground">Company presents to investors, sets initial price range, and finalizes IPO price.</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1 bg-primary/20 relative mr-4">
                        <div className="absolute w-3 h-3 rounded-full bg-primary -left-1 top-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">IPO Day</p>
                        <p className="text-muted-foreground">Shares begin trading publicly. Stock price may fluctuate significantly.</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1 bg-primary/20 relative mr-4">
                        <div className="absolute w-3 h-3 rounded-full bg-primary -left-1 top-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">Lockup Period</p>
                        <p className="text-muted-foreground">Most employees cannot sell shares for 90-180 days after IPO (lockup).</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1 h-3 bg-primary/20 relative mr-4">
                        <div className="absolute w-3 h-3 rounded-full bg-primary -left-1 top-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">Post-Lockup</p>
                        <p className="text-muted-foreground">Employees can sell shares according to company trading windows and policies.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    Key IPO Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Lockup Period</p>
                        <p className="text-muted-foreground">Most employees cannot sell shares for 90-180 days after IPO to prevent excess selling pressure.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Trading Windows</p>
                        <p className="text-muted-foreground">Even after lockup, employees can typically only sell during "open windows" (often after quarterly earnings).</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Price Volatility</p>
                        <p className="text-muted-foreground">Newly public stocks can be highly volatile; share prices may drop significantly after lockup expires.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Exercise Before IPO</p>
                        <p className="text-muted-foreground">Some employees choose to exercise options before IPO to start long-term capital gains clock.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                IPO Example
              </h4>
              <p className="text-sm">
                Sarah has 10,000 vested options with a $2 strike price at TechCo, which is planning an IPO. The company expects to price shares at $20 for the IPO.
              </p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">Pre-IPO Actions</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Sarah exercises her options for $20,000 (10,000 × $2)</li>
                      <li>She files an 83(b) election for ISOs to manage AMT</li>
                      <li>She secures a loan or uses savings for exercise costs</li>
                    </ul>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">Post-IPO Strategy</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>TechCo goes public at $22/share, making Sarah's shares worth $220,000</li>
                      <li>Sarah waits through the 180-day lockup period</li>
                      <li>She sells 30% immediately after lockup to cover exercise costs and taxes</li>
                      <li>She sells the remaining shares over 2 years to minimize tax impact</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="acquisition" className="space-y-4 pt-4">
            <h4 className="font-medium">Acquisition</h4>
            <p>
              An <GlossaryTooltip term="acquisition">acquisition</GlossaryTooltip> occurs when one company purchases another. Acquisitions can be structured in various ways, affecting how and when equity holders receive value.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2 text-primary" />
                    Acquisition Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Cash Acquisition</p>
                      <p className="text-muted-foreground">Shareholders receive cash for their shares. This is the most straightforward type of acquisition for equity holders.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Stock Acquisition</p>
                      <p className="text-muted-foreground">Shareholders receive shares in the acquiring company, typically with a conversion ratio. Tax consequences are often deferred until you sell the new shares.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Mixed Cash/Stock</p>
                      <p className="text-muted-foreground">Shareholders receive a combination of cash and stock, with different tax implications for each component.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Earn-out</p>
                      <p className="text-muted-foreground">Part of the acquisition payment is contingent on future performance. This creates uncertainty but potential upside.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    Key Acquisition Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Accelerated Vesting</p>
                        <p className="text-muted-foreground">Some companies have "acceleration" clauses that vest unvested equity upon acquisition (single-trigger) or if you're terminated after acquisition (double-trigger).</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Liquidation Preferences</p>
                        <p className="text-muted-foreground">Investors typically get paid first through "liquidation preferences." In smaller acquisitions, common shareholders may receive little or nothing.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Retention Packages</p>
                        <p className="text-muted-foreground">Acquirers often offer new equity packages to key employees they want to retain, which may affect your decision to stay.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Escrow & Holdbacks</p>
                        <p className="text-muted-foreground">Part of the acquisition payment may be held in escrow for a period to cover potential liabilities, delaying full liquidity.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                Acquisition Example
              </h4>
              <p className="text-sm">
                Michael has 5,000 vested options and 3,000 unvested options with a $3 strike price at StartupX. The company is being acquired for $30/share.
              </p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">Scenario A: Cash Acquisition</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Michael exercises 5,000 vested options for $15,000</li>
                      <li>He receives $150,000 cash (5,000 × $30)</li>
                      <li>With double-trigger acceleration, his 3,000 unvested options vest after he's laid off</li>
                      <li>He pays $9,000 to exercise those and receives an additional $90,000</li>
                      <li>Total proceeds: $240,000 minus exercise costs ($24,000) and taxes</li>
                    </ul>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">Scenario B: Stock Acquisition</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Michael exercises 5,000 vested options for $15,000</li>
                      <li>He receives shares in the acquiring company worth $150,000</li>
                      <li>His unvested options convert to unvested shares in the acquirer</li>
                      <li>He continues to vest in these shares on the original schedule</li>
                      <li>He can choose when to sell the acquired company shares</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="secondary" className="space-y-4 pt-4">
            <h4 className="font-medium">Secondary Sales</h4>
            <p>
              <GlossaryTooltip term="secondary sale">Secondary sales</GlossaryTooltip> provide opportunities to sell private company shares before an IPO or acquisition. They're becoming more common as companies stay private longer.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Building className="h-4 w-4 mr-2 text-primary" />
                    Secondary Sale Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Company-Facilitated Tender Offers</p>
                      <p className="text-muted-foreground">The company organizes a structured opportunity for employees to sell some portion of their vested shares to investors or the company itself.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Investor Direct Purchases</p>
                      <p className="text-muted-foreground">Investors approach shareholders directly to purchase shares, typically requiring company approval.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Secondary Marketplaces</p>
                      <p className="text-muted-foreground">Platforms that connect buyers and sellers of private company shares, though company approval is still typically required.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Employee Liquidity Programs</p>
                      <p className="text-muted-foreground">Ongoing programs where employees can sell a portion of their vested equity periodically.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Info className="h-4 w-4 mr-2 text-primary" />
                    Secondary Sale Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Discount to Fair Market Value</p>
                        <p className="text-muted-foreground">Secondary sales typically occur at a discount (10-30%) to the company's most recent valuation due to lack of liquidity and information.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Company Approval Required</p>
                        <p className="text-muted-foreground">Most companies have a right of first refusal (ROFR) and must approve any transfers of shares.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Limitations on Amount</p>
                        <p className="text-muted-foreground">Companies typically limit secondary sales to a portion of your vested equity (e.g., 10-25%) to keep employees aligned with company success.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Tax Implications</p>
                        <p className="text-muted-foreground">Secondary sales are taxable events, typically at ordinary income rates for options and capital gains rates for shares held long-term.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                Secondary Sale Example
              </h4>
              <p className="text-sm">
                Jessica has 20,000 vested options with a $1 strike price at UnicornCo, which was recently valued at $50/share in its Series D round. The company announces a tender offer allowing employees to sell up to 20% of their vested equity.
              </p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">Tender Offer Process</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Jessica can sell up to 4,000 shares (20% of 20,000)</li>
                      <li>The tender offer price is $40/share (20% discount to recent valuation)</li>
                      <li>She exercises 4,000 options for $4,000 ($1 each)</li>
                      <li>She sells the shares for $160,000 ($40 each)</li>
                      <li>She pays taxes on the $156,000 gain</li>
                      <li>She retains her remaining 16,000 options for potential future upside</li>
                    </ul>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">Considerations</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Jessica reduces her risk by getting some cash now</li>
                      <li>She can use the proceeds to exercise more options, pay off debt, or diversify investments</li>
                      <li>She maintains most of her equity upside if the company continues to grow</li>
                      <li>There's opportunity cost if the company is acquired at a higher price soon after</li>
                      <li>The partial liquidity helps her avoid an "all or nothing" scenario</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Separator />
      
      {/* Comparing Exit Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart2 className="h-5 w-5 mr-2 text-primary" />
          Comparing Exit Types: IPO vs. Acquisition
        </h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={exitComparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Potential Value']} />
              <Legend />
              <Bar dataKey="value" fill="#4f46e5" name="Potential Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">IPO Advantages & Disadvantages</h4>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Potential for continued growth</p>
                  <p className="text-xs text-muted-foreground">Stock can continue to appreciate after the IPO</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Staged selling for tax optimization</p>
                  <p className="text-xs text-muted-foreground">Can sell portions over time to manage tax impact</p>
                </div>
              </div>
              <div className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Lockup period restrictions</p>
                  <p className="text-xs text-muted-foreground">Typically can't sell for 90-180 days after IPO</p>
                </div>
              </div>
              <div className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Market volatility risk</p>
                  <p className="text-xs text-muted-foreground">Stock price can drop significantly, especially after lockup expiration</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Acquisition Advantages & Disadvantages</h4>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Immediate liquidity</p>
                  <p className="text-xs text-muted-foreground">Often provides cash or liquid stock right away</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Less market risk</p>
                  <p className="text-xs text-muted-foreground">Acquisition price is typically fixed and certain</p>
                </div>
              </div>
              <div className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Limited control over timing</p>
                  <p className="text-xs text-muted-foreground">Employees have no say in when or if a company is acquired</p>
                </div>
              </div>
              <div className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">No future upside</p>
                  <p className="text-xs text-muted-foreground">Miss out on potential future growth as an independent company</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exit Planning Strategies */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Exit Planning Strategies
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Before a Liquidity Event
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="space-y-3">
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Consider early exercise</p>
                    <p className="text-muted-foreground">If your company allows early exercise, consider exercising unvested options and filing an 83(b) election to start your capital gains clock and minimize taxes.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Plan your exercise strategy</p>
                    <p className="text-muted-foreground">Develop a plan for exercising vested options, considering the cost, tax implications, and timing relative to a potential liquidity event.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Build a cash reserve</p>
                    <p className="text-muted-foreground">Save money to cover exercise costs and potential tax liabilities that may come due before you can sell shares.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Consult tax professionals</p>
                    <p className="text-muted-foreground">Work with a tax advisor familiar with equity compensation to develop a tax-efficient strategy for your specific situation.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Rocket className="h-4 w-4 mr-2 text-primary" />
                During & After a Liquidity Event
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="space-y-3">
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Consider staged selling</p>
                    <p className="text-muted-foreground">After an IPO, consider selling your shares in stages to spread out tax impact and reduce market timing risk.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Understand lockup restrictions</p>
                    <p className="text-muted-foreground">Be prepared for lockup periods after an IPO and plan your financial needs accordingly.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Evaluate retention packages</p>
                    <p className="text-muted-foreground">In an acquisition, carefully evaluate any new equity or retention packages offered by the acquiring company.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Diversify your investments</p>
                    <p className="text-muted-foreground">Once you have liquidity, consider diversifying your investments rather than keeping a large portion of your net worth in a single stock.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Try It Yourself - Exit Scenario Calculator */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-primary" />
          Try It Yourself: Exit Scenario Calculator
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="space-y-4">
            <p>
              Adjust the parameters below to see how different exit scenarios might affect your equity's value:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Exit Type</Label>
                  <RadioGroup 
                    value={exitType} 
                    onValueChange={setExitType}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="ipo" id="ipo" />
                      <Label htmlFor="ipo" className="text-sm">IPO</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="acquisition" id="acquisition" />
                      <Label htmlFor="acquisition" className="text-sm">Acquisition</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="initial-shares">Number of Shares</Label>
                  <Input
                    id="initial-shares"
                    type="number"
                    value={initialShares}
                    onChange={(e) => setInitialShares(parseInt(e.target.value) || 1000)}
                    min={1000}
                    max={100000}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="initial-price">Initial Price (Cost Basis)</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">$</span>
                    <Input
                      id="initial-price"
                      type="number"
                      value={initialPrice}
                      onChange={(e) => setInitialPrice(parseFloat(e.target.value) || 0.1)}
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exit-price">Exit Price Per Share</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">$</span>
                    <Input
                      id="exit-price"
                      type="number"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0.1)}
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                </div>
                
                {exitType === "ipo" && (
                  <div className="space-y-2">
                    <Label>Selling Strategy</Label>
                    <RadioGroup 
                      value={sellStrategy} 
                      onValueChange={setSellStrategy}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="staged" id="staged" />
                        <Label htmlFor="staged" className="text-sm">Staged Selling</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <Label htmlFor="immediate" className="text-sm">Sell All</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="tax-rate">Estimated Tax Rate</Label>
                    <span className="text-sm text-muted-foreground">{taxRate}%</span>
                  </div>
                  <Slider
                    id="tax-rate"
                    min={15}
                    max={50}
                    step={1}
                    value={[taxRate]}
                    onValueChange={(value) => setTaxRate(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-primary/10 p-4 rounded-md space-y-4">
                  <h4 className="font-medium">Exit Scenario Results</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Initial Investment:</span>
                      <span className="font-medium">{exitResults.initialValue}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Gross Value at Exit:</span>
                      <span className="font-medium">{exitResults.exitValue}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Return Multiple:</span>
                      <span className="font-medium text-green-600">{exitResults.multiplier}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span>Estimated Tax:</span>
                      <span className="font-medium text-red-600">
                        {(parseFloat(exitResults.exitValue.replace(/[^0-9.-]+/g, '')) - parseFloat(exitResults.netProceeds.replace(/[^0-9.-]+/g, ''))).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Net Proceeds:</span>
                      <span className="font-medium text-primary">{exitResults.netProceeds}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Effective Tax Rate:</span>
                      <span className="font-medium">{exitResults.effectiveTaxRate}</span>
                    </div>
                  </div>
                </div>
                
                {/* Sell scenario breakdown */}
                {exitResults.sellScenario.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Selling Timeline</h4>
                    <div className="space-y-2">
                      {exitResults.sellScenario.map((sell, index) => (
                        <div key={index} className="p-2 border rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{sell.timing}</span>
                            <span className="text-sm">{Math.round(sell.shares).toLocaleString()} shares</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Price: ${sell.price.toFixed(2)}</span>
                            <span>
                              Proceeds: ${Math.round(sell.proceeds).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {sellStrategy === "staged" && exitType === "ipo" && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-700">
                          <Info className="h-3 w-3 inline mr-1" />
                          Staged selling can reduce risk and potentially result in higher overall proceeds if the stock price appreciates over time, as modeled in this example.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
              <strong>IPOs</strong> involve a lockup period and post-lockup selling windows, allowing for staged selling but introducing market timing risk. <strong>Acquisitions</strong> typically provide more immediate liquidity but less control over timing and value.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              2
            </div>
            <p>
              <strong>Secondary sales</strong> can provide partial liquidity before an IPO or acquisition, allowing you to diversify while retaining some upside potential.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              3
            </div>
            <p>
              <strong>Vesting acceleration</strong> provisions can significantly impact how much equity you retain in an acquisition, particularly if you're laid off afterward.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              4
            </div>
            <p>
              <strong>Planning ahead</strong> for liquidity events by understanding your options, tax implications, and potential strategies can help you maximize the value of your equity.
            </p>
          </div>
        </div>
      </div>
      
      {/* Course Completion */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <Award className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Congratulations!</h2>
        <p className="mb-4">You've completed the Equity Fundamentals course. You now have a solid understanding of equity compensation basics, from types of equity to vesting, valuation, taxes, and liquidity events.</p>
        <div className="space-y-4">
          <p className="text-sm">Continue your learning journey with our more advanced modules:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm">Tax Optimization Strategies</Button>
            <Button variant="outline" size="sm">Advanced Vesting Structures</Button>
            <Button variant="outline" size="sm">Equity Negotiation Tactics</Button>
          </div>
        </div>
      </div>
    </div>
  );
}