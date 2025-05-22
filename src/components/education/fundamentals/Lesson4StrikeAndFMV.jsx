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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Lightbulb,
  DollarSign,
  FileText,
  CalendarDays,
  BarChart2,
  Calculator,
  Briefcase,
  ArrowUpDown,
  TrendingUp,
  Info,
  AlertTriangle,
} from "lucide-react";

export function Lesson4StrikeAndFMV() {
  // State for the strike price calculator
  const [shareCount, setShareCount] = useState(10000);
  const [strikePrice, setStrikePrice] = useState(1);
  const [currentFMV, setCurrentFMV] = useState(5);
  const [exitPrice, setExitPrice] = useState(20);
  
  // Calculate results for the calculator
  const calculateResults = () => {
    const exerciseCost = shareCount * strikePrice;
    const spreadValue = shareCount * (currentFMV - strikePrice);
    const potentialGain = shareCount * (exitPrice - strikePrice);
    
    return {
      exerciseCost: exerciseCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      currentSpread: spreadValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      potentialGain: potentialGain.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    };
  };
  
  const results = calculateResults();
  
  // Data for price comparison chart
  const generateComparisonData = () => {
    return [
      {
        name: 'Founding',
        price: 0.10,
        label: '$0.10',
      },
      {
        name: 'Seed Round',
        price: 0.50,
        label: '$0.50',
      },
      {
        name: 'Series A',
        price: 1.50,
        label: '$1.50',
      },
      {
        name: 'Series B',
        price: 3.00,
        label: '$3.00',
      },
      {
        name: 'Series C',
        price: 7.00,
        label: '$7.00',
      },
      {
        name: 'IPO',
        price: 22.00,
        label: '$22.00',
      },
    ];
  };
  
  const comparisonData = generateComparisonData();

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="space-y-4">
        <p>
          For stock options, two key price concepts determine their value and tax implications: <GlossaryTooltip term="strike price">strike price</GlossaryTooltip> and <GlossaryTooltip term="fair market value">fair market value (FMV)</GlossaryTooltip>. Understanding these concepts is essential for making informed decisions about when to exercise your options and planning for tax consequences.
        </p>
        
        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            The difference between your strike price and the fair market value is called the "spread." This spread determines both your potential profit and your tax liability.
          </AlertDescription>
        </Alert>
      </div>

      {/* Strike Price Explained */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary" />
          Strike Price Explained
        </h3>
        
        <p>
          The <strong>strike price</strong> (also called the exercise price) is the fixed price at which your stock options allow you to purchase shares of company stock. This price is set when your options are granted and doesn't change over time.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                How Strike Price Is Determined
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                For private companies, the strike price is typically set at the fair market value of the company's common stock at the time of grant, as determined by a 409A valuation.
              </p>
              <p>
                The strike price is often significantly lower than the preferred stock price used in funding rounds, which can create the potential for profit.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                Strike Price Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Strike prices typically increase as a company grows and raises more funding. Early employees usually get lower strike prices than later employees.
              </p>
              <p>
                The gap between your strike price and the company's value at exit determines your potential gain.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator />
      
      {/* Fair Market Value Explained */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-primary" />
          Fair Market Value (FMV) Explained
        </h3>
        
        <p>
          The <strong>fair market value (FMV)</strong> is the current value of a share of the company's common stock. Unlike the fixed strike price, FMV changes over time as the company grows, raises funding, or faces challenges.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Calculator className="h-4 w-4 mr-2 text-primary" />
                409A Valuations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Private companies must determine their common stock FMV through an independent 409A valuation, named after the IRS code section that requires it.
              </p>
              <p>
                These valuations are typically performed by third-party firms and updated every 12 months or after significant company events (funding rounds, major business changes).
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <ArrowUpDown className="h-4 w-4 mr-2 text-primary" />
                Common vs. Preferred Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                FMV refers to common stock value, which is typically lower than preferred stock price paid by investors.
              </p>
              <p>
                Preferred stock usually includes special rights (liquidation preferences, anti-dilution protection) that make it more valuable than common stock.
              </p>
              <p>
                The discount between common and preferred stock can range from 20% to 80%, depending on company stage and circumstances.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* The Spread and Its Importance */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary" />
          The "Spread" and Why It Matters
        </h3>
        
        <div className="bg-muted/50 p-4 rounded-md">
          <p className="mb-3">
            The <strong>spread</strong> is the difference between the FMV and your strike price. It's a crucial concept because:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                1
              </div>
              <p>
                <strong>Tax Implications:</strong> For NSOs, you pay ordinary income tax on the spread when you exercise. For ISOs, the spread may trigger AMT (Alternative Minimum Tax).
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                2
              </div>
              <p>
                <strong>Exercise Decisions:</strong> A larger spread means higher potential profit but also higher immediate tax costs, affecting your decision on when to exercise.
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                3
              </div>
              <p>
                <strong>Early Exercise:</strong> Exercising when the spread is small or zero (when FMV equals strike price) minimizes tax implications.
              </p>
            </div>
          </div>
          
          <div className="mt-4 border p-3 rounded-md bg-primary/10">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-1 text-primary" />
              Underwater Options
            </h4>
            <p className="text-sm">
              If the current FMV falls below your strike price, your options are "underwater" or "out of the money" - they have no immediate economic value. However, they may still have potential future value if the company's stock price increases above your strike price before your options expire.
            </p>
          </div>
        </div>
      </div>
      
      {/* Visual Representation */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart2 className="h-5 w-5 mr-2 text-primary" />
          How Stock Price Typically Evolves
        </h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Share Price']} />
              <Legend />
              <Bar dataKey="price" fill="#4f46e5" name="Share Price">
                {comparisonData.map((entry, index) => (
                  <text
                    key={`price-${index}`}
                    x={index * 90 + 45}
                    y={250 - entry.price * 10}
                    fill="#000"
                    textAnchor="middle"
                    dy={-10}
                  >
                    {entry.label}
                  </text>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This chart shows a typical progression of common stock value as a company grows. Your specific company's trajectory may differ significantly.
        </p>
      </div>
      
      {/* Try It Yourself - Interactive Calculator */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-primary" />
          Try It Yourself: Stock Option Value Calculator
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="space-y-4">
            <p>
              Adjust the parameters below to see how strike price and FMV affect your option value:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="share-count">Number of Options</Label>
                  <Input
                    id="share-count"
                    type="number"
                    value={shareCount}
                    onChange={(e) => setShareCount(parseInt(e.target.value) || 1000)}
                    min={1000}
                    max={100000}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="strike-price">Strike Price</Label>
                    <span className="text-sm text-muted-foreground">${strikePrice.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="strike-price"
                    min={0.10}
                    max={10}
                    step={0.10}
                    value={[strikePrice]}
                    onValueChange={(value) => setStrikePrice(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0.10</span>
                    <span>$10.00</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="current-fmv">Current FMV</Label>
                    <span className="text-sm text-muted-foreground">${currentFMV.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="current-fmv"
                    min={0.10}
                    max={20}
                    step={0.10}
                    value={[currentFMV]}
                    onValueChange={(value) => setCurrentFMV(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0.10</span>
                    <span>$20.00</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="exit-price">Potential Exit Price</Label>
                    <span className="text-sm text-muted-foreground">${exitPrice.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="exit-price"
                    min={1}
                    max={50}
                    step={1}
                    value={[exitPrice]}
                    onValueChange={(value) => setExitPrice(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$1.00</span>
                    <span>$50.00</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-primary/10 p-4 rounded-md space-y-4">
                  <h4 className="font-medium">Your Option Value</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Cost to Exercise:</span>
                      <span className="font-medium">{results.exerciseCost}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Current Spread:</span>
                      <span className={`font-medium ${currentFMV > strikePrice ? 'text-green-600' : 'text-red-600'}`}>
                        {currentFMV > strikePrice ? results.currentSpread : '$0 (underwater)'}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span>Potential Gain at Exit:</span>
                      <span className="font-medium text-primary">{results.potentialGain}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 text-xs text-muted-foreground">
                    <p>
                      <strong>Note:</strong> This is a simplified calculation that doesn't account for taxes, dilution, or other factors that might affect your actual returns.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Key Insights</h4>
                  
                  {currentFMV < strikePrice && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-sm">
                        Your options are currently underwater (FMV is less than strike price). They have no immediate economic value but may become valuable if the stock price increases.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {currentFMV > strikePrice && currentFMV < exitPrice && (
                    <Alert className="bg-green-50 border-green-200">
                      <Info className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 text-sm">
                        Your options have a positive spread of ${(currentFMV - strikePrice).toFixed(2)} per share. Consider your exercise and tax strategy carefully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {currentFMV > 3 * strikePrice && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 text-sm">
                        The large spread between your strike price and current FMV may result in significant tax implications if you exercise now.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Real-world Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Real-world Examples</h3>
        
        <Tabs defaultValue="early">
          <TabsList>
            <TabsTrigger value="early">Early-Stage Employee</TabsTrigger>
            <TabsTrigger value="middle">Mid-Stage Employee</TabsTrigger>
            <TabsTrigger value="late">Late-Stage Employee</TabsTrigger>
          </TabsList>
          
          <TabsContent value="early" className="pt-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Example: Early-Stage Startup Employee</h4>
              <div className="space-y-3">
                <p>
                  <strong>Scenario:</strong> Sarah joins a seed-stage startup and receives options to purchase 20,000 shares at a strike price of $0.50 per share.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>At the time of grant, the FMV equals the strike price: $0.50/share</li>
                  <li>The company raises a Series A round one year later, increasing the FMV to $2.00/share</li>
                  <li>Three years later, the company is acquired for $10.00/share</li>
                </ul>
                <p>
                  <strong>Outcome:</strong> If Sarah exercises all her options at acquisition, she pays $10,000 (20,000 × $0.50) to exercise and receives $200,000 (20,000 × $10.00), for a profit of $190,000.
                </p>
                <p>
                  <strong>Key Insight:</strong> Early employees typically get a lower strike price, which can mean larger potential gains.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="middle" className="pt-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Example: Mid-Stage Startup Employee</h4>
              <div className="space-y-3">
                <p>
                  <strong>Scenario:</strong> Michael joins a Series B startup and receives options to purchase 10,000 shares at a strike price of $3.00 per share.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>At the time of grant, the FMV equals the strike price: $3.00/share</li>
                  <li>The company raises a Series C round one year later, increasing the FMV to $7.00/share</li>
                  <li>Two years later, the company goes public at $20.00/share</li>
                </ul>
                <p>
                  <strong>Outcome:</strong> If Michael exercises all his options at IPO, he pays $30,000 (10,000 × $3.00) to exercise and receives $200,000 (10,000 × $20.00), for a profit of $170,000.
                </p>
                <p>
                  <strong>Key Insight:</strong> Despite receiving fewer shares at a higher strike price than early employees, mid-stage employees can still realize significant value if the company succeeds.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="late" className="pt-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Example: Late-Stage Startup Employee</h4>
              <div className="space-y-3">
                <p>
                  <strong>Scenario:</strong> Jessica joins a pre-IPO company and receives options to purchase 5,000 shares at a strike price of $15.00 per share.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>At the time of grant, the FMV equals the strike price: $15.00/share</li>
                  <li>Six months later, the company goes public at $25.00/share</li>
                  <li>One year after IPO, the stock is trading at $35.00/share</li>
                </ul>
                <p>
                  <strong>Outcome:</strong> If Jessica exercises all her options when the stock reaches $35.00, she pays $75,000 (5,000 × $15.00) to exercise and receives $175,000 (5,000 × $35.00), for a profit of $100,000.
                </p>
                <p>
                  <strong>Key Insight:</strong> Late-stage employees typically receive fewer shares at a higher strike price, resulting in less potential upside. However, the risk is also lower since the company is closer to liquidity.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
              Your <strong>strike price</strong> is fixed when your options are granted, while the <strong>fair market value (FMV)</strong> changes as the company grows.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              2
            </div>
            <p>
              The <strong>spread</strong> (difference between FMV and strike price) determines both your potential profit and tax implications when exercising.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              3
            </div>
            <p>
              Earlier employees typically receive more shares at a lower strike price, creating greater potential upside if the company succeeds.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              4
            </div>
            <p>
              <strong>409A valuations</strong> determine the FMV for private companies and are updated periodically as the company grows.
            </p>
          </div>
        </div>
      </div>
      
      {/* What's Next */}
      <Alert className="bg-muted border">
        <CalendarDays className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Coming up next:</span> We'll explore the tax implications of different equity types, including ordinary income vs. capital gains, AMT considerations, and strategies to minimize your tax burden.
        </AlertDescription>
      </Alert>
    </div>
  );
}