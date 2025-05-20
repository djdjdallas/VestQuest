"use client";

import { useState, useEffect } from "react";
import { EducationCard } from "@/components/education/EducationCard";
import { GlossaryItem } from "@/components/education/GlossaryItem";
import { ProgressiveDisclosure } from "@/components/education/ProgressiveDisclosure";
import { InteractiveEducation } from "@/components/education/InteractiveEducation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpenCheck,
  GraduationCap,
  BookOpenText,
  Star,
  Calculator,
  Lock,
  ArrowRight,
  Download,
  BarChart4,
  Calendar,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { SimpleCalculator } from "@/components/calculator/SimpleCalculator";

const educationContent = [
  {
    title: "Understanding Stock Options",
    content:
      "Stock options give you the right to buy company shares at a fixed price (strike price) in the future. They're a way for startups to compensate employees while conserving cash.",
    example:
      "If you have 1,000 options with a $1 strike price, and the company stock is worth $10, you can buy 1,000 shares for $1,000 and immediately sell them for $10,000, making a $9,000 profit (before taxes).",
    intermediateExplanation:
      "Options come in two main types: Incentive Stock Options (ISOs) and Non-qualified Stock Options (NSOs). Each has different tax implications and requirements.",
    advancedDetails:
      "ISOs offer potentially favorable tax treatment but must meet specific holding requirements and may trigger AMT. NSOs are taxed as ordinary income at exercise.",
    relatedTerms: ["Strike Price", "Exercise", "Vesting", "AMT"],
    isPremium: false,
  },
  {
    title: "Vesting Schedules",
    content:
      "Vesting is the process by which you earn your stock options over time. Most companies use a 4-year vesting schedule with a 1-year cliff.",
    example:
      "With a 4-year vesting schedule and 1-year cliff, you earn nothing for the first year. After one year, 25% vests immediately. Then you earn the remaining 75% monthly over the next 3 years.",
    intermediateExplanation:
      "Vesting schedules can include acceleration provisions that may apply during company acquisitions or other specific events.",
    advancedDetails:
      "Double-trigger acceleration requires both a change in control and an involuntary termination. Single-trigger acceleration occurs automatically upon a change in control.",
    relatedTerms: [
      "Cliff",
      "Single-Trigger Acceleration",
      "Double-Trigger Acceleration",
      "Vesting Start Date",
    ],
    isPremium: false,
  },
  {
    title: "Exercise Windows",
    content:
      "When you leave a company, you typically have 90 days to exercise your vested options. After that, you lose them.",
    example:
      "If you have 1,000 vested options when you leave, you have 90 days to decide whether to buy the shares at the strike price.",
    intermediateExplanation:
      "Some companies now offer extended post-termination exercise windows of several years or more, giving former employees more time to decide.",
    advancedDetails:
      "Extended exercise windows can have tax implications, as ISOs automatically convert to NSOs after 90 days from termination, potentially changing the tax treatment.",
    relatedTerms: ["Post-termination Exercise", "Early Exercise", "ISO", "NSO"],
    isPremium: false,
  },
  {
    title: "Tax Implications",
    content:
      "Exercising options can trigger tax events. ISOs can qualify for capital gains treatment if held long enough, while NSOs are taxed as ordinary income.",
    example:
      "If you exercise NSOs with a $1 strike price when shares are worth $10, you'll owe ordinary income tax on the $9 spread immediately.",
    intermediateExplanation:
      "The timing of when you exercise options and sell shares can significantly impact your tax burden due to differences in ordinary income tax rates versus long-term capital gains rates.",
    advancedDetails:
      "For ISOs, holding shares for at least 1 year after exercise and 2 years after grant can qualify for long-term capital gains tax rates, which are typically lower than ordinary income tax rates.",
    relatedTerms: ["AMT", "Capital Gains", "83(b) Election", "Tax Withholding"],
    isPremium: false,
  },
  {
    title: "Understanding 409A Valuations",
    content:
      "A 409A valuation is an independent appraisal of a private company's stock value, which determines the minimum price at which stock options can be granted.",
    example:
      "Your company's 409A valuation is $5 per share. New options must have a strike price of at least $5 to avoid tax penalties.",
    intermediateExplanation:
      "Companies typically update their 409A valuations at least annually or after significant events like funding rounds or major business changes.",
    advancedDetails:
      "If a company grants options below fair market value without proper justification, recipients may face significant tax penalties including immediate taxation plus an additional 20% tax penalty.",
    relatedTerms: [
      "Fair Market Value",
      "Strike Price",
      "Common Stock",
      "Preferred Stock",
    ],
    isPremium: true,
  },
  {
    title: "Equity Dilution: How Your Ownership Percentage Changes",
    content:
      "Dilution occurs when a company issues new shares, reducing the ownership percentage of existing shareholders.",
    example:
      "You own 1% of a company. After a new funding round, the company issues more shares and your ownership drops to 0.8%.",
    intermediateExplanation:
      "Dilution is a normal part of company growth, especially through venture capital funding rounds. Understanding potential dilution scenarios helps set realistic expectations for your equity's future value.",
    advancedDetails:
      "Anti-dilution provisions protect investors from losing value in down rounds but can accelerate the dilution of common stockholders. Understanding the company's capitalization table and future funding needs helps estimate potential dilution.",
    relatedTerms: [
      "Capitalization Table",
      "Down Round",
      "Anti-Dilution Provisions",
      "Option Pool",
    ],
    isPremium: true,
  },
  {
    title: "Exit Strategies: IPOs vs. Acquisitions",
    content:
      "Companies exit in different ways, most commonly through IPOs or acquisitions. Each exit type has different implications for your equity.",
    example:
      "In an acquisition, your company may be purchased for cash, stock of the acquiring company, or a combination of both.",
    intermediateExplanation:
      "IPOs typically include a lock-up period preventing employees from selling shares immediately. Acquisitions might include earn-outs or retention bonuses that affect the total value you receive.",
    advancedDetails:
      "Secondary markets may provide liquidity before an official exit, though often at a discount and with company approval required. Different exit structures can dramatically affect your after-tax proceeds.",
    relatedTerms: [
      "Lock-up Period",
      "Earn-out",
      "Liquidity Event",
      "Secondary Market",
    ],
    isPremium: true,
  },
];

