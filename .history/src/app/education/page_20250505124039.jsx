"use client";

import { EducationCard } from '@/components/education/EducationCard';
import { GlossaryItem } from '@/components/education/GlossaryItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const educationContent = [
  {
    title: "Understanding Stock Options",
    content: "Stock options give you the right to buy company shares at a fixed price (strike price) in the future. They're a way for startups to compensate employees while conserving cash.",
    example: "If you have 1,000 options with a $1 strike price, and the company stock is worth $10, you can buy 1,000 shares for $1,000 and immediately sell them for $10,000, making a $9,000 profit (before taxes)."
  },
  {
    title: "Vesting Schedules",
    content: "Vesting is the process by which you earn your stock options over time. Most companies use a 4-year vesting schedule with a 1-year cliff.",
    example: "With a 4-year vesting schedule and 1-year cliff, you earn nothing for the first year. After one year, 25% vests immediately. Then you earn the remaining 75% monthly over the next 3 years."
  },
  {
    title: "Exercise Windows",
    content: "When you leave a company, you typically have 90 days to exercise your vested options. After that, you lose them.",
    example: "If you have 1,000 vested options when you leave, you have 90 days to decide whether to buy the shares at the strike price."
  },
  {
    title: "Tax Implications",
    content: "Exercising options can trigger tax events. ISOs can qualify for capital gains treatment if held long enough, while NSOs are taxed as ordinary income.",
    example: "If you exercise NSOs with a $1 strike price when shares are worth $10, you'll owe ordinary income tax on the $9 spread immediately."
  }
];

const glossaryTerms = [
  {
    term: "Strike Price",
    definition: "The fixed price at which you can buy shares when exercising your options."
  },
  {
    term: "Fair Market Value (FMV)",
    definition: "The current value of the company's shares, usually determined by a 409A valuation."
  },
  {
    term: "Cliff",
    definition: "A period of time you must work before any options vest. Typically 1 year."
  },
  {
    term: "ISO (Incentive Stock Option)",
    definition: "A type of stock option that can qualify for favorable tax treatment if certain requirements are met."
  },
  {
    term: "NSO (Non-Qualified Stock Option)",
    definition: "Stock options that don't qualify for special tax treatment and are taxed as ordinary income upon exercise."
  },
  {
    term: "RSU (Restricted Stock Unit)",
    definition: "A promise to give you shares in the future, typically when they vest."
  },
  {
    term: "AMT (Alternative Minimum Tax)",
    definition: "A parallel tax system that can be triggered when exercising ISOs."
  },
  {
    term: "409A Valuation",
    definition: "An independent appraisal of a private company's stock value for tax purposes."
  }
];

export default function Education() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Equity Education Center</h1>
      
      <Tabs defaultValue="basics" className="w-full">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="glossary">Glossary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basics" className="space-y-6">
          {educationContent.map((item, index) => (
            <EducationCard
              key={index}
              title={item.title}
              content={item.content}
              example={item.example}
            />
          ))}
        </TabsContent>
        
        <TabsContent value="glossary" className="grid gap-4 md:grid-cols-2">
          {glossaryTerms.map((item, index) => (
            <GlossaryItem
              key={index}
              term={item.term}
              definition={item.definition}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
