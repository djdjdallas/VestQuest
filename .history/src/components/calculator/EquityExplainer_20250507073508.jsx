// src/components/calculator/EquityExplainer.jsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, HelpCircle, Award, TrendingUp } from "lucide-react";

export function EquityExplainer() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle>Equity Education Center</CardTitle>
        </div>
        <CardDescription>
          Learn about equity compensation and make informed decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Equity Basics</TabsTrigger>
            <TabsTrigger value="tax">Tax Implications</TabsTrigger>
            <TabsTrigger value="decisions">Decision Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Understanding the fundamentals of equity compensation is crucial
              for making informed decisions about your financial future.
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Types of Equity Compensation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div>
                      <h4 className="font-medium">
                        ISO (Incentive Stock Options)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        ISOs offer potential tax advantages but have stricter
                        requirements. They can qualify for favorable tax
                        treatment if held for the required period (at least 1
                        year after exercise and 2 years after grant).
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">
                        NSO (Non-Qualified Stock Options)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        NSOs are more flexible but don't have the same tax
                        advantages as ISOs. The spread between the exercise
                        price and fair market value is taxed as ordinary income
                        at exercise.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">
                        RSU (Restricted Stock Units)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        RSUs represent a promise to receive company stock upon
                        vesting. Unlike stock options, there's no need to
                        exercise—you simply receive the shares when they vest
                        (though taxes are due at vesting).
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Understanding Vesting</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Vesting is the process by which you earn the right to your
                      equity over time. Most companies use a vesting schedule to
                      incentivize employees to stay with the company.
                    </p>

                    <div>
                      <h4 className="font-medium">Typical Vesting Schedule</h4>
                      <p className="text-sm text-muted-foreground">
                        A common vesting schedule is "4-year vesting with a
                        1-year cliff." This means:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                        <li>
                          No equity vests for the first year (the "cliff")
                        </li>
                        <li>
                          After 1 year, 25% of your equity vests all at once
                        </li>
                        <li>
                          The remaining 75% vests monthly or quarterly over the
                          next 3 years
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium">Cliff Vesting</h4>
                      <p className="text-sm text-muted-foreground">
                        The "cliff" is the initial period during which no equity
                        vests. If you leave before the cliff, you typically
                        forfeit all equity.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>Key Terms and Concepts</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-medium">Strike Price</h4>
                      <p className="text-sm text-muted-foreground">
                        For stock options, this is the price at which you can
                        purchase shares, regardless of their current market
                        value. It's typically set at the fair market value of
                        the stock when the options are granted.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Fair Market Value (FMV)</h4>
                      <p className="text-sm text-muted-foreground">
                        The current value of the company's stock. For public
                        companies, this is the market price. For private
                        companies, this is determined by a 409A valuation.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Exercise</h4>
                      <p className="text-sm text-muted-foreground">
                        The act of purchasing shares using your stock options at
                        the strike price. You pay the strike price multiplied by
                        the number of shares you're exercising.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Spread</h4>
                      <p className="text-sm text-muted-foreground">
                        The difference between the fair market value and the
                        strike price at the time of exercise. This is the amount
                        that may be subject to taxation.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Understanding the tax implications of equity compensation is
              essential for maximizing your financial benefits and avoiding
              unexpected tax bills.
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>ISO Tax Treatment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      ISOs can offer favorable tax treatment if specific holding
                      periods are met.
                    </p>

                    <div>
                      <h4 className="font-medium">At Exercise</h4>
                      <p className="text-sm text-muted-foreground">
                        No ordinary income tax at exercise. However, the spread
                        between the exercise price and FMV may trigger
                        Alternative Minimum Tax (AMT).
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">At Sale</h4>
                      <p className="text-sm text-muted-foreground">
                        If you hold the shares for at least 1 year after
                        exercise AND 2 years after the grant date (a "qualifying
                        disposition"), the entire gain is treated as long-term
                        capital gains, which typically has lower tax rates.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        If you sell before meeting these holding periods (a
                        "disqualifying disposition"), the spread at exercise is
                        taxed as ordinary income, and any additional gain is
                        taxed as capital gains.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Alternative Minimum Tax</h4>
                      <p className="text-sm text-muted-foreground">
                        AMT is a parallel tax system designed to ensure that
                        taxpayers with significant deductions still pay a
                        minimum amount of tax. ISO exercises can trigger AMT
                        because the spread is considered an AMT adjustment.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>NSO Tax Treatment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-medium">At Exercise</h4>
                      <p className="text-sm text-muted-foreground">
                        The spread between the exercise price and FMV is taxed
                        as ordinary income. This is subject to income tax
                        withholding, as well as Social Security and Medicare
                        taxes.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">At Sale</h4>
                      <p className="text-sm text-muted-foreground">
                        Any appreciation after exercise is taxed as capital
                        gains. If you hold the shares for more than a year after
                        exercise, this is treated as long-term capital gains.
                        Otherwise, it's treated as short-term capital gains.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Key Difference from ISOs</h4>
                      <p className="text-sm text-muted-foreground">
                        NSOs trigger ordinary income tax at exercise, but they
                        don't trigger AMT. This makes tax planning more
                        straightforward, but potentially more costly in the
                        short term.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>RSU Tax Treatment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-medium">At Vesting</h4>
                      <p className="text-sm text-muted-foreground">
                        RSUs are taxed as ordinary income when they vest. The
                        taxable amount is the fair market value of the shares on
                        the vesting date. Taxes are typically withheld at
                        vesting, often by selling a portion of the shares.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">At Sale</h4>
                      <p className="text-sm text-muted-foreground">
                        Any appreciation after vesting is taxed as capital
                        gains. If you hold the shares for more than a year after
                        vesting, this is treated as long-term capital gains.
                        Otherwise, it's treated as short-term capital gains.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Double-Trigger RSUs</h4>
                      <p className="text-sm text-muted-foreground">
                        Some companies use "double-trigger" RSUs, which require
                        both time-based vesting and a liquidity event (like an
                        IPO) to vest. These are not taxed until both conditions
                        are met.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Making the right decisions about your equity compensation can
              significantly impact your financial future. Here are key
              considerations to guide your decision-making process.
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>When to Exercise Options</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      The decision to exercise options depends on several
                      factors:
                    </p>

                    <div>
                      <h4 className="font-medium">Financial Capacity</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider whether you have the cash to cover both the
                        exercise cost and potential tax implications.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Company Outlook</h4>
                      <p className="text-sm text-muted-foreground">
                        Evaluate the company's growth prospects and potential
                        for increased value.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Tax Implications</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider the immediate tax impact (especially AMT for
                        ISOs) versus potential long-term tax benefits.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Expiration Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        Be aware of when your options expire, typically 90 days
                        after leaving the company (though some companies offer
                        extended exercise windows).
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Tax Optimization Strategies</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-medium">Early Exercise</h4>
                      <p className="text-sm text-muted-foreground">
                        Some companies allow "early exercise" of unvested
                        options. This can potentially reduce tax implications by
                        exercising when the spread is minimal or non-existent.
                        Consider filing an 83(b) election within 30 days if you
                        early exercise.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Exercise Timing</h4>
                      <p className="text-sm text-muted-foreground">
                        For ISOs, consider exercising near the end of the tax
                        year to minimize the time your money is tied up before
                        potentially selling in the next tax year.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Staged Exercise Approach</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider exercising options over multiple tax years to
                        spread out the tax impact, especially for AMT
                        considerations with ISOs.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>Risk Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-medium">Diversification</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider your overall investment portfolio. Having too
                        much of your wealth tied to a single company increases
                        risk.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Company Stage</h4>
                      <p className="text-sm text-muted-foreground">
                        Early-stage startups carry higher risk. Consider this
                        when deciding how much to invest in exercising options.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Liquidity Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        Assess when you might be able to sell shares. For
                        private companies, this might be years away or might
                        never happen.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Alternative Funding</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider options like equity financing or secondary
                        markets if available, to help fund exercises or reduce
                        concentration risk.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