const glossaryTerms = [
  {
    term: "Strike Price",
    definition:
      "The fixed price at which you can buy shares when exercising your options.",
    examples: [
      "If your strike price is $1 per share and the current FMV is $5, you have a $4 per share 'spread'.",
      "Strike prices are typically set to the Fair Market Value (409A valuation) at the time of grant.",
    ],
    technicalDetails:
      "Strike prices must typically be at least equal to the Fair Market Value (FMV) at grant to avoid Section 409A penalties, which can include immediate taxation plus a 20% penalty.",
    relatedTerms: ["409A Valuation", "Exercise", "Spread", "FMV"],
    isPremium: false,
  },
  {
    term: "Fair Market Value (FMV)",
    definition:
      "The current value of the company's shares, usually determined by a 409A valuation.",
    examples: [
      "A company's 409A valuation sets the FMV at $10 per share, which would be the minimum strike price for new options.",
      "FMV typically increases with each funding round as the company grows in value.",
    ],
    technicalDetails:
      "FMV is determined through various methodologies including discounted cash flow analysis, comparable company analysis, and prior financing rounds, adjusted for different share classes.",
    relatedTerms: [
      "409A Valuation",
      "Strike Price",
      "Common Stock",
      "Preferred Stock",
    ],
    isPremium: false,
  },
  {
    term: "Cliff",
    definition:
      "A period of time you must work before any options vest. Typically 1 year.",
    examples: [
      "With a 1-year cliff on a 4-year vesting schedule, you'll receive 25% of your options after your first anniversary, then the remainder monthly.",
      "If you leave before the cliff date, you receive no equity.",
    ],
    technicalDetails:
      "Cliffs serve as retention mechanisms and protect companies from granting equity to employees who leave very early. The exact cliff period is defined in your equity grant agreement.",
    relatedTerms: [
      "Vesting Schedule",
      "Vesting",
      "Retention",
      "Grant Agreement",
    ],
    isPremium: false,
  },
  {
    term: "ISO (Incentive Stock Option)",
    definition:
      "A type of stock option that can qualify for favorable tax treatment if certain requirements are met.",
    examples: [
      "An ISO held for over 1 year after exercise and 2 years after grant may qualify for long-term capital gains treatment.",
      "ISOs that don't meet holding requirements are treated as NSOs for tax purposes.",
    ],
    technicalDetails:
      "ISOs are only available to employees, have a $100,000 limit for options becoming exercisable in any calendar year, and must be exercised within 90 days of employment termination to maintain ISO status.",
    relatedTerms: ["Holding Period", "AMT", "NSO", "Capital Gains"],
    isPremium: false,
  },
  {
    term: "NSO (Non-Qualified Stock Option)",
    definition:
      "Stock options that don't qualify for special tax treatment and are taxed as ordinary income upon exercise.",
    examples: [
      "When exercising NSOs, you'll pay ordinary income tax on the difference between the strike price and current fair market value.",
      "NSOs can be granted to non-employees like contractors and board members.",
    ],
    technicalDetails:
      "Upon exercise, the spread between strike price and FMV is considered compensation income subject to income tax and employment taxes. The company typically withholds these taxes through a 'cashless exercise' or other method.",
    relatedTerms: ["Withholding", "Ordinary Income", "Spread", "Exercise"],
    isPremium: false,
  },
  {
    term: "RSU (Restricted Stock Unit)",
    definition:
      "A promise to give you shares in the future, typically when they vest.",
    examples: [
      "If you have 1,000 RSUs that vest over 4 years, you'll receive actual shares quarterly as they vest.",
      "When RSUs vest, you receive shares valued at the current FMV and pay taxes on that value as ordinary income.",
    ],
    technicalDetails:
      "Unlike options, RSUs always have value (as long as the stock has value), don't require an exercise, and typically result in automatic tax withholding through share withholding at vesting time.",
    relatedTerms: [
      "Double-Trigger RSU",
      "Share Withholding",
      "Vesting",
      "Tax Withholding",
    ],
    isPremium: false,
  },
  {
    term: "AMT (Alternative Minimum Tax)",
    definition:
      "A parallel tax system that can be triggered when exercising ISOs.",
    examples: [
      "If you exercise ISOs with a large spread between strike price and FMV, you may trigger AMT even though no regular income tax applies.",
      "AMT paid can potentially be recovered in future years through AMT credits.",
    ],
    technicalDetails:
      "The spread between your exercise price and the fair market value is considered an AMT preference item. The AMT calculation adds this spread back into your income, potentially resulting in a higher tax bill than under regular tax rules.",
    relatedTerms: ["ISO", "Spread", "Exercise", "AMT Credit"],
    isPremium: false,
  },
  {
    term: "409A Valuation",
    definition:
      "An independent appraisal of a private company's stock value for tax purposes.",
    examples: [
      "After a funding round, a company gets a new 409A valuation showing the common stock is worth $5 per share.",
      "The 409A valuation establishes the minimum strike price for new option grants.",
    ],
    technicalDetails:
      "Named after IRS code section 409A, these valuations provide 'safe harbor' protection if performed by a qualified independent appraiser. Companies typically update valuations every 12 months or after material events.",
    relatedTerms: [
      "Safe Harbor",
      "Fair Market Value",
      "Common Stock",
      "Strike Price",
    ],
    isPremium: false,
  },
  {
    term: "Liquidation Preference",
    definition:
      "The right of preferred shareholders to receive their investment back before common shareholders in an exit event.",
    examples: [
      "With a 1x liquidation preference, investors get their money back before common shareholders receive anything.",
      "A 2x participating preference means investors get twice their investment back, plus share in the remaining proceeds.",
    ],
    technicalDetails:
      "Preferences can be non-participating (choose between preference or converting to common) or participating (get preference plus share as if converted). Multiple preferences are cumulative across rounds and can significantly impact common stock proceeds in moderate-value exits.",
    relatedTerms: [
      "Participating Preferred",
      "Non-participating Preferred",
      "Waterfall Analysis",
      "Exit Proceeds",
    ],
    isPremium: true,
  },
  {
    term: "83(b) Election",
    definition:
      "A tax filing that allows you to pre-pay taxes on unvested equity at the grant date rather than as it vests.",
    examples: [
      "After early exercising options, filing an 83(b) lets you pay tax on the current (low) spread rather than the future (potentially higher) spread as shares vest.",
      "Must be filed within 30 days of acquiring unvested shares or early exercising options.",
    ],
    technicalDetails:
      "When filed, you pay ordinary income tax on the spread between purchase price and FMV at time of early exercise. Future appreciation is taxed as capital gains. Without it, you pay ordinary income tax on the spread between purchase price and FMV as each portion vests.",
    relatedTerms: [
      "Early Exercise",
      "Restricted Stock",
      "Capital Gains",
      "Tax Basis",
    ],
    isPremium: true,
  },
];

