// src/app/dashboard/education/page.jsx
"use client";

import { useState, useEffect, useRef } from "react"; // Added useRef
import Link from "next/link";
import { EducationCard } from "@/components/education/EducationCard";
import { GlossaryItem } from "@/components/education/GlossaryItem";
import { ProgressiveDisclosure } from "@/components/education/ProgressiveDisclosure";
import { InteractiveEducation } from "@/components/education/InteractiveEducation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ChevronUp } from "lucide-react"; // Added ChevronUp for scroll button
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

export default function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [educationContent, setEducationContent] = useState([]);
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("interactive");
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Create refs for scrollable content
  const basicsContentRef = useRef(null);
  const glossaryContentRef = useRef(null);

  const supabase = createClient();

  // Handle scroll event to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Get the current scroll position of the active tab content
      const currentRef =
        activeTab === "basics"
          ? basicsContentRef.current
          : activeTab === "glossary"
          ? glossaryContentRef.current
          : null;

      if (currentRef && currentRef.scrollTop > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    // Add scroll event listeners to the content refs
    const basicsContent = basicsContentRef.current;
    const glossaryContent = glossaryContentRef.current;

    if (basicsContent) basicsContent.addEventListener("scroll", handleScroll);
    if (glossaryContent)
      glossaryContent.addEventListener("scroll", handleScroll);

    return () => {
      // Clean up event listeners
      if (basicsContent)
        basicsContent.removeEventListener("scroll", handleScroll);
      if (glossaryContent)
        glossaryContent.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab]);

  // Function to scroll to top
  const scrollToTop = () => {
    const currentRef =
      activeTab === "basics"
        ? basicsContentRef.current
        : activeTab === "glossary"
        ? glossaryContentRef.current
        : null;

    if (currentRef) {
      currentRef.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Fetch data from the database
  useEffect(() => {
    async function fetchEducationData() {
      setLoading(true);
      try {
        // Fetch education content
        const { data: contentData, error: contentError } = await supabase
          .from("education_content")
          .select("*")
          .order("title");

        if (contentError) throw contentError;

        // Process data to match component expectations
        const processedContent =
          contentData?.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            intermediate_explanation: item.intermediate_explanation,
            advanced_details: item.advanced_details,
            example: item.example,
            related_terms: Array.isArray(item.related_terms)
              ? item.related_terms
              : [],
          })) || [];

        setEducationContent(processedContent);

        // Fetch glossary terms
        const { data: termsData, error: termsError } = await supabase
          .from("glossary_terms")
          .select("*")
          .order("term");

        if (termsError) throw termsError;

        // Process glossary terms to match component expectations
        const processedTerms =
          termsData?.map((item) => ({
            id: item.id,
            term: item.term,
            definition: item.definition,
            examples: Array.isArray(item.examples) ? item.examples : [],
            related_terms: Array.isArray(item.related_terms)
              ? item.related_terms
              : [],
            technical_details: item.technical_details,
          })) || [];

        setGlossaryTerms(processedTerms);

        // Log for debugging
        console.log("Glossary terms loaded:", processedTerms.length);
      } catch (err) {
        console.error("Error fetching education data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEducationData();
  }, [supabase]);

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
    <DashboardShell>
      <DashboardHeader
        heading="Equity Education Center"
        text="Learn about equity compensation and make informed decisions."
      />

      <div className="space-y-6">
        {/* Search bar */}
        <div className="relative">
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading content...
            </span>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md text-center">
            <p className="text-destructive font-medium">
              Error loading content
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : (
          <Tabs
            defaultValue="interactive"
            className="w-full"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList>
              <TabsTrigger value="interactive">
                Interactive Learning
              </TabsTrigger>
              <TabsTrigger value="basics">Equity Basics</TabsTrigger>
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
              <TabsTrigger value="decisionGuides">Decision Guides</TabsTrigger>
            </TabsList>

            <TabsContent value="interactive" className="space-y-6 pt-4">
              <InteractiveEducation />
            </TabsContent>

            <TabsContent value="basics" className="pt-4 relative">
              <div
                ref={basicsContentRef}
                className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scroll-smooth"
              >
                {filteredEducationContent.length > 0 ? (
                  filteredEducationContent.map((item) => (
                    <ProgressiveDisclosure
                      key={item.id}
                      term={item.title}
                      basicDefinition={item.content}
                      intermediateExplanation={item.intermediate_explanation}
                      advancedDetails={item.advanced_details}
                      examples={item.example ? [item.example] : []}
                      relatedTerms={item.related_terms || []}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No matching equity concepts found.
                  </p>
                )}
              </div>
              {showScrollButton && activeTab === "basics" && (
                <Button
                  onClick={scrollToTop}
                  size="icon"
                  variant="outline"
                  className="fixed bottom-6 right-6 z-50 rounded-full shadow-md"
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
              )}
            </TabsContent>

            <TabsContent value="glossary" className="pt-4 relative">
              <div
                ref={glossaryContentRef}
                className="max-h-[600px] overflow-y-auto pr-2 scroll-smooth"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredGlossaryTerms.length > 0 ? (
                    filteredGlossaryTerms.map((item) => (
                      <GlossaryItem
                        key={item.id}
                        term={item.term}
                        definition={item.definition}
                        examples={item.examples || []}
                        relatedTerms={item.related_terms || []}
                        technicalDetails={item.technical_details}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-6 col-span-2">
                      No matching glossary terms found.
                    </p>
                  )}
                </div>
              </div>
              {showScrollButton && activeTab === "glossary" && (
                <Button
                  onClick={scrollToTop}
                  size="icon"
                  variant="outline"
                  className="fixed bottom-6 right-6 z-50 rounded-full shadow-md"
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
              )}
            </TabsContent>

            <TabsContent value="decisionGuides" className="space-y-6 pt-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h2 className="text-xl font-medium">
                    Exercise Decision Guide
                  </h2>
                  <p className="text-muted-foreground">
                    Get personalized recommendations on whether to exercise your
                    options based on your financial situation, company outlook,
                    and tax considerations.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/decisions/exercise">
                      Start Guide
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-medium">Exit Planning Guide</h2>
                  <p className="text-muted-foreground">
                    Plan your exit strategy to optimize tax treatment and
                    maximize your return on equity.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/decisions/exit">Start Guide</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  );
}
