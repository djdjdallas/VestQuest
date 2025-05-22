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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Lightbulb,
  Clock,
  Calendar,
  CalendarClock,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Rocket,
  Info,
  AlertTriangle,
} from "lucide-react";

export function Lesson3VestingSchedules() {
  // State for vesting calculator
  const [grantSize, setGrantSize] = useState(10000);
  const [vestingYears, setVestingYears] = useState(4);
  const [cliffMonths, setCliffMonths] = useState(12);
  const [vestingSchedule, setVestingSchedule] = useState("monthly");
  const [includeAcceleration, setIncludeAcceleration] = useState(false);
  
  // Generate vesting schedule data for visualization
  const generateVestingData = () => {
    const data = [];
    const totalMonths = vestingYears * 12;
    const monthlyVesting = grantSize / totalMonths;
    
    // For each month in the vesting period
    for (let month = 0; month <= totalMonths; month++) {
      let vestedShares = 0;
      
      // Handle cliff
      if (month < cliffMonths) {
        vestedShares = 0;
      } else if (month === cliffMonths) {
        // At cliff, vest all shares that would have vested monthly up to this point
        vestedShares = monthlyVesting * cliffMonths;
      } else {
        // After cliff, calculate based on schedule
        if (vestingSchedule === "monthly") {
          vestedShares = monthlyVesting * month;
        } else if (vestingSchedule === "quarterly") {
          const quarters = Math.floor(month / 3);
          vestedShares = (grantSize / (vestingYears * 4)) * quarters;
        } else if (vestingSchedule === "annually") {
          const years = Math.floor(month / 12);
          vestedShares = (grantSize / vestingYears) * years;
        }
      }
      
      // Handle acceleration at the last point if enabled
      if (includeAcceleration && month === totalMonths - 6) {
        vestedShares = grantSize; // Full acceleration
      }
      
      // Ensure we don't exceed total shares
      vestedShares = Math.min(Math.round(vestedShares), grantSize);
      
      // Create data point
      data.push({
        month,
        vestedShares,
        percentVested: (vestedShares / grantSize * 100).toFixed(1),
        label: `Month ${month}`
      });
    }
    
    return data;
  };
  
  const vestingData = generateVestingData();

  // Calculate key points for the scenario
  const cliffDate = new Date();
  cliffDate.setMonth(cliffDate.getMonth() + cliffMonths);
  const cliffDateFormatted = cliffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  const fullyVestedDate = new Date();
  fullyVestedDate.setFullYear(fullyVestedDate.getFullYear() + vestingYears);
  const fullyVestedDateFormatted = fullyVestedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="space-y-4">
        <p>
          <GlossaryTooltip term="vesting">Vesting</GlossaryTooltip> is the process of earning your equity over time. When you receive an equity grant, you typically don't own all the shares immediately. Instead, you "vest" into them according to a predetermined schedule.
        </p>
        
        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            Vesting is designed to encourage employees to stay with the company long-term. You earn more of your equity the longer you remain employed.
          </AlertDescription>
        </Alert>
      </div>

      {/* Common Vesting Schedules */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Common Vesting Schedules</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Standard 4-Year Schedule with 1-Year Cliff
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                The most common vesting schedule in the tech industry. You vest 0% for the first year (the "cliff"), then 25% vests at your one-year anniversary, followed by monthly or quarterly vesting for the remaining three years.
              </p>
              <div className="bg-muted/40 p-2 rounded-md">
                <strong>Example:</strong> For a 10,000 share grant, you'd vest 0 shares for the first year, 2,500 shares at your one-year mark, then about 208 shares each month after that.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Graduated Vesting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Vesting occurs at different rates during different periods. For example, 10% in year one, 20% in year two, 30% in year three, and 40% in year four.
              </p>
              <div className="bg-muted/40 p-2 rounded-md">
                <strong>Example:</strong> For a 10,000 share grant, you'd vest 1,000 shares in year one, 2,000 in year two, 3,000 in year three, and 4,000 in year four.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                Milestone-Based Vesting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Vesting is tied to achieving specific company or individual performance milestones, rather than time. Less common than time-based vesting but sometimes used for executives or key roles.
              </p>
              <div className="bg-muted/40 p-2 rounded-md">
                <strong>Example:</strong> 25% vests when the company reaches $10M in annual revenue, another 25% at $20M, etc.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Rocket className="h-4 w-4 mr-2 text-primary" />
                Accelerated Vesting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Provisions that cause unvested shares to vest faster upon specific events, typically acquisition (single-trigger) or acquisition followed by termination (double-trigger).
              </p>
              <div className="bg-muted/40 p-2 rounded-md">
                <strong>Example:</strong> If your company is acquired and you're laid off within 12 months, 100% of your remaining unvested shares immediately vest.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator />
      
      {/* Understanding the Cliff */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <CalendarClock className="h-5 w-5 mr-2 text-primary" />
          Understanding the "Cliff"
        </h3>
        
        <p>
          A "cliff" is the initial period during which no equity vests. At the end of the cliff period, you receive all the equity that would have vested during that time.
        </p>
        
        <div className="bg-muted/50 p-4 rounded-md">
          <h4 className="font-medium mb-2 text-sm">Why Companies Use Cliffs</h4>
          <div className="space-y-2">
            <div className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                1
              </div>
              <p className="text-sm">
                <strong>Commitment Period:</strong> Ensures employees stay at least a year before receiving any equity.
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                2
              </div>
              <p className="text-sm">
                <strong>Evaluation Time:</strong> Gives the company time to evaluate if an employee will be successful.
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
                3
              </div>
              <p className="text-sm">
                <strong>Reduces Dilution:</strong> Prevents short-term employees from taking equity ownership.
              </p>
            </div>
          </div>
          
          <div className="mt-4 border p-3 rounded-md bg-yellow-50 border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-800">
                If you leave before your cliff date, you typically forfeit <strong>all</strong> of your equity. This is a critical consideration when thinking about changing jobs.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Try It Yourself - Interactive Vesting Calculator */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Try It Yourself: Vesting Schedule Simulator
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="space-y-4">
            <p>
              Adjust the parameters below to see how different vesting schedules work:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grant-size">Grant Size (shares)</Label>
                  <Input
                    id="grant-size"
                    type="number"
                    value={grantSize}
                    onChange={(e) => setGrantSize(parseInt(e.target.value) || 1000)}
                    min={1000}
                    max={100000}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vesting-years">Vesting Period (years)</Label>
                  <Slider
                    id="vesting-years"
                    min={1}
                    max={6}
                    step={1}
                    value={[vestingYears]}
                    onValueChange={(value) => setVestingYears(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 year</span>
                    <span>{vestingYears} years</span>
                    <span>6 years</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cliff-months">Cliff Period (months)</Label>
                  <Slider
                    id="cliff-months"
                    min={0}
                    max={24}
                    step={1}
                    value={[cliffMonths]}
                    onValueChange={(value) => setCliffMonths(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>No cliff</span>
                    <span>{cliffMonths} months</span>
                    <span>24 months</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Vesting Frequency</Label>
                  <RadioGroup 
                    value={vestingSchedule} 
                    onValueChange={setVestingSchedule}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="text-sm">Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="quarterly" id="quarterly" />
                      <Label htmlFor="quarterly" className="text-sm">Quarterly</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="annually" id="annually" />
                      <Label htmlFor="annually" className="text-sm">Annually</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceleration"
                    checked={includeAcceleration}
                    onChange={(e) => setIncludeAcceleration(e.target.checked)}
                  />
                  <Label htmlFor="acceleration" className="text-sm">
                    Include acceleration at month {vestingYears * 12 - 6}
                  </Label>
                </div>
              </div>
              
              <div>
                <div className="mb-2 bg-primary/10 p-2 rounded-md">
                  <p className="text-sm">
                    <strong>Cliff Date:</strong> {cliffDateFormatted} ({cliffMonths} months)
                  </p>
                  <p className="text-sm">
                    <strong>Fully Vested Date:</strong> {fullyVestedDateFormatted} ({vestingYears} years)
                  </p>
                </div>
                
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={vestingData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Months', position: 'insideBottomRight', offset: 0 }} 
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Shares Vested', angle: -90, position: 'insideLeft' }} 
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Percent Vested', angle: 90, position: 'insideRight' }} 
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'vestedShares') return [value, 'Shares Vested'];
                          return [value + '%', 'Percent Vested'];
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="stepAfter" 
                        dataKey="vestedShares" 
                        stroke="#4f46e5" 
                        name="Vested Shares"
                      />
                      <Line 
                        yAxisId="right"
                        type="stepAfter" 
                        dataKey="percentVested" 
                        stroke="#10b981" 
                        name="Percent Vested" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Practical Vesting Considerations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary" />
          Practical Vesting Considerations
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">What Happens If You Leave the Company?</h4>
            <p className="text-sm">
              When you leave a company, you stop vesting immediately. You only keep the shares that have vested as of your departure date. For stock options, you typically have a limited window (often 90 days) to exercise your vested options or lose them.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-1">Negotiating Your Vesting Schedule</h4>
            <p className="text-sm">
              While the 4-year schedule with a 1-year cliff is standard, vesting terms can sometimes be negotiated, especially for senior roles or if you're joining a company that's further along. Consider asking for:
            </p>
            <ul className="list-disc pl-5 text-sm mt-1">
              <li>A shorter cliff (6 months instead of 1 year)</li>
              <li>Accelerated vesting provisions</li>
              <li>A shorter overall vesting period (3 years instead of 4)</li>
              <li>A portion of shares vested upfront ("signing bonus")</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-1">Vesting and Refresher Grants</h4>
            <p className="text-sm">
              Companies often provide "refresher" equity grants after you've been employed for some time. These are additional grants that start a new vesting schedule, helping to maintain your equity incentive as your initial grant vests.
            </p>
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
              Vesting is the process of earning your equity over time, typically over a 4-year period with a 1-year cliff.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              2
            </div>
            <p>
              The "cliff" is an initial period (typically 1 year) where nothing vests, after which a portion vests immediately, followed by regular increments.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              3
            </div>
            <p>
              When you leave a company, you stop vesting immediately and typically only keep what has already vested.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              4
            </div>
            <p>
              Acceleration provisions can cause unvested equity to vest faster under certain conditions, like company acquisition.
            </p>
          </div>
        </div>
      </div>
      
      {/* What's Next */}
      <Alert className="bg-muted border">
        <CalendarDays className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Coming up next:</span> We'll explore strike price and fair market value - key concepts for understanding the value of your stock options and potential tax implications.
        </AlertDescription>
      </Alert>
    </div>
  );
}