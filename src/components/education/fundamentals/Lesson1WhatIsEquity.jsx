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
import { GlossaryTooltip } from "@/components/education/GlossaryTooltip";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Lightbulb,
  DollarSign,
  Sparkles,
  TrendingUp,
  Clock,
  Info,
  Building,
  UserPlus,
  CalendarDays,
  BarChart,
} from "lucide-react";

export function Lesson1WhatIsEquity() {
  const [salaryRatio, setSalaryRatio] = useState([70]);
  const [companyValue, setCompanyValue] = useState([5]);
  const [yearsWorked, setYearsWorked] = useState([4]);
  
  // Calculate results for the interactive tool
  const calculateResults = () => {
    const cashSalary = 100000 * (salaryRatio[0] / 100);
    const equityValue = 100000 * ((100 - salaryRatio[0]) / 100);
    const initialEquityPercent = equityValue / 1000000; // 0.01% equity per $100 of equity comp
    const exitValue = companyValue[0] * 1000000000; // Convert to billions
    const employeeShare = exitValue * initialEquityPercent * (yearsWorked[0] / 4); // Scale by years worked
    
    return {
      cashSalary: cashSalary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      equityPercent: (initialEquityPercent * 100).toFixed(3) + '%',
      potentialValue: employeeShare.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    };
  };
  
  const results = calculateResults();

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="space-y-4">
        <p>
          <GlossaryTooltip term="equity compensation">Equity compensation</GlossaryTooltip> is a way for companies to give their employees ownership in the business. Instead of (or in addition to) cash, employees receive shares or the right to purchase shares in the company.
        </p>
        
        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            Think of equity as getting a piece of the company pie. As the company grows and becomes more valuable, your slice of the pie becomes worth more too.
          </AlertDescription>
        </Alert>
      </div>

      {/* Why Companies Offer Equity */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Why Companies Offer Equity</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                Alignment of Interests
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              When employees own part of the company, they directly benefit from its success. This creates alignment between employee and company goals.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                Cash Conservation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Startups and growth companies may not have the cash to pay market-rate salaries. Equity allows them to attract talent while preserving cash.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <UserPlus className="h-4 w-4 mr-2 text-primary" />
                Talent Attraction & Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              The potential for significant financial upside helps companies attract and keep talented employees, especially in competitive industries.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Long-term Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Equity typically vests over time, encouraging employees to stay with the company longer to realize the full value of their ownership.
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator />
      
      {/* Equity vs Cash */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Equity vs. Cash Compensation</h3>
        <p>
          Unlike cash compensation, which has immediate and certain value, equity compensation:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Has <strong>uncertain value</strong> that depends on the company's future performance</li>
          <li>Is typically <strong>illiquid</strong> (cannot be immediately converted to cash)</li>
          <li><strong>Vests over time</strong>, meaning you earn it gradually</li>
          <li>Has <strong>potential for significant upside</strong> if the company succeeds</li>
          <li>Comes with <strong>tax implications</strong> that differ from regular salary</li>
        </ul>
      </div>

      {/* Real-world Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          Real-world Example
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="font-medium mb-2 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Join StartupX: A Tale of Two Offers
          </div>
          <div className="space-y-4">
            <p>
              Imagine you receive two job offers from StartupX, a promising tech company:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-md">
                <p className="font-medium">Offer A: Cash-Heavy</p>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                  <li>$150,000 annual salary</li>
                  <li>0.01% equity stake</li>
                </ul>
              </div>
              <div className="p-3 border rounded-md">
                <p className="font-medium">Offer B: Equity-Heavy</p>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                  <li>$120,000 annual salary</li>
                  <li>0.1% equity stake</li>
                </ul>
              </div>
            </div>
            <p className="text-sm">
              <strong>Fast-forward 5 years:</strong> StartupX goes public with a $2 billion valuation!
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">Offer A Outcome:</p>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                  <li>Total salary: $750,000</li>
                  <li>Equity value: $200,000 (0.01% of $2B)</li>
                  <li>Total: $950,000</li>
                </ul>
              </div>
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="font-medium">Offer B Outcome:</p>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                  <li>Total salary: $600,000</li>
                  <li>Equity value: $2,000,000 (0.1% of $2B)</li>
                  <li>Total: $2,600,000</li>
                </ul>
              </div>
            </div>
            <p className="text-sm">
              In this scenario, the equity-heavy offer resulted in significantly more total compensation. However, if the company had failed, Offer A would have been better.
            </p>
          </div>
        </div>
      </div>
      
      {/* Try It Yourself */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-primary" />
          Try It Yourself: Equity Calculator
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="space-y-4">
            <p>
              Explore how different compensation structures might work out in the future by adjusting the sliders below:
            </p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="salary-ratio">Salary vs. Equity Ratio</Label>
                  <span className="text-sm text-muted-foreground">{salaryRatio}% Salary / {100 - salaryRatio}% Equity</span>
                </div>
                <Slider 
                  id="salary-ratio"
                  min={50} 
                  max={100} 
                  step={5} 
                  value={salaryRatio} 
                  onValueChange={setSalaryRatio} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More Equity</span>
                  <span>More Salary</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="company-growth">Company Exit Value</Label>
                  <span className="text-sm text-muted-foreground">${companyValue}B</span>
                </div>
                <Slider 
                  id="company-growth"
                  min={1} 
                  max={10} 
                  step={1} 
                  value={companyValue} 
                  onValueChange={setCompanyValue} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Modest Exit</span>
                  <span>Major Success</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="years-worked">Years at Company</Label>
                  <span className="text-sm text-muted-foreground">{yearsWorked} years</span>
                </div>
                <Slider 
                  id="years-worked"
                  min={1} 
                  max={6} 
                  step={1} 
                  value={yearsWorked} 
                  onValueChange={setYearsWorked} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Short-term</span>
                  <span>Long-term</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-md mt-4">
              <div className="font-medium mb-2">Your Compensation Breakdown</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Annual Cash Salary:</span>
                  <span className="font-medium">{results.cashSalary}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equity Percentage:</span>
                  <span className="font-medium">{results.equityPercent}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span>Potential Equity Value at Exit:</span>
                  <span className="font-medium text-primary">{results.potentialValue}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Note: This is a simplified model. Actual outcomes depend on many factors including dilution, vesting schedules, and taxes.
              </p>
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
              Equity compensation gives you ownership in the company, aligning your interests with the company's success.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              2
            </div>
            <p>
              Unlike cash, equity is <strong>illiquid</strong> and its value is <strong>uncertain</strong>, but it has potential for significant upside.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              3
            </div>
            <p>
              The value of your equity depends on the company's future performance and liquidity events like an IPO or acquisition.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              4
            </div>
            <p>
              Consider your personal financial situation, risk tolerance, and beliefs about the company's future when evaluating equity compensation.
            </p>
          </div>
        </div>
      </div>
      
      {/* What's Next */}
      <Alert className="bg-muted border">
        <CalendarDays className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Coming up next:</span> We'll explore the different types of equity compensation (Stock Options, RSUs, and Restricted Stock) and their unique characteristics.
        </AlertDescription>
      </Alert>
    </div>
  );
}