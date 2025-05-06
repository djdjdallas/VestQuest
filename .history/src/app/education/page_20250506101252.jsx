"use client";

import { EducationCard } from "@/components/education/EducationCard";
import { GlossaryItem } from "@/components/education/GlossaryItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  },
  {
    title: "Vesting Schedules",
    content:
      "Vesting is the process by which you earn your stock options over time. Most companies use a 4-year vesting schedule with a 1-year cliff.",
    example:
      "With a 4-year vesting schedule and 1-year cliff, you earn nothing for the first year. After one year, 25% vests immediately. Then you earn the remaining 75% monthly over the next 3 years.",
  },
  {
    title: "Exercise Windows",
    content:
      "When you leave a company, you typically have 90 days to exercise your vested options. After that, you lose them.",
    example:
      "If you have 1,000 vested options when you leave, you have 90 days to decide whether to buy the shares at the strike price.",
  },
  {
    title: "Tax Implications",
    content:
      "Exercising options can trigger tax events. ISOs can qualify for capital gains treatment if held long enough, while NSOs are taxed as ordinary income.",
    example:
      "If you exercise NSOs with a $1 strike price when shares are worth $10, you'll owe ordinary income tax on the $9 spread immediately.",
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
  },
  {
    term: "Fair Market Value (FMV)",
    definition:
      "The current value of the company's shares, usually determined by a 409A valuation.",
  },
  {
    term: "Cliff",
    definition:
      "A period of time you must work before any options vest. Typically 1 year.",
  },
  {
    term: "ISO (Incentive Stock Option)",
    definition:
      "A type of stock option that can qualify for favorable tax treatment if certain requirements are met.",
  },
  {
    term: "NSO (Non-Qualified Stock Option)",
    definition:
      "Stock options that don't qualify for special tax treatment and are taxed as ordinary income upon exercise.",
  },
  {
    term: "RSU (Restricted Stock Unit)",
    definition:
      "A promise to give you shares in the future, typically when they vest.",
  },
  {
    term: "AMT (Alternative Minimum Tax)",
    definition:
      "A parallel tax system that can be triggered when exercising ISOs.",
  },
  {
    term: "409A Valuation",
    definition:
      "An independent appraisal of a private company's stock value for tax purposes.",
  },
];

export default function Education() {
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Equity Education Center</h1>

      {/* Search bar */}
      <div className="relative mb-6">
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

      <Tabs defaultValue="interactive" className="w-full">
        <TabsList>
          <TabsTrigger value="interactive">Interactive Learning</TabsTrigger>
          <TabsTrigger value="basics">Equity Basics</TabsTrigger>
          <TabsTrigger value="glossary">Glossary</TabsTrigger>
          <TabsTrigger value="decisionGuides">Decision Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6 pt-4">
          <InteractiveEducation />
        </TabsContent>

        <TabsContent value="basics" className="space-y-6 pt-4">
          {filteredEducationContent.length > 0 ? (
            filteredEducationContent.map((item, index) => (
              <ProgressiveDisclosure
                key={index}
                term={item.title}
                basicDefinition={item.content}
                intermediateExplanation={item.intermediateExplanation}
                advancedDetails={item.advancedDetails}
                examples={item.example ? [item.example] : []}
                relatedTerms={item.relatedTerms}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No matching equity concepts found.
            </p>
          )}
        </TabsContent>

        <TabsContent value="glossary" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGlossaryTerms.length > 0 ? (
              filteredGlossaryTerms.map((item, index) => (
                <GlossaryItem
                  key={index}
                  term={item.term}
                  definition={item.definition}
                  examples={item.examples}
                  relatedTerms={item.relatedTerms}
                  technicalDetails={item.technicalDetails}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-6 col-span-2">
                No matching glossary terms found.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="decisionGuides" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h2 className="text-xl font-medium">Exercise Decision Guide</h2>
              <p className="text-muted-foreground">
                Get personalized recommendations on whether to exercise your
                options based on your financial situation, company outlook, and
                tax considerations.
              </p>
              <Button asChild>
                <a href="/dashboard/decisions/exercise">Start Guide</a>
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-medium">Exit Planning Guide</h2>
              <p className="text-muted-foreground">
                Plan your exit strategy to optimize tax treatment and maximize
                your return on equity.
              </p>
              <Button asChild>
                <a href="/dashboard/decisions/exit">Start Guide</a>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
