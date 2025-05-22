"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useUserProgress } from "@/components/education/UserProgressProvider";
import { useEducationLevel } from "@/context/EducationContext";
import { GlossaryTooltip } from "@/components/education/GlossaryTooltip";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  AlertCircle,
  HelpCircle,
  Info,
  BarChart,
  LineChart,
  LockIcon,
  UnlockIcon,
  Calculator,
  ArrowRight,
  Sparkles,
  Lightbulb,
} from "lucide-react";

// Lesson components
import { Lesson1WhatIsEquity } from "./fundamentals/Lesson1WhatIsEquity";
import { Lesson2EquityTypes } from "./fundamentals/Lesson2EquityTypes";
import { Lesson3VestingSchedules } from "./fundamentals/Lesson3VestingSchedules";
import { Lesson4StrikeAndFMV } from "./fundamentals/Lesson4StrikeAndFMV";
import { Lesson5TaxImplications } from "./fundamentals/Lesson5TaxImplications";
import { Lesson6ExitsAndLiquidity } from "./fundamentals/Lesson6ExitsAndLiquidity";

export function EquityFundamentalsModule() {
  const { educationLevel } = useEducationLevel();
  const {
    viewedContent,
    completedContent,
    markContentViewed,
    markContentCompleted,
    saveQuizResult,
    updateLearningPathProgress,
  } = useUserProgress();

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonCompletion, setLessonCompletion] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showCertificate, setShowCertificate] = useState(false);

  // Define the course lessons
  const lessons = [
    {
      id: "what-is-equity",
      title: "What is Equity Compensation?",
      description: "Learn the fundamentals of equity compensation and why companies offer it.",
      estimatedTime: "8-10 min",
      component: Lesson1WhatIsEquity,
      keyTerms: ["equity", "compensation", "ownership", "stakeholder"],
      quiz: [
        {
          id: "eq1",
          question: "What is the primary purpose of equity compensation?",
          options: [
            { id: "a", text: "To avoid paying market-rate salaries" },
            { id: "b", text: "To align employee and company interests" },
            { id: "c", text: "To avoid paying taxes" },
            { id: "d", text: "To reduce company expenses" }
          ],
          correctAnswer: "b",
          explanation: "Equity compensation is primarily designed to align employee interests with company success by making employees part-owners in the business."
        },
        {
          id: "eq2",
          question: "When do employees typically realize the full value of their equity compensation?",
          options: [
            { id: "a", text: "Immediately upon receiving the grant" },
            { id: "b", text: "At the company's IPO or acquisition" },
            { id: "c", text: "After their first year of employment" },
            { id: "d", text: "At the end of each fiscal year" }
          ],
          correctAnswer: "b",
          explanation: "The full value of equity is typically realized during a liquidity event such as an IPO (Initial Public Offering) or when the company is acquired."
        }
      ]
    },
    {
      id: "equity-types",
      title: "Stock Options vs RSUs vs Restricted Stock",
      description: "Compare different types of equity grants and their characteristics.",
      estimatedTime: "8-10 min",
      component: Lesson2EquityTypes,
      keyTerms: ["stock options", "ISO", "NSO", "RSU", "restricted stock"],
      quiz: [
        {
          id: "et1",
          question: "What is the main difference between stock options and RSUs?",
          options: [
            { id: "a", text: "Stock options require purchase, while RSUs are given as shares" },
            { id: "b", text: "RSUs are only for executives, stock options are for everyone else" },
            { id: "c", text: "Stock options are more valuable than RSUs" },
            { id: "d", text: "Stock options don't have vesting periods, but RSUs do" }
          ],
          correctAnswer: "a",
          explanation: "With stock options, you must exercise (purchase) shares at the strike price, while RSUs convert directly to shares upon vesting without requiring you to pay for them."
        },
        {
          id: "et2",
          question: "Which type of equity is typically granted at later-stage private companies or public companies?",
          options: [
            { id: "a", text: "Incentive Stock Options (ISOs)" },
            { id: "b", text: "Non-qualified Stock Options (NSOs)" },
            { id: "c", text: "Restricted Stock Units (RSUs)" },
            { id: "d", text: "Restricted Stock Awards" }
          ],
          correctAnswer: "c",
          explanation: "RSUs are typically granted at later-stage private companies or public companies because they have definite value once vested, regardless of stock price fluctuations."
        }
      ]
    },
    {
      id: "vesting-schedules",
      title: "Understanding Vesting Schedules",
      description: "Learn how vesting works and common vesting schedule patterns.",
      estimatedTime: "8-10 min",
      component: Lesson3VestingSchedules,
      keyTerms: ["vesting", "cliff", "acceleration", "milestone-based vesting"],
      quiz: [
        {
          id: "vs1",
          question: "What is a 'cliff' in a vesting schedule?",
          options: [
            { id: "a", text: "The date when all equity vests at once" },
            { id: "b", text: "An initial period before any equity vests" },
            { id: "c", text: "The maximum value your equity can reach" },
            { id: "d", text: "The deadline to exercise options" }
          ],
          correctAnswer: "b",
          explanation: "A 'cliff' is an initial period (typically 1 year) during which no equity vests. After the cliff date, a portion vests immediately, followed by regular vesting intervals."
        },
        {
          id: "vs2",
          question: "What is 'single-trigger acceleration'?",
          options: [
            { id: "a", text: "Accelerated vesting if you're promoted" },
            { id: "b", text: "Accelerated vesting if the company reaches a revenue target" },
            { id: "c", text: "Accelerated vesting if the company is acquired" },
            { id: "d", text: "Accelerated vesting if you meet performance goals" }
          ],
          correctAnswer: "c",
          explanation: "Single-trigger acceleration typically refers to accelerated vesting that occurs when the company is acquired or undergoes another change of control event."
        }
      ]
    },
    {
      id: "strike-fmv",
      title: "Strike Price and Fair Market Value",
      description: "Understand how stock option pricing works and what affects equity value.",
      estimatedTime: "8-10 min",
      component: Lesson4StrikeAndFMV,
      keyTerms: ["strike price", "fair market value", "409A valuation", "spread"],
      quiz: [
        {
          id: "sf1",
          question: "What is the 'spread' in stock options?",
          options: [
            { id: "a", text: "The difference between grant date and exercise date" },
            { id: "b", text: "The difference between your strike price and the fair market value" },
            { id: "c", text: "The difference between pre-money and post-money valuation" },
            { id: "d", text: "The difference between preferred and common stock prices" }
          ],
          correctAnswer: "b",
          explanation: "The 'spread' is the difference between the strike price of your options and the current fair market value (FMV) of the shares. This represents your potential gain (before taxes)."
        },
        {
          id: "sf2",
          question: "What is a 409A valuation?",
          options: [
            { id: "a", text: "The process of determining your tax liability" },
            { id: "b", text: "The value of your vested equity" },
            { id: "c", text: "An independent assessment of a company's fair market value" },
            { id: "d", text: "The price at which you can sell your shares" }
          ],
          correctAnswer: "c",
          explanation: "A 409A valuation is an independent, third-party assessment of a company's fair market value for tax purposes. It determines the strike price for stock options and is typically updated every 12 months or after significant company events."
        }
      ]
    },
    {
      id: "tax-implications",
      title: "Basic Tax Implications",
      description: "Learn the fundamental tax considerations for different equity types.",
      estimatedTime: "8-10 min",
      component: Lesson5TaxImplications,
      keyTerms: ["ordinary income", "capital gains", "AMT", "83(b) election"],
      quiz: [
        {
          id: "ti1",
          question: "What tax benefit do ISOs potentially offer compared to NSOs?",
          options: [
            { id: "a", text: "No taxes ever" },
            { id: "b", text: "Lower ordinary income tax rates" },
            { id: "c", text: "Qualifying for long-term capital gains treatment" },
            { id: "d", text: "Immediate tax deductions" }
          ],
          correctAnswer: "c",
          explanation: "ISOs can potentially qualify for long-term capital gains tax treatment (which is typically lower than ordinary income tax rates) if certain holding periods are met after exercise."
        },
        {
          id: "ti2",
          question: "When is an 83(b) election typically filed?",
          options: [
            { id: "a", text: "When you receive an equity grant" },
            { id: "b", text: "Within 30 days of early exercising unvested options" },
            { id: "c", text: "When you sell your shares" },
            { id: "d", text: "When your company goes public" }
          ],
          correctAnswer: "b",
          explanation: "An 83(b) election is typically filed within 30 days of early exercising unvested options or receiving restricted stock. It allows you to pay taxes on the current value rather than the future value when shares vest."
        }
      ]
    },
    {
      id: "exits-liquidity",
      title: "When Companies Go Public or Get Acquired",
      description: "Understand what happens to your equity during liquidity events.",
      estimatedTime: "8-10 min",
      component: Lesson6ExitsAndLiquidity,
      keyTerms: ["IPO", "acquisition", "liquidity event", "lockup period", "secondary sale"],
      quiz: [
        {
          id: "el1",
          question: "What is a 'lockup period' after an IPO?",
          options: [
            { id: "a", text: "The time when your equity vests" },
            { id: "b", text: "The time when you can't sell your shares" },
            { id: "c", text: "The time when the company can't issue new shares" },
            { id: "d", text: "The time when the share price is guaranteed" }
          ],
          correctAnswer: "b",
          explanation: "A lockup period is a time after an IPO (typically 90-180 days) during which employees and insiders are restricted from selling their shares to prevent excessive selling pressure on the new stock."
        },
        {
          id: "el2",
          question: "What typically happens to unvested equity during an acquisition?",
          options: [
            { id: "a", text: "It's always forfeited" },
            { id: "b", text: "It always vests immediately" },
            { id: "c", text: "It depends on the acquisition terms and your employment agreement" },
            { id: "d", text: "It converts to cash at the strike price" }
          ],
          correctAnswer: "c",
          explanation: "What happens to unvested equity during an acquisition depends on the specific terms of the acquisition and your employment agreement. It may accelerate, continue on the original schedule, or be replaced with acquirer equity."
        }
      ]
    }
  ];

  // Check if a lesson is unlocked
  const isLessonUnlocked = (index) => {
    if (index === 0) return true; // First lesson is always unlocked
    
    // For subsequent lessons, previous lesson must be completed
    const prevLessonId = lessons[index - 1].id;
    return completedContent.includes(`equity_fundamentals_${prevLessonId}`);
  };

  // Calculate the overall course progress
  const calculateProgress = () => {
    const completedLessons = lessons.filter(lesson => 
      completedContent.includes(`equity_fundamentals_${lesson.id}`)
    ).length;
    
    return (completedLessons / lessons.length) * 100;
  };

  // Handle lesson completion
  const handleLessonComplete = (lessonId) => {
    markContentCompleted(`equity_fundamentals_${lessonId}`);
    
    setLessonCompletion(prev => ({
      ...prev,
      [lessonId]: true
    }));

    // Check if the entire course is completed
    const allCompleted = lessons.every(lesson => 
      lessonId === lesson.id || completedContent.includes(`equity_fundamentals_${lesson.id}`)
    );

    if (allCompleted) {
      setShowCertificate(true);
      // Update learning path progress
      updateLearningPathProgress("equity_fundamentals", {
        completed: true,
        completedAt: new Date().toISOString()
      });
    }
  };

  // Handle quiz submission
  const handleQuizSubmit = (lessonId, answers, score) => {
    saveQuizResult(`equity_fundamentals_${lessonId}_quiz`, {
      answers,
      score,
      totalQuestions: lessons.find(l => l.id === lessonId).quiz.length,
      completedAt: new Date().toISOString()
    });

    if (score >= 0.7 * lessons.find(l => l.id === lessonId).quiz.length) {
      handleLessonComplete(lessonId);
    }
  };

  // Reset saved quiz answers when changing lessons
  useEffect(() => {
    setQuizAnswers({});
  }, [currentLessonIndex]);

  // Mark module as viewed
  useEffect(() => {
    markContentViewed("equity_fundamentals_module");
  }, [markContentViewed]);

  // Get the current lesson
  const currentLesson = lessons[currentLessonIndex];
  const LessonComponent = currentLesson.component;
  const progress = calculateProgress();
  
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-primary" />
            Equity Fundamentals
          </h1>
          <p className="text-muted-foreground mt-1">
            A beginner-friendly course on equity compensation basics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" /> 
            45-60 minutes
          </div>
          <Badge variant="outline" className="ml-2">
            {educationLevel === "beginner" ? "Beginner" : 
             educationLevel === "intermediate" ? "Intermediate" : "Advanced"}
          </Badge>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Course Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Certificate of Completion Modal */}
      {showCertificate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 rounded-lg p-6 text-center"
        >
          <div className="flex justify-center mb-4">
            <Award className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Certificate of Completion</h2>
          <p className="mb-4">You've successfully completed the Equity Fundamentals course!</p>
          <div className="mb-4 flex justify-center">
            <Badge className="text-sm py-1 px-3">100% Complete</Badge>
          </div>
          <Button variant="outline" onClick={() => setShowCertificate(false)}>
            Continue Learning
          </Button>
        </motion.div>
      )}

      {/* Lesson Selection Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="current">Current Lesson</TabsTrigger>
        </TabsList>

        {/* Course Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-2">
            {lessons.map((lesson, index) => {
              const isCompleted = completedContent.includes(`equity_fundamentals_${lesson.id}`);
              const isUnlocked = isLessonUnlocked(index);
              
              return (
                <Card key={lesson.id} className={`transition-all ${
                  isCompleted ? 'bg-primary/5 border-primary/20' : 
                  isUnlocked ? 'hover:border-primary/50' : 'opacity-80'
                }`}>
                  <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-md flex items-center">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        ) : (
                          <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                        )}
                        {lesson.title}
                        {!isUnlocked && (
                          <LockIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription>{lesson.description}</CardDescription>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" /> 
                      {lesson.estimatedTime}
                    </div>
                  </CardHeader>
                  <CardFooter className="p-4 pt-2">
                    <Button 
                      variant={isCompleted ? "outline" : "default"}
                      size="sm"
                      disabled={!isUnlocked}
                      className="w-full"
                      onClick={() => setCurrentLessonIndex(index)}
                    >
                      {isCompleted ? "Review Lesson" : isUnlocked ? "Start Lesson" : "Locked"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Current Lesson Tab */}
        <TabsContent value="current" className="space-y-6">
          {currentLesson && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary font-medium mr-2">
                    {currentLessonIndex + 1}
                  </span>
                  <h2 className="text-xl font-bold">{currentLesson.title}</h2>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" /> 
                  {currentLesson.estimatedTime}
                </div>
              </div>
              
              <Separator />

              {/* Lesson Content */}
              <div className="lesson-content">
                <LessonComponent />
              </div>

              {/* Key Terms */}
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium flex items-center mb-2">
                  <Info className="h-4 w-4 mr-1 text-primary" />
                  Key Terms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentLesson.keyTerms.map(term => (
                    <GlossaryTooltip key={term} term={term}>
                      <Badge variant="outline" className="cursor-help">
                        {term}
                      </Badge>
                    </GlossaryTooltip>
                  ))}
                </div>
              </div>

              {/* Quiz Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    Knowledge Check
                  </CardTitle>
                  <CardDescription>
                    Answer these questions to check your understanding before moving on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentLesson.quiz.map((question, qIndex) => (
                    <div key={question.id} className="space-y-3">
                      <h4 className="font-medium">
                        {qIndex + 1}. {question.question}
                      </h4>
                      <RadioGroup
                        value={quizAnswers[question.id] || ""}
                        onValueChange={(value) => {
                          setQuizAnswers(prev => ({
                            ...prev,
                            [question.id]: value
                          }));
                        }}
                      >
                        {question.options.map(option => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={option.id}
                              id={`${question.id}-${option.id}`}
                            />
                            <Label htmlFor={`${question.id}-${option.id}`}>
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {quizAnswers[question.id] && (
                        <Alert className={quizAnswers[question.id] === question.correctAnswer 
                          ? "bg-green-500/10 text-green-700 border-green-200" 
                          : "bg-red-500/10 text-red-700 border-red-200"
                        }>
                          {quizAnswers[question.id] === question.correctAnswer ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <AlertTitle>
                            {quizAnswers[question.id] === question.correctAnswer 
                              ? "Correct!" 
                              : "Incorrect"
                            }
                          </AlertTitle>
                          <AlertDescription>
                            {question.explanation}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentLessonIndex > 0) {
                        setCurrentLessonIndex(currentLessonIndex - 1);
                      }
                    }}
                    disabled={currentLessonIndex === 0}
                  >
                    Previous Lesson
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        // Calculate quiz score
                        const quizQuestions = currentLesson.quiz;
                        const answeredQuestions = Object.keys(quizAnswers).length;
                        
                        // Check if all questions are answered
                        if (answeredQuestions < quizQuestions.length) {
                          alert("Please answer all questions before submitting.");
                          return;
                        }
                        
                        // Calculate score
                        const score = quizQuestions.reduce((acc, q) => {
                          return acc + (quizAnswers[q.id] === q.correctAnswer ? 1 : 0);
                        }, 0);
                        
                        // Submit quiz results
                        handleQuizSubmit(currentLesson.id, quizAnswers, score);
                        
                        // Move to next lesson if available
                        if (currentLessonIndex < lessons.length - 1) {
                          setCurrentLessonIndex(currentLessonIndex + 1);
                        }
                      }}
                    >
                      {completedContent.includes(`equity_fundamentals_${currentLesson.id}`) 
                        ? "Next Lesson" 
                        : "Submit & Continue"
                      }
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}