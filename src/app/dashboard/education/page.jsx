// src/app/dashboard/education/page.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EducationCard } from "@/components/education/EducationCard";
import { GlossaryItem } from "@/components/education/GlossaryItem";
import { ProgressiveDisclosure } from "@/components/education/ProgressiveDisclosure";
import { InteractiveEducation } from "@/components/education/InteractiveEducation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  ChevronUp,
  BookOpen,
  Award,
  Clock,
  Bookmark,
  BookMarked,
  Filter,
  Sliders,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import { useEducationLevel } from "@/context/EducationContext";

export default function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [educationContent, setEducationContent] = useState([]);
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("interactive");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [bookmarkedTopics, setBookmarkedTopics] = useState([]);
  const [filterActive, setFilterActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTopicTags, setSelectedTopicTags] = useState([]);
  const [availableTopicTags, setAvailableTopicTags] = useState([]);
  const [currentLearningPath, setCurrentLearningPath] = useState(null);
  const [learningPaths, setLearningPaths] = useState([]);
  const [learningProgress, setLearningProgress] = useState({});
  const [quizResults, setQuizResults] = useState({});

  // Create refs for scrollable content
  const basicsContentRef = useRef(null);
  const glossaryContentRef = useRef(null);
  const pathsContentRef = useRef(null);

  // Get education level context
  const {
    educationLevel,
    setEducationLevel,
    autoDetectLevel,
    setAutoDetectLevel,
    conceptsViewed,
    markConceptViewed,
  } = useEducationLevel();

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
          : activeTab === "paths"
          ? pathsContentRef.current
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
    const pathsContent = pathsContentRef.current;

    if (basicsContent) basicsContent.addEventListener("scroll", handleScroll);
    if (glossaryContent)
      glossaryContent.addEventListener("scroll", handleScroll);
    if (pathsContent) pathsContent.addEventListener("scroll", handleScroll);

    return () => {
      // Clean up event listeners
      if (basicsContent)
        basicsContent.removeEventListener("scroll", handleScroll);
      if (glossaryContent)
        glossaryContent.removeEventListener("scroll", handleScroll);
      if (pathsContent)
        pathsContent.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab]);

  // Function to scroll to top
  const scrollToTop = () => {
    const currentRef =
      activeTab === "basics"
        ? basicsContentRef.current
        : activeTab === "glossary"
        ? glossaryContentRef.current
        : activeTab === "paths"
        ? pathsContentRef.current
        : null;

    if (currentRef) {
      currentRef.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Load user's learning progress from localStorage or database
  useEffect(() => {
    // Try to load from local storage first
    const storedCompletedTopics = localStorage.getItem("completedTopics");
    const storedBookmarkedTopics = localStorage.getItem("bookmarkedTopics");
    const storedLearningProgress = localStorage.getItem("learningProgress");
    const storedQuizResults = localStorage.getItem("quizResults");

    if (storedCompletedTopics) {
      setCompletedTopics(JSON.parse(storedCompletedTopics));
    }

    if (storedBookmarkedTopics) {
      setBookmarkedTopics(JSON.parse(storedBookmarkedTopics));
    }

    if (storedLearningProgress) {
      setLearningProgress(JSON.parse(storedLearningProgress));
    }

    if (storedQuizResults) {
      setQuizResults(JSON.parse(storedQuizResults));
    }

    // Then try to fetch from database if user is logged in
    const fetchUserProgress = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          // Fetch user's education progress
          const { data: progressData, error: progressError } = await supabase
            .from("user_education_progress")
            .select("*")
            .eq("user_id", user.id);

          if (progressError) throw progressError;

          if (progressData && progressData.length > 0) {
            // Update state with fetched data
            setCompletedTopics(progressData[0].completed_content || []);
            setBookmarkedTopics(progressData[0].bookmarked_content || []);
            setLearningProgress(progressData[0].learning_paths || {});
            setQuizResults(progressData[0].quiz_results || {});

            // Also update localStorage
            localStorage.setItem(
              "completedTopics",
              JSON.stringify(progressData[0].completed_content || [])
            );
            localStorage.setItem(
              "bookmarkedTopics",
              JSON.stringify(progressData[0].bookmarked_content || [])
            );
            localStorage.setItem(
              "learningProgress",
              JSON.stringify(progressData[0].learning_paths || {})
            );
            localStorage.setItem(
              "quizResults",
              JSON.stringify(progressData[0].quiz_results || {})
            );
          }
        } catch (err) {
          console.error("Error fetching user education progress:", err);
        }
      }
    };

    fetchUserProgress();
  }, [supabase]);

  // Save user progress when it changes
  const saveUserProgress = useCallback(async () => {
    const progress = {
      completed_content: completedTopics,
      bookmarked_content: bookmarkedTopics,
      learning_paths: learningProgress,
      quiz_results: quizResults,
    };

    // Save to localStorage first (works for non-logged in users too)
    localStorage.setItem("completedTopics", JSON.stringify(completedTopics));
    localStorage.setItem("bookmarkedTopics", JSON.stringify(bookmarkedTopics));
    localStorage.setItem("learningProgress", JSON.stringify(learningProgress));
    localStorage.setItem("quizResults", JSON.stringify(quizResults));

    // Then try to save to database if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        // Check if user has a progress record
        const { data: existingData, error: checkError } = await supabase
          .from("user_education_progress")
          .select("id")
          .eq("user_id", user.id);

        if (checkError) throw checkError;

        if (existingData && existingData.length > 0) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("user_education_progress")
            .update(progress)
            .eq("user_id", user.id);

          if (updateError) throw updateError;
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from("user_education_progress")
            .insert([
              {
                user_id: user.id,
                ...progress,
              },
            ]);

          if (insertError) throw insertError;
        }
      } catch (err) {
        console.error("Error saving user education progress:", err);
      }
    }
  }, [
    completedTopics,
    bookmarkedTopics,
    learningProgress,
    quizResults,
    supabase,
  ]);

  // Toggle topic completion status
  const toggleTopicCompleted = useCallback((topicId) => {
    setCompletedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  }, []);

  // Toggle topic bookmark status
  const toggleTopicBookmarked = useCallback((topicId) => {
    setBookmarkedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  }, []);

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
            intermediate_explanation: item.interactive_data?.intermediate_explanation,
            advanced_details: item.interactive_data?.advanced_details,
            example: item.examples && item.examples.length > 0 ? item.examples[0] : null,
            tags: Array.isArray(item.tags) ? item.tags : [],
            related_terms: Array.isArray(item.related_content)
              ? item.related_content
              : [],
          })) || [];

        setEducationContent(processedContent);

        // Extract all unique tags
        const allTags = new Set();
        processedContent.forEach((item) => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach((tag) => allTags.add(tag));
          }
        });
        setAvailableTopicTags(Array.from(allTags));

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

        // Fetch learning paths
        const { data: pathsData, error: pathsError } = await supabase
          .from("learning_paths")
          .select("*");

        if (pathsError) throw pathsError;

        // Process learning paths
        const processedPaths =
          pathsData?.map((path) => ({
            id: path.id,
            title: path.title,
            description: path.description,
            level: path.level,
            modules: Array.isArray(path.modules) ? path.modules : 
              (typeof path.modules === 'object' && path.modules !== null) ? 
                Object.values(path.modules) : 
                [
                  {
                    id: "default_module_1",
                    title: "Introduction",
                    description: "Introduction to this learning path",
                    content_sections: [
                      {
                        title: "Getting Started",
                        content: "This is the default content for this learning path. Please check back later for more detailed content."
                      }
                    ]
                  }
                ],
            recommended_for: Array.isArray(path.recommended_for)
              ? path.recommended_for
              : [],
            estimated_time: path.estimated_time || "20-30 minutes",
          })) || [];

        setLearningPaths(processedPaths);

        // Set a default learning path based on user's education level
        if (processedPaths.length > 0) {
          const recommendedPath =
            processedPaths.find(
              (path) =>
                path.level === educationLevel ||
                path.recommended_for.includes("all")
            ) || processedPaths[0];

          setCurrentLearningPath(recommendedPath);
        }

        // Log for debugging
        console.log("Education data loaded:", {
          content: processedContent.length,
          terms: processedTerms.length,
          paths: processedPaths.length,
        });
      } catch (err) {
        console.error("Error fetching education data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEducationData();
  }, [supabase, educationLevel]);

  // Save user progress when it changes
  useEffect(() => {
    if (!loading) {
      saveUserProgress();
    }
  }, [
    completedTopics,
    bookmarkedTopics,
    learningProgress,
    quizResults,
    loading,
    saveUserProgress,
  ]);

  // Filter content based on search query and selected tags
  const filteredEducationContent = educationContent.filter(
    (item) =>
      // Search query filter
      (searchQuery
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true) &&
      // Tags filter
      (selectedTopicTags.length > 0
        ? selectedTopicTags.some((tag) => item.tags && item.tags.includes(tag))
        : true) &&
      // Filter for bookmarked only
      (filterActive ? bookmarkedTopics.includes(item.id) : true)
  );

  const filteredGlossaryTerms = glossaryTerms.filter((item) =>
    searchQuery
      ? item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Generate recommended content based on user's profile and past interactions
  const getRecommendedContent = () => {
    // Get topics the user hasn't completed yet
    const incompleteTopics = educationContent.filter(
      (topic) => !completedTopics.includes(topic.id)
    );

    // Sort by relevance - this could be based on:
    // 1. Matching user's grants/equity type
    // 2. Following a natural progression of topics
    // 3. Topics related to recently viewed content
    // For now, we'll use a simple implementation

    const viewedTopicIds = Object.keys(conceptsViewed);

    // Find related topics to what the user has already viewed
    const relatedTopics = incompleteTopics.filter(
      (topic) =>
        topic.related_terms &&
        topic.related_terms.some((term) => {
          const relatedTerm = glossaryTerms.find((t) => t.term === term);
          return relatedTerm && viewedTopicIds.includes(relatedTerm.id);
        })
    );

    // Prioritize related topics, but include others if we don't have enough
    let recommended = [...relatedTopics];

    // If we need more, add topics that match the user's education level
    if (recommended.length < 3) {
      const levelAppropriate = incompleteTopics.filter(
        (topic) =>
          !recommended.includes(topic) &&
          ((educationLevel === "beginner" && !topic.advanced_details) ||
            educationLevel === "intermediate" ||
            (educationLevel === "advanced" && topic.advanced_details))
      );

      recommended = [
        ...recommended,
        ...levelAppropriate.slice(0, 3 - recommended.length),
      ];
    }

    // If we still need more, just add any incomplete topics
    if (recommended.length < 3) {
      recommended = [
        ...recommended,
        ...incompleteTopics
          .filter((topic) => !recommended.includes(topic))
          .slice(0, 3 - recommended.length),
      ];
    }

    return recommended.slice(0, 3);
  };

  // Generate a personalized learning path for the user
  const getPersonalizedPath = () => {
    // This would ideally be much more sophisticated, based on:
    // 1. User's equity grants and types
    // 2. User's progress and interests
    // 3. User's financial situation
    // 4. Current market conditions

    // For now, we'll return a path that matches their level
    return (
      learningPaths.find((path) => path.level === educationLevel) ||
      learningPaths[0]
    );
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Equity Education Center"
        text="Learn about equity compensation and make informed decisions."
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">Level:</span>
            <Badge
              variant={educationLevel === "beginner" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setEducationLevel("beginner")}
            >
              Beginner
            </Badge>
            <Badge
              variant={
                educationLevel === "intermediate" ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() => setEducationLevel("intermediate")}
            >
              Intermediate
            </Badge>
            <Badge
              variant={educationLevel === "advanced" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setEducationLevel("advanced")}
            >
              Advanced
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoDetectLevel(!autoDetectLevel)}
          >
            {autoDetectLevel ? "Auto-adjust" : "Manual"}
          </Button>
        </div>
      </DashboardHeader>

      <div className="space-y-6">
        {/* Search bar with filters */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterActive(!filterActive)}
            className={filterActive ? "bg-primary/10" : ""}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders className="h-4 w-4" />
          </Button>
        </div>

        {/* Tag filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="py-2"
          >
            <div className="p-4 border rounded-md bg-muted/30">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Filter className="h-4 w-4 mr-1" /> Filter by topic:
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTopicTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={
                      selectedTopicTags.includes(tag) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTopicTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}

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
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="interactive">
                Interactive Learning
              </TabsTrigger>
              <TabsTrigger value="paths">Learning Paths</TabsTrigger>
              <TabsTrigger value="basics">Equity Basics</TabsTrigger>
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
              <TabsTrigger value="decisionGuides">Decision Guides</TabsTrigger>
            </TabsList>

            {/* Interactive learning tab */}
            <TabsContent value="interactive" className="space-y-6 pt-4">
              {/* Personal recommendations section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    Recommended for You
                  </h2>
                  {conceptsViewed && Object.keys(conceptsViewed).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Based on your interests and learning history
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getRecommendedContent().map((topic) => (
                    <EducationCard
                      key={topic.id}
                      title={topic.title}
                      content={topic.content}
                      example={topic.example}
                      onClick={() => markConceptViewed(topic.id)}
                      actions={
                        <div className="flex justify-between mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTopicBookmarked(topic.id)}
                          >
                            {bookmarkedTopics.includes(topic.id) ? (
                              <BookMarked className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTopicCompleted(topic.id)}
                          >
                            {completedTopics.includes(topic.id)
                              ? "Completed"
                              : "Mark as Complete"}
                          </Button>
                        </div>
                      }
                    />
                  ))}
                  
                  {/* Add link to Equity Fundamentals Course */}
                  <div className="relative">
                    <EducationCard
                      title="Equity Fundamentals Course"
                      content="A comprehensive, beginner-friendly course covering all the essentials of equity compensation."
                      example="Learn about stock options, RSUs, vesting schedules, taxation, and liquidity events."
                      estimatedTime="45-60 min"
                      tags={["beginner", "interactive", "comprehensive"]}
                      isCompleted={completedTopics.includes("equity_fundamentals_module")}
                      learnMoreUrl="/dashboard/education/equity-fundamentals"
                      actions={
                        <div className="flex justify-between mt-2">
                          {completedTopics.includes("equity_fundamentals_module") && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                              onClick={async () => {
                                try {
                                  let moduleId = "equity_fundamentals"; // Default fallback ID
                                  
                                  try {
                                    // Try to get the module ID from the database first
                                    const { data: courseModules, error } = await supabase
                                      .from("course_modules")
                                      .select("id")
                                      .eq("title", "Equity Fundamentals")
                                      .single();
                                      
                                    if (courseModules) {
                                      moduleId = courseModules.id;
                                    }
                                  } catch (dbErr) {
                                    console.warn("Could not fetch module from database, using fallback ID:", dbErr.message);
                                    // Continue with fallback ID
                                  }
                                  
                                  try {
                                    // Try to use the course modules service
                                    const { default: courseModulesService } = await import('@/utils/course-modules-service');
                                    await courseModulesService.resetModuleProgress(moduleId);
                                  } catch (serviceErr) {
                                    console.warn("Could not use course module service:", serviceErr.message);
                                    // Continue with manual reset
                                  }
                                  
                                  // Always reset UI state, even if service fails
                                  const updatedTopics = completedTopics.filter(
                                    id => !id.startsWith('equity_fundamentals_')
                                  );
                                  setCompletedTopics(updatedTopics);
                                  
                                  // Create or update learning path progress
                                  const updatedProgress = {
                                    ...learningProgress,
                                    equity_fundamentals: {
                                      completed: false,
                                      completedAt: null,
                                      reset: true,
                                      resetAt: new Date().toISOString()
                                    }
                                  };
                                  setLearningProgress(updatedProgress);
                                  
                                  // Save changes to localStorage
                                  localStorage.setItem("completedTopics", JSON.stringify(updatedTopics));
                                  localStorage.setItem("learningProgress", JSON.stringify(updatedProgress));
                                  
                                  // Alert that course has been reset
                                  alert("Course progress has been reset. You can now start from the beginning.");
                                  
                                  // Navigate to the course
                                  window.location.href = "/dashboard/education/equity-fundamentals";
                                } catch (err) {
                                  console.error("Error resetting course progress:", err);
                                  alert("There was an error resetting your progress. Please try again later.");
                                }
                              }}
                            >
                              Restart Course
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTopicBookmarked("equity_fundamentals_module")}
                          >
                            {bookmarkedTopics.includes("equity_fundamentals_module") ? (
                              <BookMarked className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Interactive learning modules */}
              <InteractiveEducation
                educationLevel={educationLevel}
                markConceptViewed={markConceptViewed}
                saveQuizResults={(quizId, results) => {
                  setQuizResults((prev) => ({
                    ...prev,
                    [quizId]: results,
                  }));
                }}
                quizResults={quizResults}
              />
            </TabsContent>

            {/* Learning paths tab */}
            <TabsContent value="paths" className="pt-4 relative">
              <div
                ref={pathsContentRef}
                className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scroll-smooth"
              >
                {/* Path selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {learningPaths.map((path) => (
                    <div
                      key={path.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        currentLearningPath &&
                        currentLearningPath.id === path.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setCurrentLearningPath(path)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{path.title}</h3>
                        <Badge
                          variant={
                            path.level === educationLevel
                              ? "default"
                              : "outline"
                          }
                        >
                          {path.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {path.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {path.estimated_time}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current path content */}
                {currentLearningPath && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {currentLearningPath.title}
                      </h2>
                      <p className="text-muted-foreground">
                        {currentLearningPath.description}
                      </p>

                      {/* Progress indicator */}
                      {learningProgress[currentLearningPath.id] && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>
                              {Math.round(
                                ((learningProgress[currentLearningPath.id]
                                  ?.completed_modules?.length || 0) /
                                  (Array.isArray(currentLearningPath.modules) ? currentLearningPath.modules.length : 1)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.round(
                                  ((learningProgress[currentLearningPath.id]
                                    ?.completed_modules?.length || 0) /
                                    (Array.isArray(currentLearningPath.modules) ? currentLearningPath.modules.length : 1)) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modules */}
                    <div className="space-y-4">
                      {Array.isArray(currentLearningPath.modules) && currentLearningPath.modules.map((module, index) => {
                        // Ensure module has an id
                        const moduleId = module.id || `module_${index}`;
                        const isCompleted = learningProgress[
                          currentLearningPath.id
                        ]?.completed_modules?.includes(moduleId);
                        const isActive =
                          learningProgress[currentLearningPath.id]
                            ?.current_module === moduleId ||
                          (!learningProgress[currentLearningPath.id]
                            ?.current_module &&
                            index === 0);

                        return (
                          <div
                            key={moduleId}
                            className={`border rounded-lg p-4 ${
                              isCompleted
                                ? "bg-primary/5 border-primary/30"
                                : isActive
                                ? "border-primary"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium flex items-center">
                                  {isCompleted && (
                                    <Award className="h-4 w-4 text-primary mr-1" />
                                  )}
                                  Module {index + 1}: {module.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {module.description}
                                </p>
                              </div>
                              <Button
                                variant={isCompleted ? "outline" : "default"}
                                size="sm"
                                onClick={() => {
                                  // Mark module as completed or current
                                  setLearningProgress((prev) => {
                                    const pathProgress = prev[
                                      currentLearningPath.id
                                    ] || {
                                      completed_modules: [],
                                      current_module: null,
                                    };

                                    // If already completed, do nothing
                                    if (isCompleted) return prev;

                                    // Otherwise mark as current/in progress
                                    return {
                                      ...prev,
                                      [currentLearningPath.id]: {
                                        ...pathProgress,
                                        current_module: moduleId,
                                      },
                                    };
                                  });

                                  // Mark related concepts as viewed
                                  if (module.related_concepts) {
                                    module.related_concepts.forEach(
                                      (conceptId) => {
                                        markConceptViewed(conceptId);
                                      }
                                    );
                                  }
                                }}
                              >
                                {isCompleted
                                  ? "Completed"
                                  : isActive
                                  ? "Continue"
                                  : "Start"}
                              </Button>
                            </div>

                            {isActive && (
                              <div className="mt-4 space-y-3">
                                {Array.isArray(module.content_sections) ? module.content_sections.map(
                                  (section, sectionIndex) => (
                                    <div
                                      key={sectionIndex}
                                      className="space-y-2"
                                    >
                                      <h4 className="text-sm font-medium">
                                        {section.title}
                                      </h4>
                                      <p className="text-sm">
                                        {section.content}
                                      </p>

                                      {/* Interactive elements could be added here */}

                                      {section.action && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <Link href={section.action.link}>
                                            {section.action.text}
                                          </Link>
                                        </Button>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <div className="text-muted-foreground py-2">
                                    No detailed content available for this module yet.
                                  </div>
                                )}

                                {/* Complete module button */}
                                <Button
                                  onClick={() => {
                                    setLearningProgress((prev) => {
                                      const pathProgress = prev[
                                        currentLearningPath.id
                                      ] || {
                                        completed_modules: [],
                                        current_module: null,
                                      };

                                      return {
                                        ...prev,
                                        [currentLearningPath.id]: {
                                          ...pathProgress,
                                          completed_modules: [
                                            ...(pathProgress.completed_modules ||
                                              []),
                                            moduleId,
                                          ],
                                          // Set next module as current
                                          current_module:
                                            Array.isArray(currentLearningPath.modules) && 
                                            currentLearningPath.modules[index + 1] ? 
                                              (currentLearningPath.modules[index + 1].id || `module_${index + 1}`) : null,
                                        },
                                      };
                                    });
                                  }}
                                  className="mt-4"
                                >
                                  Complete Module
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {showScrollButton && activeTab === "paths" && (
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

            {/* Equity basics tab */}
            <TabsContent value="basics" className="pt-4 relative">
              <div
                ref={basicsContentRef}
                className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scroll-smooth"
              >
                {filteredEducationContent.length > 0 ? (
                  filteredEducationContent.map((item) => (
                    <div key={item.id} className="relative">
                      <ProgressiveDisclosure
                        term={item.title}
                        basicDefinition={item.content}
                        intermediateExplanation={item.intermediate_explanation}
                        advancedDetails={item.advanced_details}
                        examples={item.example ? [item.example] : []}
                        relatedTerms={item.related_terms || []}
                        onOpen={() => markConceptViewed(item.id)}
                      />

                      {/* Action buttons */}
                      <div className="absolute top-1 right-1 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleTopicBookmarked(item.id)}
                        >
                          {bookmarkedTopics.includes(item.id) ? (
                            <BookMarked className="h-4 w-4 text-primary" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleTopicCompleted(item.id)}
                        >
                          {completedTopics.includes(item.id) ? (
                            <Award className="h-4 w-4 text-primary" />
                          ) : (
                            <Award className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="ml-7 mt-2 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
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

            {/* Glossary tab */}
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
                        onClick={() => markConceptViewed(item.id)}
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

            {/* Decision guides tab */}
            <TabsContent value="decisionGuides" className="space-y-6 pt-4">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2 border rounded-lg p-4 hover:border-primary/50 transition-all">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-medium">
                      Exercise Decision Guide
                    </h2>
                  </div>
                  <p className="text-muted-foreground">
                    Get personalized recommendations on whether to exercise your
                    options based on your financial situation, company outlook,
                    and tax considerations.
                  </p>
                  <Button asChild className="w-full mt-2">
                    <Link href="/dashboard/decisions/exercise">
                      Start Guide
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2 border rounded-lg p-4 hover:border-primary/50 transition-all">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-medium">Exit Planning Guide</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Plan your exit strategy to optimize tax treatment and
                    maximize your return on equity.
                  </p>
                  <Button asChild className="w-full mt-2">
                    <Link href="/dashboard/decisions/exit">Start Guide</Link>
                  </Button>
                </div>

                <div className="space-y-2 border rounded-lg p-4 hover:border-primary/50 transition-all">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-medium">Tax Strategy Guide</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Understand the tax implications of your equity and develop
                    strategies to minimize your tax burden over time.
                  </p>
                  <Button asChild className="w-full mt-2">
                    <Link href="/dashboard/calculator/tax">Start Guide</Link>
                  </Button>
                </div>
              </div>

              {/* Interactive decision tool */}
              <div className="mt-8 border rounded-lg p-6">
                <h2 className="text-xl font-medium mb-4">
                  Quick Decision Helper
                </h2>
                <p className="mb-4">
                  Answer a few questions to get a quick recommendation for your
                  equity situation:
                </p>

                <div className="space-y-4">
                  {/* This would be a more interactive component in the full implementation */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-auto py-4 flex flex-col items-center justify-center"
                      asChild
                    >
                      <Link href="/dashboard/decisions/exercise">
                        <span className="font-medium">
                          I need help deciding whether to exercise my options
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
                          Early exercise, post-vest exercise, or hold
                        </span>
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="h-auto py-4 flex flex-col items-center justify-center"
                      asChild
                    >
                      <Link href="/dashboard/analytics">
                        <span className="font-medium">
                          I need help understanding my equity grant
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
                          Vesting schedule, grant type, and value
                        </span>
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="h-auto py-4 flex flex-col items-center justify-center"
                      asChild
                    >
                      <Link href="/dashboard/calculator/tax">
                        <span className="font-medium">
                          I need help with tax planning
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
                          AMT, QSBS, 83(b), and more
                        </span>
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="h-auto py-4 flex flex-col items-center justify-center"
                      asChild
                    >
                      <Link href="/dashboard/decisions/exit">
                        <span className="font-medium">
                          I'm considering leaving my company
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
                          Post-termination exercise window and considerations
                        </span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  );
}