const testimonials = [
  {
    quote:
      "VestQuest's educational resources helped me understand my equity package and negotiate a better offer that increased my compensation by over $50,000.",
    author: "Jessica K.",
    role: "Senior Product Manager",
    company: "Tech Startup",
    imageSrc: "/images/testimonial1.jpg",
  },
  {
    quote:
      "I was completely lost about what to do with my stock options until I found these guides. The tax planning insights alone saved me thousands of dollars.",
    author: "Marcus T.",
    role: "Software Engineer",
    company: "Growth-stage SaaS Company",
    imageSrc: "/images/testimonial2.jpg",
  },
  {
    quote:
      "The interactive calculators gave me the confidence to make informed decisions about my equity during our company's acquisition. Invaluable resource!",
    author: "Priya M.",
    role: "Marketing Director",
    company: "Recently Acquired Startup",
    imageSrc: "/images/testimonial3.jpg",
  },
];

const quickQuizQuestions = [
  {
    question:
      "What happens when you have a 1-year cliff in your vesting schedule?",
    options: [
      { text: "You get 100% of your equity after 1 year", isCorrect: false },
      {
        text: "You get no equity until you've worked for 1 year, then 25% vests at once",
        isCorrect: true,
      },
      {
        text: "Your equity vests 1% per month for the first year",
        isCorrect: false,
      },
      { text: "You must exercise all options within 1 year", isCorrect: false },
    ],
  },
  {
    question:
      "What is the typical post-termination exercise window for stock options?",
    options: [
      { text: "30 days", isCorrect: false },
      { text: "60 days", isCorrect: false },
      { text: "90 days", isCorrect: true },
      { text: "1 year", isCorrect: false },
    ],
  },
  {
    question: "Which type of equity is taxed at vesting?",
    options: [
      { text: "Incentive Stock Options (ISOs)", isCorrect: false },
      { text: "Non-qualified Stock Options (NSOs)", isCorrect: false },
      { text: "Restricted Stock Units (RSUs)", isCorrect: true },
      { text: "None of the above", isCorrect: false },
    ],
  },
];

