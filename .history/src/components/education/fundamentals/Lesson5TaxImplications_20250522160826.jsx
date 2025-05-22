"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlossaryTooltip } from "@/components/education/GlossaryTooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Lightbulb,
  DollarSign,
  FileText,
  CalendarDays,
  Calculator,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
} from "lucide-react";

export function Lesson5TaxImplications() {
  // State for tax calculator
  const [grantType, setGrantType] = useState("iso");
  const [shareCount, setShareCount] = useState(10000);
  const [strikePrice, setStrikePrice] = useState(1);
  const [currentFMV, setCurrentFMV] = useState(5);
  const [sellPrice, setSellPrice] = useState(20);
  const [incomeTaxRate, setIncomeTaxRate] = useState(35);
  const [capitalGainsRate, setCapitalGainsRate] = useState(15);
  const [holdingPeriod, setHoldingPeriod] = useState("qualified");
  const [includeAMT, setIncludeAMT] = useState(true);

  // Calculate tax results
  const calculateTaxResults = () => {
    const exerciseCost = shareCount * strikePrice;
    const exerciseSpread = shareCount * (currentFMV - strikePrice);
    const totalProceeds = shareCount * sellPrice;
    let ordinaryIncomeTax = 0;
    let capitalGainsTax = 0;
    let amtTax = 0;
    let totalTax = 0;
    let effectiveTaxRate = 0;

    if (grantType === "iso") {
      if (holdingPeriod === "qualified") {
        // Long-term capital gains on entire gain from strike to sell
        capitalGainsTax =
          (totalProceeds - exerciseCost) * (capitalGainsRate / 100);

        // AMT calculation on spread at exercise
        if (includeAMT) {
          amtTax = exerciseSpread * 0.28; // Simplified AMT calculation
        }

        totalTax = capitalGainsTax + amtTax;
      } else {
        // Disqualified ISO - ordinary income on spread, capital gains on additional appreciation
        ordinaryIncomeTax = exerciseSpread * (incomeTaxRate / 100);
        capitalGainsTax =
          (totalProceeds - currentFMV * shareCount) * (capitalGainsRate / 100);
        totalTax = ordinaryIncomeTax + capitalGainsTax;
      }
    } else if (grantType === "nso") {
      // NSO - ordinary income on spread, capital gains on additional appreciation
      ordinaryIncomeTax = exerciseSpread * (incomeTaxRate / 100);

      if (holdingPeriod === "qualified") {
        capitalGainsTax =
          (totalProceeds - currentFMV * shareCount) * (capitalGainsRate / 100);
      } else {
        capitalGainsTax =
          (totalProceeds - currentFMV * shareCount) * (incomeTaxRate / 100);
      }

      totalTax = ordinaryIncomeTax + capitalGainsTax;
    } else if (grantType === "rsu") {
      // RSUs - ordinary income on FMV at vesting, capital gains on appreciation
      ordinaryIncomeTax = shareCount * currentFMV * (incomeTaxRate / 100);

      if (holdingPeriod === "qualified") {
        capitalGainsTax =
          (totalProceeds - currentFMV * shareCount) * (capitalGainsRate / 100);
      } else {
        capitalGainsTax =
          (totalProceeds - currentFMV * shareCount) * (incomeTaxRate / 100);
      }

      totalTax = ordinaryIncomeTax + capitalGainsTax;
    }

    const netProceeds = totalProceeds - exerciseCost - totalTax;
    effectiveTaxRate = (totalTax / (totalProceeds - exerciseCost)) * 100;

    return {
      exerciseCost: exerciseCost.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      totalProceeds: totalProceeds.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      ordinaryIncomeTax: ordinaryIncomeTax.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      capitalGainsTax: capitalGainsTax.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      amtTax: amtTax.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      totalTax: totalTax.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      netProceeds: netProceeds.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      effectiveTaxRate: effectiveTaxRate.toFixed(1) + "%",
      rawData: {
        ordinaryIncomeTax,
        capitalGainsTax,
        amtTax,
        totalTax,
      },
    };
  };

  const taxResults = calculateTaxResults();

  // Data for tax breakdown chart
  const generateTaxChartData = () => {
    const { rawData } = calculateTaxResults();
    const data = [];

    if (rawData.ordinaryIncomeTax > 0) {
      data.push({
        name: "Ordinary Income Tax",
        value: rawData.ordinaryIncomeTax,
      });
    }

    if (rawData.capitalGainsTax > 0) {
      data.push({
        name: "Capital Gains Tax",
        value: rawData.capitalGainsTax,
      });
    }

    if (rawData.amtTax > 0) {
      data.push({
        name: "AMT",
        value: rawData.amtTax,
      });
    }

    return data;
  };

  const taxChartData = generateTaxChartData();
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="space-y-4">
        <p>
          Understanding the tax implications of equity compensation is crucial
          for making informed decisions about when to exercise options and sell
          shares. Different types of equity have different tax treatment, and
          timing can significantly impact how much you pay in taxes.
        </p>

        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            Tax laws are complex and change frequently. While this lesson
            provides a foundation, consult with a tax professional before making
            decisions that may have significant tax consequences.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tax Treatment By Equity Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tax Treatment By Equity Type</h3>
        <Tabs defaultValue="iso" value={grantType} onValueChange={setGrantType}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="iso">ISOs</TabsTrigger>
            <TabsTrigger value="nso">NSOs</TabsTrigger>
            <TabsTrigger value="rsu">RSUs</TabsTrigger>
          </TabsList>

          <TabsContent value="iso" className="space-y-4 pt-4">
            <h4 className="font-medium">Incentive Stock Options (ISOs)</h4>
            <p>
              ISOs offer the most favorable tax treatment if certain conditions
              are met, but come with complexities like Alternative Minimum Tax
              (AMT).
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Key Tax Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="font-medium">At Grant:</span>
                      <span className="ml-2">No tax</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="font-medium">At Vesting:</span>
                      <span className="ml-2">No tax</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                      <span className="font-medium">At Exercise:</span>
                      <span className="ml-2">
                        No regular income tax, but may trigger AMT
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-green-500" />
                      <span className="font-medium">At Sale:</span>
                      <span className="ml-2">
                        Capital gains tax (rate depends on holding period)
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/40 p-2 rounded-md mt-2">
                    <p className="text-xs">
                      <strong>Qualified Disposition:</strong> To get favorable
                      tax treatment, you must sell:
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>At least 1 year after exercise, AND</li>
                      <li>At least 2 years after the option grant date</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    AMT Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    <GlossaryTooltip term="alternative minimum tax">
                      Alternative Minimum Tax (AMT)
                    </GlossaryTooltip>{" "}
                    is a parallel tax system designed to ensure that taxpayers
                    with significant income don't avoid taxes through deductions
                    and credits.
                  </p>
                  <p>
                    When you exercise ISOs, the "spread" (difference between FMV
                    and strike price) is considered income for AMT purposes,
                    even though it's not taxed under regular income tax.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md mt-2">
                    <p className="text-xs text-yellow-800">
                      <strong>AMT Impact:</strong> If you exercise ISOs with a
                      large spread, you may owe significant AMT even though you
                      haven't sold any shares or received any cash.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                ISO Example
              </h4>
              <p className="text-sm">
                You're granted 10,000 ISOs with a $1 strike price. After
                vesting, you exercise when the FMV is $5/share, paying $10,000
                to exercise. The spread is $40,000 ($4/share × 10,000 shares).
              </p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">
                      Scenario A: Qualified Disposition
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>
                        Hold for &gt;1 year after exercise, &gt;2 years after
                        grant
                      </li>
                      <li>Sell at $20/share for $200,000 total</li>
                      <li>
                        Pay long-term capital gains tax (15-20%) on $190,000
                        gain from strike
                      </li>
                      <li>
                        Potential AMT in year of exercise on $40,000 spread
                      </li>
                    </ul>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">
                      Scenario B: Disqualified Disposition
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Sell within 1 year of exercise</li>
                      <li>Sell at $20/share for $200,000 total</li>
                      <li>
                        Pay ordinary income tax (22-37%) on $40,000 spread
                      </li>
                      <li>
                        Pay short-term capital gains tax on $150,000 additional
                        gain
                      </li>
                      <li>No AMT impact</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nso" className="space-y-4 pt-4">
            <h4 className="font-medium">Non-qualified Stock Options (NSOs)</h4>
            <p>
              NSOs have more straightforward taxation than ISOs, but typically
              result in higher tax payments because the spread at exercise is
              always taxed as ordinary income.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Key Tax Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="font-medium">At Grant:</span>
                      <span className="ml-2">No tax (typically)</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="font-medium">At Vesting:</span>
                      <span className="ml-2">No tax</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-red-500" />
                      <span className="font-medium">At Exercise:</span>
                      <span className="ml-2">
                        Ordinary income tax on the spread
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                      <span className="font-medium">At Sale:</span>
                      <span className="ml-2">
                        Capital gains tax on any additional appreciation
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/40 p-2 rounded-md mt-2">
                    <p className="text-xs">
                      <strong>Tax Withholding:</strong> When you exercise NSOs,
                      your employer will typically withhold taxes (both income
                      tax and payroll taxes) on the spread.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    NSO Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Simpler tax treatment than ISOs</li>
                    <li>No AMT concerns</li>
                    <li>
                      Can be granted to non-employees (consultants, advisors)
                    </li>
                    <li>
                      No complex holding period requirements for tax treatment
                    </li>
                    <li>
                      Tax withholding at exercise means less surprise at tax
                      time
                    </li>
                  </ul>

                  <div className="bg-muted/40 p-2 rounded-md mt-2">
                    <p className="text-xs">
                      <strong>Capital Gains:</strong> If you hold the shares for
                      more than a year after exercise, any additional
                      appreciation qualifies for long-term capital gains rates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                NSO Example
              </h4>
              <p className="text-sm">
                You're granted 5,000 NSOs with a $2 strike price. After vesting,
                you exercise when the FMV is $8/share, paying $10,000 to
                exercise. The spread is $30,000 ($6/share × 5,000 shares).
              </p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">
                      Scenario A: Hold &gt;1 Year
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>
                        Pay ordinary income tax on $30,000 spread at exercise
                      </li>
                      <li>
                        Hold for &gt;1 year, then sell at $15/share ($75,000
                        total)
                      </li>
                      <li>
                        Pay long-term capital gains tax on $35,000 additional
                        gain
                      </li>
                      <li>
                        Your cost basis is $8/share (strike + taxed spread)
                      </li>
                    </ul>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">
                      Scenario B: Immediate Sale
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Exercise and immediately sell at $8/share</li>
                      <li>Pay ordinary income tax on $30,000 spread</li>
                      <li>
                        No additional capital gains (no time for appreciation)
                      </li>
                      <li>Simplest approach - no cash outlay or market risk</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rsu" className="space-y-4 pt-4">
            <h4 className="font-medium">Restricted Stock Units (RSUs)</h4>
            <p>
              RSUs have the most straightforward taxation of all equity types
              but offer less flexibility in timing tax events.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Key Tax Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="font-medium">At Grant:</span>
                      <span className="ml-2">No tax</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-red-500" />
                      <span className="font-medium">At Vesting:</span>
                      <span className="ml-2">
                        Ordinary income tax on full FMV of shares
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="font-medium">At Exercise:</span>
                      <span className="ml-2">N/A (no exercise required)</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                      <span className="font-medium">At Sale:</span>
                      <span className="ml-2">
                        Capital gains tax on any appreciation since vesting
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/40 p-2 rounded-md mt-2">
                    <p className="text-xs">
                      <strong>Tax Withholding:</strong> When RSUs vest, some
                      shares are typically automatically sold to cover taxes
                      (called "sell-to-cover"). Your employer will withhold both
                      income and payroll taxes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Info className="h-4 w-4 mr-2 text-primary" />
                    RSU Tax Simplicity
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    RSUs have the simplest tax treatment: the full value of the
                    shares at vesting is taxed as ordinary income, just like a
                    cash bonus.
                  </p>
                  <p>
                    Your cost basis for future capital gains is the FMV at
                    vesting (the amount you already paid tax on).
                  </p>
                  <div className="bg-muted/40 p-2 rounded-md mt-2">
                    <p className="text-xs">
                      <strong>Double-Trigger RSUs:</strong> Some private
                      companies use "double-trigger" RSUs that don't vest (for
                      tax purposes) until both time-based vesting and a
                      liquidity event occur. This prevents tax liability on
                      illiquid shares.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-primary" />
                RSU Example
              </h4>
              <p className="text-sm">
                You're granted 2,000 RSUs. When they vest, the share price is
                $10 each, making them worth $20,000.
              </p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">
                      Scenario A: Hold After Vesting
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>At vesting: $20,000 is taxed as ordinary income</li>
                      <li>
                        ~800 shares are automatically sold to cover taxes
                        (assuming 40% tax rate)
                      </li>
                      <li>
                        You keep ~1,200 shares with a cost basis of $10/share
                      </li>
                      <li>
                        Later sell at $15/share, paying capital gains tax on the
                        $5/share profit
                      </li>
                    </ul>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="font-medium text-sm">
                      Scenario B: Sell All At Vesting
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>All 2,000 shares are sold at vesting at $10/share</li>
                      <li>Pay ordinary income tax on the full $20,000</li>
                      <li>No capital gains tax (no time for appreciation)</li>
                      <li>Simplest approach - eliminates market risk</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Special Tax Considerations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
          Special Tax Considerations
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                83(b) Election
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                An{" "}
                <GlossaryTooltip term="83(b) election">
                  83(b) election
                </GlossaryTooltip>{" "}
                is a tax filing that allows you to pay tax on the value of
                equity at grant/exercise rather than at vesting.
              </p>
              <div className="space-y-1 mt-2">
                <p className="font-medium">When to consider:</p>
                <ul className="list-disc pl-4 text-xs">
                  <li>Early exercising unvested stock options</li>
                  <li>Receiving restricted stock (not RSUs)</li>
                  <li>
                    When the current value is low but expected to increase
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md mt-2">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> Must be filed within 30 days of
                  the grant/exercise. No exceptions!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                QSBS Exemption
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <GlossaryTooltip term="qualified small business stock">
                  Qualified Small Business Stock (QSBS)
                </GlossaryTooltip>{" "}
                exemption allows you to exclude up to 100% of capital gains from
                federal taxes on eligible startup stock held for at least 5
                years.
              </p>
              <div className="space-y-1 mt-2">
                <p className="font-medium">Requirements include:</p>
                <ul className="list-disc pl-4 text-xs">
                  <li>
                    C-Corporation with less than $50M in assets when stock
                    acquired
                  </li>
                  <li>
                    Company must be in qualified trade/business (most tech
                    startups qualify)
                  </li>
                  <li>Must hold stock for 5+ years</li>
                  <li>Gain exclusion limits apply ($10M or 10x basis)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                Early Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Some companies allow "early exercise" of unvested options.
                Combined with an 83(b) election, this can start your holding
                period for tax purposes earlier and minimize tax impact.
              </p>
              <div className="space-y-1 mt-2">
                <p className="font-medium">Advantages:</p>
                <ul className="list-disc pl-4 text-xs">
                  <li>Start long-term capital gains clock earlier</li>
                  <li>
                    Potentially lower or eliminate AMT (if FMV = strike price)
                  </li>
                  <li>Lower tax basis if company grows in value</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md mt-2">
                <p className="text-xs text-yellow-800">
                  <strong>Risk:</strong> If you leave before shares vest, you
                  typically forfeit unvested shares or the company buys them
                  back at your exercise price.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Tax Planning Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="space-y-1">
                <p className="font-medium">Key dates for tax planning:</p>
                <ul className="list-disc pl-4 text-xs">
                  <li>
                    <strong>30 days after grant/exercise:</strong> Deadline for
                    83(b) election
                  </li>
                  <li>
                    <strong>December 31:</strong> Last day for strategic
                    tax-year exercise decisions
                  </li>
                  <li>
                    <strong>1 year after exercise:</strong> Potential
                    qualification for long-term capital gains
                  </li>
                  <li>
                    <strong>2 years after ISO grant:</strong> ISO qualification
                    date (along with 1-year holding)
                  </li>
                  <li>
                    <strong>5 years after acquisition:</strong> QSBS holding
                    period requirement
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Try It Yourself - Tax Calculator */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-primary" />
          Try It Yourself: Equity Tax Calculator
        </h3>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="space-y-4">
            <p>
              Adjust the parameters below to see how different scenarios affect
              your tax liability:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grant-type">Equity Type</Label>
                  <RadioGroup
                    value={grantType}
                    onValueChange={setGrantType}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="iso" id="iso" />
                      <Label htmlFor="iso" className="text-sm">
                        ISO
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="nso" id="nso" />
                      <Label htmlFor="nso" className="text-sm">
                        NSO
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="rsu" id="rsu" />
                      <Label htmlFor="rsu" className="text-sm">
                        RSU
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="share-count">Number of Shares</Label>
                  <Input
                    id="share-count"
                    type="number"
                    value={shareCount}
                    onChange={(e) =>
                      setShareCount(parseInt(e.target.value) || 1000)
                    }
                    min={1000}
                    max={100000}
                  />
                </div>

                {(grantType === "iso" || grantType === "nso") && (
                  <div className="space-y-2">
                    <Label htmlFor="strike-price">Strike Price</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">$</span>
                      <Input
                        id="strike-price"
                        type="number"
                        value={strikePrice}
                        onChange={(e) =>
                          setStrikePrice(parseFloat(e.target.value) || 0.1)
                        }
                        min={0.1}
                        step={0.1}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current-fmv">
                    Current FMV / Vesting Price
                  </Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">$</span>
                    <Input
                      id="current-fmv"
                      type="number"
                      value={currentFMV}
                      onChange={(e) =>
                        setCurrentFMV(parseFloat(e.target.value) || 0.1)
                      }
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell-price">Sale Price</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">$</span>
                    <Input
                      id="sell-price"
                      type="number"
                      value={sellPrice}
                      onChange={(e) =>
                        setSellPrice(parseFloat(e.target.value) || 0.1)
                      }
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="income-tax-rate">
                      Ordinary Income Tax Rate
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {incomeTaxRate}%
                    </span>
                  </div>
                  <Slider
                    id="income-tax-rate"
                    min={15}
                    max={50}
                    step={1}
                    value={[incomeTaxRate]}
                    onValueChange={(value) => setIncomeTaxRate(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="capital-gains-rate">
                      Long-term Capital Gains Rate
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {capitalGainsRate}%
                    </span>
                  </div>
                  <Slider
                    id="capital-gains-rate"
                    min={0}
                    max={25}
                    step={1}
                    value={[capitalGainsRate]}
                    onValueChange={(value) => setCapitalGainsRate(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>25%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Holding Period</Label>
                  <RadioGroup
                    value={holdingPeriod}
                    onValueChange={setHoldingPeriod}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="qualified" id="qualified" />
                      <Label htmlFor="qualified" className="text-sm">
                        Long-term (&gt;1 year)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="disqualified" id="disqualified" />
                      <Label htmlFor="disqualified" className="text-sm">
                        Short-term (&gt;1 year)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {grantType === "iso" && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-amt"
                      checked={includeAMT}
                      onChange={(e) => setIncludeAMT(e.target.checked)}
                    />
                    <Label htmlFor="include-amt" className="text-sm">
                      Include AMT calculation
                    </Label>
                  </div>
                )}
              </div>

              <div>
                <div className="bg-primary/10 p-4 rounded-md space-y-4">
                  <h4 className="font-medium">Tax Summary</h4>

                  <div className="space-y-3">
                    {grantType !== "rsu" && (
                      <div className="flex justify-between items-center">
                        <span>Cost to Exercise:</span>
                        <span className="font-medium">
                          {taxResults.exerciseCost}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Gross Proceeds at Sale:</span>
                      <span className="font-medium">
                        {taxResults.totalProceeds}
                      </span>
                    </div>

                    {parseFloat(
                      taxResults.ordinaryIncomeTax.replace(/[^0-9.-]+/g, "")
                    ) > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Ordinary Income Tax:</span>
                        <span className="font-medium text-red-600">
                          {taxResults.ordinaryIncomeTax}
                        </span>
                      </div>
                    )}

                    {parseFloat(
                      taxResults.capitalGainsTax.replace(/[^0-9.-]+/g, "")
                    ) > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Capital Gains Tax:</span>
                        <span className="font-medium text-red-600">
                          {taxResults.capitalGainsTax}
                        </span>
                      </div>
                    )}

                    {grantType === "iso" &&
                      includeAMT &&
                      parseFloat(taxResults.amtTax.replace(/[^0-9.-]+/g, "")) >
                        0 && (
                        <div className="flex justify-between items-center">
                          <span>AMT Tax:</span>
                          <span className="font-medium text-red-600">
                            {taxResults.amtTax}
                          </span>
                        </div>
                      )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span>Total Tax:</span>
                      <span className="font-medium text-red-600">
                        {taxResults.totalTax}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Net Proceeds:</span>
                      <span className="font-medium text-primary">
                        {taxResults.netProceeds}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Effective Tax Rate:</span>
                      <span className="font-medium">
                        {taxResults.effectiveTaxRate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tax breakdown chart */}
                {taxChartData.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Tax Breakdown</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taxChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {taxChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) =>
                              value.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 0,
                              })
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tax insights */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Tax Insights</h4>

                  {grantType === "iso" && holdingPeriod === "qualified" && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 text-sm">
                        By holding ISOs for &gt;1 year after exercise and &gt;2
                        years after grant, you qualify for long-term capital
                        gains treatment on the entire gain above your strike
                        price.
                      </AlertDescription>
                    </Alert>
                  )}

                  {grantType === "iso" &&
                    includeAMT &&
                    parseFloat(taxResults.amtTax.replace(/[^0-9.-]+/g, "")) >
                      5000 && (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-700 text-sm">
                          Your AMT liability is significant. Consider exercising
                          across tax years or when the spread is smaller to
                          minimize AMT impact.
                        </AlertDescription>
                      </Alert>
                    )}

                  {grantType === "nso" && holdingPeriod === "disqualified" && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 text-sm">
                        By selling within 1 year of exercise, you're paying
                        higher short-term capital gains rates on any
                        appreciation since exercise.
                      </AlertDescription>
                    </Alert>
                  )}

                  {grantType === "rsu" && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 text-sm">
                        RSUs are taxed as ordinary income when they vest,
                        regardless of when you sell. Consider selling some
                        shares at vesting to cover the tax liability.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
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
              Different equity types have different tax treatment: ISOs can
              qualify for favorable capital gains treatment, NSOs are always
              taxed as ordinary income at exercise, and RSUs are taxed as
              ordinary income at vesting.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              2
            </div>
            <p>
              Timing matters for tax purposes. Holding periods, exercise dates,
              and vesting dates all impact your tax liability.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              3
            </div>
            <p>
              AMT can create significant tax liability when exercising ISOs,
              even without selling shares. Plan carefully when exercising large
              amounts of ISOs.
            </p>
          </div>
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary mr-2 mt-0.5">
              4
            </div>
            <p>
              Special provisions like 83(b) elections and QSBS exemptions can
              provide significant tax benefits in certain situations, but have
              strict requirements and deadlines.
            </p>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <Alert className="bg-muted border">
        <CalendarDays className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Coming up next:</span> We'll explore
          what happens to your equity during liquidity events such as
          acquisitions and IPOs, including lockup periods, tender offers, and
          strategies for maximizing your returns.
        </AlertDescription>
      </Alert>
    </div>
  );
}