export default function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("basics");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [leadMagnetEmail, setLeadMagnetEmail] = useState("");
  const [leadMagnetSubmitted, setLeadMagnetSubmitted] = useState(false);

  // Filter content based on search query
  const filteredEducationContent = searchQuery
    ? educationContent.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : educationContent;

  const filteredGlossaryTerms = searchQuery
    ? glossaryTerms.filter(
        (item) =>
          item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.definition.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : glossaryTerms;

  const handleQuizAnswer = (questionIndex, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: optionIndex,
    });
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  const calculateQuizScore = () => {
    let score = 0;
    quickQuizQuestions.forEach((question, index) => {
      if (question.options[quizAnswers[index]]?.isCorrect) {
        score++;
      }
    });
    return score;
  };

  const handleLeadMagnetSubmit = (e) => {
    e.preventDefault();
    setLeadMagnetSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* SEO-optimized header */}
      <div className="mb-12 text-center">
        <Badge className="mb-4">Free Education</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Equity Education Center
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Master the fundamentals of equity compensation and make smarter
          decisions about your stock options, RSUs, and more.
        </p>
      </div>

      {/* Hero section with visual explainer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">
            Understand Your Equity Compensation
          </h2>
          <p className="text-lg">
            Stock options, RSUs, and other equity can be worth thousands—or even
            millions—but only if you make the right decisions.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-1" />
              <div>
                <h3 className="font-medium">Free Fundamentals</h3>
                <p className="text-muted-foreground">
                  Learn the basics of equity types, vesting, and key
                  terminology.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-1" />
              <div>
                <h3 className="font-medium">Interactive Tools</h3>
                <p className="text-muted-foreground">
                  Try our simplified calculators and visualizations to see how
                  equity works.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-1" />
              <div>
                <h3 className="font-medium">Expert Guidance</h3>
                <p className="text-muted-foreground">
                  Get clear explanations for complex concepts without the
                  jargon.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="#interactive-calculator">
                Try Interactive Calculator
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
        <div className="bg-muted p-8 rounded-xl">
          <div className="relative shadow-lg rounded-lg overflow-hidden border bg-card">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="secondary" className="font-mono">
                FREE
              </Badge>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Quick Equity Example
              </h3>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-muted rounded-md">
                  <p className="mb-2 font-medium">Your equity grant:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>10,000 stock options at $1 strike price</li>
                    <li>4-year vesting with 1-year cliff</li>
                    <li>Current company share value: $5</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>After 1 year:</span>
                    <span className="font-semibold">2,500 shares vested</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost to exercise:</span>
                    <span className="font-semibold">$2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current equity value:</span>
                    <span className="font-semibold">$12,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential gain:</span>
                    <span className="font-semibold text-primary">$10,000</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-muted-foreground italic text-xs">
                    Note: This is a simplified example. Real-world scenarios
                    include tax considerations and other factors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick quiz to engage users */}
      <Card className="mb-16">
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Test Your Equity Knowledge
          </CardTitle>
          <CardDescription>
            Take this quick 3-question quiz to see where you stand
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizSubmitted ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <h3 className="text-xl font-medium mb-2">
                  Your Score: {calculateQuizScore()}/{quickQuizQuestions.length}
                </h3>
                <p className="text-muted-foreground">
                  {calculateQuizScore() === quickQuizQuestions.length
                    ? "Perfect! You know your equity basics well!"
                    : calculateQuizScore() > 0
                    ? "Good start! Learn more with our free resources below."
                    : "There's plenty to learn! Explore our free resources below."}
                </p>
              </div>

              <div className="space-y-4">
                {quickQuizQuestions.map((question, qIndex) => (
                  <div key={qIndex} className="border rounded-lg p-4">
                    <p className="font-medium mb-3">
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => {
                        const isSelected = quizAnswers[qIndex] === oIndex;
                        const isCorrect = option.isCorrect;

                        let bgColor = "";
                        if (isSelected && isCorrect)
                          bgColor = "bg-green-50 border-green-200";
                        else if (isSelected && !isCorrect)
                          bgColor = "bg-red-50 border-red-200";
                        else if (!isSelected && isCorrect)
                          bgColor = "bg-green-50 border-green-200";

                        return (
                          <div
                            key={oIndex}
                            className={`border rounded p-2 ${bgColor}`}
                          >
                            {option.text}
                            {isSelected && isCorrect && (
                              <span className="ml-2 text-green-600 text-sm">
                                ✓ Correct
                              </span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="ml-2 text-red-600 text-sm">
                                ✗ Incorrect
                              </span>
                            )}
                            {!isSelected && isCorrect && (
                              <span className="ml-2 text-green-600 text-sm">
                                ← Correct answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {quickQuizQuestions.map((question, qIndex) => (
                <div key={qIndex} className="border rounded-lg p-4">
                  <p className="font-medium mb-3">
                    {qIndex + 1}. {question.question}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`border rounded p-2 cursor-pointer hover:bg-muted ${
                          quizAnswers[qIndex] === oIndex
                            ? "bg-primary/10 border-primary"
                            : ""
                        }`}
                        onClick={() => handleQuizAnswer(qIndex, oIndex)}
                      >
                        {option.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                className="w-full"
                onClick={handleQuizSubmit}
                disabled={
                  Object.keys(quizAnswers).length < quickQuizQuestions.length
                }
              >
                Submit Answers
              </Button>
            </div>
          )}
        </CardContent>
        {quizSubmitted && (
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/register">Create Account for Full Assessment</Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Search bar */}
      <div className="relative mb-8 max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search for equity concepts..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main content tabs */}
      <Tabs
        defaultValue="basics"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-16"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8">
          <TabsTrigger value="basics" className="flex items-center">
            <BookOpenText className="h-4 w-4 mr-2" /> Equity Basics
          </TabsTrigger>
          <TabsTrigger value="glossary" className="flex items-center">
            <BookOpenCheck className="h-4 w-4 mr-2" /> Glossary
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center">
            <Calculator className="h-4 w-4 mr-2" /> Calculator
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center">
            <Star className="h-4 w-4 mr-2" /> Advanced Topics
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center">
            <GraduationCap className="h-4 w-4 mr-2" /> Decision Guides
          </TabsTrigger>
        </TabsList>

        {/* Equity Basics Tab */}
        <TabsContent value="basics" className="space-y-6 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEducationContent
              .filter((item) => !item.isPremium)
              .map((item, index) => (
                <EducationCard
                  key={index}
                  title={item.title}
                  content={item.content}
                  example={item.example}
                  difficulty="beginner"
                  estimatedTime="5 min read"
                  tags={["Free", "Fundamentals"]}
                />
              ))}
          </div>

          <div className="relative mt-8 pt-8 border-t">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Premium Content Preview
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEducationContent
                .filter((item) => item.isPremium)
                .slice(0, 1)
                .map((item, index) => (
                  <EducationCard
                    key={index}
                    title={item.title}
                    content={item.content}
                    tags={["Premium", "Advanced"]}
                    estimatedTime="10 min read"
                    example={item.example}
                    actions={
                      <Button
                        className="w-full"
                        onClick={() => setShowPremiumModal(true)}
                      >
                        Unlock Premium Content
                      </Button>
                    }
                  />
                ))}

              {filteredEducationContent
                .filter((item) => item.isPremium)
                .slice(1)
                .map((item, index) => (
                  <Card
                    key={index}
                    className="h-full flex flex-col opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Lock className="h-3 w-3" /> Premium
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" /> 10 min read
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow relative">
                      <p className="text-gray-700">
                        {item.content.substring(0, 100)}...
                      </p>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background flex items-end justify-center p-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowPremiumModal(true)}
                        >
                          <Lock className="mr-2 h-4 w-4" /> Unlock Content
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Unlock All Advanced Topics{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Glossary Tab */}
        <TabsContent value="glossary" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGlossaryTerms
              .filter((item) => !item.isPremium)
              .map((item, index) => (
                <GlossaryItem
                  key={index}
                  term={item.term}
                  definition={item.definition}
                  examples={item.examples}
                  relatedTerms={item.relatedTerms}
                  technicalDetails={item.technicalDetails}
                />
              ))}
          </div>

          <div className="relative mt-12 pt-8 border-t">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Premium Terms Preview
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGlossaryTerms
                .filter((item) => item.isPremium)
                .slice(0, 1)
                .map((item, index) => (
                  <GlossaryItem
                    key={index}
                    term={item.term}
                    definition={item.definition}
                    examples={
                      item.examples && item.examples.length > 0
                        ? [item.examples[0]]
                        : []
                    }
                    relatedTerms={item.relatedTerms}
                    technicalDetails={null}
                    tags={["Premium", "Advanced"]}
                  />
                ))}

              {filteredGlossaryTerms
                .filter((item) => item.isPremium)
                .slice(1)
                .map((item, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden transition-all hover:shadow-md opacity-75 hover:opacity-100"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span className="truncate">{item.term}</span>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 ml-2"
                        >
                          <Lock className="h-3 w-3" /> Premium
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{item.definition}</p>
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPremiumModal(true)}
                        >
                          Unlock Full Definition
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild>
              <Link href="/register">
                Access Complete Equity Glossary{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Interactive Calculator Tab */}
        <TabsContent
          value="interactive"
          className="space-y-6 pt-4"
          id="interactive-calculator"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-primary" />
                Simple Equity Calculator
              </CardTitle>
              <CardDescription>
                Get a quick estimate of your equity's value and potential growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleCalculator />
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-4">
              <p className="text-center text-muted-foreground text-sm mb-2">
                This is a simplified calculator. For advanced features
                including:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full mb-4">
                <div className="flex items-center bg-muted p-2 rounded">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm">Tax planning</span>
                </div>
                <div className="flex items-center bg-muted p-2 rounded">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm">Custom vesting</span>
                </div>
                <div className="flex items-center bg-muted p-2 rounded">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm">Exit modeling</span>
                </div>
              </div>
              <Button asChild>
                <Link href="/register">Access Advanced Calculators</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart4 className="h-5 w-5 mr-2 text-primary" />
                  Visualize Your Equity Journey
                </CardTitle>
                <CardDescription>
                  Create personalized visual models of your vesting schedule and
                  equity growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                  <div className="text-center px-6">
                    <BarChart4 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                    <p className="text-muted-foreground">
                      Interactive vesting charts and valuation projections
                      available with a free account
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">Create Free Visualizations</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Plan Important Equity Dates
                </CardTitle>
                <CardDescription>
                  Track vesting milestones, tax deadlines, and exercise windows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                  <div className="text-center px-6">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                    <p className="text-muted-foreground">
                      Personalized equity timeline with key dates and
                      notifications requires an account
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">Create Equity Timeline</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Topics Tab */}
        <TabsContent value="advanced" className="space-y-6 pt-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Premium Advanced Topics</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Dive deeper into complex equity concepts with our premium content.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden border-dashed opacity-90 hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Premium
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>Tax Optimization Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Strategic exercise timing to minimize AMT</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>83(b) election analysis and step-by-step guide</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Capital gains planning for maximum return</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Lock className="mr-2 h-4 w-4" /> Unlock Content
                </Button>
              </CardFooter>
            </Card>

            <Card className="relative overflow-hidden border-dashed opacity-90 hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Premium
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>Exit Planning Masterclass</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>IPO preparation and lock-up strategies</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>
                      Acquisition payouts and retention bonus analysis
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>
                      Secondary market opportunities and considerations
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Lock className="mr-2 h-4 w-4" /> Unlock Content
                </Button>
              </CardFooter>
            </Card>

            <Card className="relative overflow-hidden border-dashed opacity-90 hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Premium
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>Negotiation & Offer Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Equity offer valuation framework</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Negotiation scripts for better equity terms</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Comparing multiple offers with equity packages</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Lock className="mr-2 h-4 w-4" /> Unlock Content
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="bg-muted rounded-lg p-8 mt-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-2/3 space-y-4">
                <Badge variant="outline">Premium Guide</Badge>
                <h3 className="text-2xl font-bold">
                  The Complete Equity Optimization Playbook
                </h3>
                <p>
                  Our comprehensive 85-page guide covers everything from grant
                  evaluation to exit planning. With step-by-step walkthroughs,
                  tax strategies, and decision frameworks.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                    <span>
                      Personalized decision tree based on your situation
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                    <span>Calculator templates for various scenarios</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                    <span>
                      Expert-reviewed tax guidance and planning strategies
                    </span>
                  </div>
                </div>
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get Access <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="md:w-1/3 bg-background p-4 rounded-lg shadow-lg">
                <div className="aspect-[3/4] bg-muted rounded-md flex items-center justify-center relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <BookOpenText className="h-10 w-10 mb-4 text-primary" />
                    <h4 className="text-lg font-bold mb-2">
                      Equity Optimization Playbook
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive guide with strategies, templates and tools
                    </p>
                    <Badge>85 Pages</Badge>
                  </div>
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      asChild
                    >
                      <Link href="/register">
                        <Lock className="h-4 w-4" /> Preview Contents
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Decision Guides Tab */}
        <TabsContent value="guides" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">
                    Exercise Decision Guide
                  </h3>
                  <p className="text-muted-foreground">
                    Get personalized recommendations on whether to exercise your
                    options based on your financial situation.
                  </p>
                </div>
              </div>
              <div className="pl-16">
                <p className="text-sm text-muted-foreground mb-4">
                  Answer a few questions about your grant, financial situation,
                  and goals to receive guidance on:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>
                      Optimal exercise timing based on tax consideration
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Financial risk assessment for your situation</span>
                  </li>
                  <li className="flex items-center text-sm opacity-60">
                    <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Personalized tax optimization strategy</span>
                  </li>
                </ul>
                <Button asChild>
                  <Link href="/register">Start Free Assessment</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3 p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <BarChart4 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Exit Planning Guide</h3>
                  <p className="text-muted-foreground">
                    Plan your exit strategy to optimize tax treatment and
                    maximize your return on equity.
                  </p>
                </div>
              </div>
              <div className="pl-16">
                <p className="text-sm text-muted-foreground mb-4">
                  Create a customized exit strategy based on your goals, timing,
                  and market conditions:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Basic timeline planning for liquidity events</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>Fundamental tax considerations for exits</span>
                  </li>
                  <li className="flex items-center text-sm opacity-60">
                    <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Advanced diversification strategies</span>
                  </li>
                </ul>
                <Button asChild>
                  <Link href="/register">Start Exit Planning</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Accordion type="single" collapsible>
              <AccordionItem value="preview">
                <AccordionTrigger>
                  <span className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-primary" />
                    Preview: Decision Guide Experience
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 border rounded-md space-y-4">
                    <p className="text-muted-foreground italic">
                      This is a preview of our guided decision process. Full
                      personalized guidance requires a free account.
                    </p>

                    <div className="space-y-3">
                      <h4 className="font-medium text-lg">
                        Should you exercise your options now?
                      </h4>

                      <Alert>
                        <div className="font-medium">
                          Based on general best practices:
                        </div>
                        <div className="text-sm mt-2">
                          Early exercise may be advantageous when:
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>
                              The spread between strike price and FMV is small
                            </li>
                            <li>
                              You have strong belief in the company's growth
                            </li>
                            <li>
                              You can afford the exercise cost and associated
                              taxes
                            </li>
                            <li>
                              You'll file an 83(b) election within 30 days (for
                              early exercise)
                            </li>
                          </ul>
                        </div>
                      </Alert>

                      <div className="bg-muted p-4 rounded-md">
                        <h5 className="font-medium mb-2">
                          For a personalized recommendation, we need to know:
                        </h5>
                        <ul className="space-y-2">
                          <li className="flex items-center">
                            <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">
                              Your current financial situation
                            </span>
                          </li>
                          <li className="flex items-center">
                            <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">
                              Details about your equity grant
                            </span>
                          </li>
                          <li className="flex items-center">
                            <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">
                              Your risk tolerance and time horizon
                            </span>
                          </li>
                          <li className="flex items-center">
                            <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">
                              Your tax situation and jurisdiction
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="flex justify-center pt-3">
                        <Button asChild>
                          <Link href="/register">
                            Get Personalized Guidance
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lead Magnet section */}
      <div className="bg-muted rounded-xl p-8 mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <Badge>Free PDF Guide</Badge>
            <h2 className="text-2xl font-bold">
              Equity Essentials: The Startup Employee's Guide
            </h2>
            <p>
              Get our free 15-page guide covering the fundamental concepts every
              startup employee should understand about equity compensation.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                <span>Equity types explained in plain language</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                <span>Visual explanations of vesting concepts</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                <span>10-point checklist for evaluating offers</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                <span>Quick-reference glossary of key terms</span>
              </li>
            </ul>

            {leadMagnetSubmitted ? (
              <Alert className="bg-primary/10 border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <div className="ml-2">
                  <div className="font-medium">Guide sent to your email!</div>
                  <div className="text-sm">
                    Check your inbox for the download link
                  </div>
                </div>
              </Alert>
            ) : (
              <form
                onSubmit={handleLeadMagnetSubmit}
                className="flex flex-col sm:flex-row gap-2"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={leadMagnetEmail}
                  onChange={(e) => setLeadMagnetEmail(e.target.value)}
                  required
                  className="sm:max-w-xs"
                />
                <Button type="submit">
                  <Download className="mr-2 h-4 w-4" />
                  Get Free Guide
                </Button>
              </form>
            )}
          </div>
          <div className="hidden md:block">
            <div className="bg-card p-6 rounded-lg shadow-lg">
              <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <BookOpenText className="h-12 w-12 mb-4 text-primary" />
                  <h4 className="text-xl font-bold mb-2">
                    Equity Essentials Guide
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your roadmap to understanding startup equity
                  </p>
                  <Badge>Free Download</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          What People Are Saying
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full flex flex-col">
              <CardContent className="pt-6 flex-grow">
                <div className="flex-1">
                  <p className="italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress tracking teaser */}
      <div className="mb-16">
        <div className="bg-muted rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-card shadow-lg rounded-lg overflow-hidden border">
                <div className="p-4 border-b">
                  <h4 className="font-medium">Your Learning Progress</h4>
                </div>
                <div className="p-6 space-y-4 opacity-70">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Equity Fundamentals</span>
                      <span>3/10 Completed</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: "30%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tax Optimization</span>
                      <span>1/8 Completed</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: "12.5%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Vesting Concepts</span>
                      <span>2/6 Completed</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: "33%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Overall Progress
                      </span>
                      <Badge variant="outline">25%</Badge>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 flex justify-center">
                  <Button variant="secondary" size="sm" disabled>
                    Track Your Progress
                  </Button>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <Badge>Learning Tracker</Badge>
              <h2 className="text-2xl font-bold">
                Track Your Equity Education Journey
              </h2>
              <p>
                Create a free account to track your progress through our
                educational content and receive personalized learning
                recommendations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>Save your progress as you learn</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>
                    Get custom learning paths based on your equity situation
                  </span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>
                    Earn badges and certificates as you master concepts
                  </span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>Access your history from any device</span>
                </li>
              </ul>
              <Button size="lg" asChild>
                <Link href="/register">Start Tracking Your Progress</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pathway to calculator features */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold mb-4">
            Put Your Knowledge Into Action
          </h2>
          <p className="text-muted-foreground">
            Now that you understand the basics, use these tools to make
            data-driven decisions about your equity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-primary" />
                Equity Calculator Suite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Comprehensive tools to value your equity, model exercise
                scenarios, and plan for exits.
              </p>
              <ul className="space-y-1 text-sm mb-4">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Tax-aware exercise modeling</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Exit valuation forecasts</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Multiple scenario comparison</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/dashboard/calculator">
                  <Calculator className="mr-2 h-4 w-4" />
                  Use Calculators
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart4 className="h-5 w-5 mr-2 text-primary" />
                Portfolio Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Track your equity portfolio across multiple companies, grants,
                and vesting schedules.
              </p>
              <ul className="space-y-1 text-sm mb-4">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Real-time portfolio valuation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Vesting milestone alerts</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Diversification analysis</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Track Portfolio
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                Decision Guides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Personalized guidance for making better decisions about your
                equity at critical moments.
              </p>
              <ul className="space-y-1 text-sm mb-4">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Exercise timing recommendations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Exit planning strategy</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  <span>Offer evaluation frameworks</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/dashboard/decisions">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Get Guidance
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Master Your Equity?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Create your free account to access our full suite of educational
          resources, calculators, and personalized guidance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">Create Free Account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
