import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Info,
  Calendar,
  Clock,
  DollarSign,
  Zap,
  AlertTriangle,
  Check,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import { addMonths, format, differenceInMonths } from "date-fns";

const VestingExplainer = () => {
  const [grantSize, setGrantSize] = useState(10000);
  const [vestingYears, setVestingYears] = useState(4);
  const [cliffMonths, setCliffMonths] = useState(12);
  const [vestingSchedule, setVestingSchedule] = useState("monthly");
  const [sharesValue, setSharesValue] = useState(10);
  const [currentMonth, setCurrentMonth] = useState(15); // e.g., 15 months after grant
  const [timeScale, setTimeScale] = useState(48); // Show 48 months by default
  const [vestingData, setVestingData] = useState([]);
  const [isGrantFresh, setIsGrantFresh] = useState(true);
  const [highlightCliff, setHighlightCliff] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");

  // Calculate vesting data whenever parameters change
  useEffect(() => {
    const data = [];
    const totalMonths = vestingYears * 12;
    const totalShares = grantSize;

    // Calculate vested shares at each month
    for (let month = 0; month <= timeScale; month++) {
      let vestedShares = 0;

      // No vesting before cliff
      if (month < cliffMonths) {
        vestedShares = 0;
      }
      // At cliff, vest the cliff portion
      else if (month === cliffMonths) {
        if (vestingSchedule === "monthly") {
          vestedShares = Math.floor(totalShares * (cliffMonths / totalMonths));
        } else if (vestingSchedule === "quarterly") {
          vestedShares = Math.floor(totalShares * 0.25); // Typically 25% at cliff
        } else if (vestingSchedule === "yearly") {
          vestedShares = Math.floor(totalShares * 0.25); // Typically 25% at cliff
        }
      }
      // After cliff, vest according to schedule
      else if (month <= totalMonths) {
        // Calculate base shares from cliff
        const baseShares = Math.floor(
          totalShares * (cliffMonths / totalMonths)
        );

        // Calculate additional shares based on vesting schedule
        const remainingMonths = month - cliffMonths;
        const remainingShares = totalShares - baseShares;

        if (vestingSchedule === "monthly") {
          // Monthly vesting after cliff
          const monthlyShares = remainingShares / (totalMonths - cliffMonths);
          vestedShares = Math.min(
            Math.floor(baseShares + monthlyShares * remainingMonths),
            totalShares
          );
        } else if (vestingSchedule === "quarterly") {
          // Quarterly vesting after cliff
          const quartersAfterCliff = Math.floor(remainingMonths / 3);
          const quarterlyShares =
            remainingShares / ((totalMonths - cliffMonths) / 3);
          vestedShares = Math.min(
            Math.floor(baseShares + quarterlyShares * quartersAfterCliff),
            totalShares
          );
        } else if (vestingSchedule === "yearly") {
          // Yearly vesting after cliff
          const yearsAfterCliff = Math.floor(remainingMonths / 12);
          const yearlyShares =
            remainingShares / ((totalMonths - cliffMonths) / 12);
          vestedShares = Math.min(
            Math.floor(baseShares + yearlyShares * yearsAfterCliff),
            totalShares
          );
        }
      }
      // After vesting period, all shares are vested
      else {
        vestedShares = totalShares;
      }

      // Calculate value
      const value = vestedShares * sharesValue;

      // Calculate date
      const date = addMonths(new Date(), month - currentMonth);

      // Determine if this month has a vesting event
      let hasVestingEvent = false;

      if (month === cliffMonths) {
        hasVestingEvent = true;
      } else if (month > cliffMonths && month <= totalMonths) {
        if (vestingSchedule === "monthly") {
          hasVestingEvent = true;
        } else if (
          vestingSchedule === "quarterly" &&
          (month - cliffMonths) % 3 === 0
        ) {
          hasVestingEvent = true;
        } else if (
          vestingSchedule === "yearly" &&
          (month - cliffMonths) % 12 === 0
        ) {
          hasVestingEvent = true;
        }
      }

      data.push({
        month,
        date: format(date, "MMM yyyy"),
        rawDate: date,
        vestedShares,
        unvestedShares: totalShares - vestedShares,
        vestedPercent: (vestedShares / totalShares) * 100,
        value,
        hasVestingEvent,
        isCliff: month === cliffMonths,
        isCurrent: month === currentMonth,
      });
    }

    setVestingData(data);
  }, [
    grantSize,
    vestingYears,
    cliffMonths,
    vestingSchedule,
    sharesValue,
    timeScale,
    currentMonth,
  ]);

  // Reset current month if parameters change
  useEffect(() => {
    setIsGrantFresh(true);
    setCurrentMonth(15); // Reset to 15 months after grant
  }, [grantSize, vestingYears, cliffMonths, vestingSchedule]);

  // Get a readable summary of vesting status
  const getVestingStatus = () => {
    const data = vestingData.find((d) => d.month === currentMonth) || {
      vestedShares: 0,
      vestedPercent: 0,
    };
    const { vestedShares, vestedPercent } = data;

    if (currentMonth < cliffMonths) {
      return `You haven't reached your cliff yet. At the cliff (${cliffMonths} months), you'll vest ${Math.floor(
        grantSize * (cliffMonths / (vestingYears * 12))
      )} shares.`;
    } else if (vestedPercent >= 100) {
      return `Congratulations! All ${grantSize.toLocaleString()} shares have vested.`;
    } else {
      const remaining = grantSize - vestedShares;

      let nextVestingEvent = "upcoming vesting";
      if (vestingSchedule === "monthly") {
        nextVestingEvent = "next month";
      } else if (vestingSchedule === "quarterly") {
        const monthsUntilQuarterly = 3 - ((currentMonth - cliffMonths) % 3);
        nextVestingEvent =
          monthsUntilQuarterly === 3
            ? "next quarter"
            : `in ${monthsUntilQuarterly} months`;
      } else if (vestingSchedule === "yearly") {
        const monthsUntilYearly = 12 - ((currentMonth - cliffMonths) % 12);
        nextVestingEvent =
          monthsUntilYearly === 12
            ? "next year"
            : `in ${monthsUntilYearly} months`;
      }

      return `You've vested ${vestedShares.toLocaleString()} shares (${vestedPercent.toFixed(
        1
      )}%). You have ${remaining.toLocaleString()} shares remaining, which will continue to vest ${vestingSchedule}.`;
    }
  };

  // Get upcoming vesting events
  const getUpcomingEvents = () => {
    const futureEvents = vestingData
      .filter((d) => d.month > currentMonth && d.hasVestingEvent)
      .slice(0, 3);

    return futureEvents;
  };

  const upcomingEvents = getUpcomingEvents();

  // Get current vesting status
  const getCurrentStatus = () => {
    if (vestingData.length === 0 || currentMonth < 0) return null;

    const currentData =
      vestingData.find((d) => d.month === currentMonth) ||
      vestingData[vestingData.length - 1];

    return {
      totalShares: grantSize,
      vestedShares: currentData.vestedShares,
      unvestedShares: currentData.unvestedShares,
      vestedPercent: currentData.vestedPercent,
      value: currentData.value,
      beforeCliff: currentMonth < cliffMonths,
      atCliff: currentMonth === cliffMonths,
      fullyVested: currentData.vestedPercent >= 100,
      currentMonth,
      date: currentData.date,
    };
  };

  const currentStatus = getCurrentStatus();

  // Calculate tutorial steps for the timeline scrubber
  const getTutorialSteps = () => {
    const steps = [
      {
        month: 0,
        label: "Grant Date",
        description: "When equity is granted, no shares are vested yet.",
      },
      {
        month: cliffMonths,
        label: "Cliff",
        description: `After ${cliffMonths} months, typically 25% of shares vest at once.`,
      },
      {
        month: Math.floor((vestingYears * 12) / 2),
        label: "Midpoint",
        description:
          "By the midpoint of your vesting period, approximately 50-60% has vested.",
      },
      {
        month: vestingYears * 12,
        label: "Fully Vested",
        description: `After ${vestingYears} years, all shares have vested.`,
      },
    ];

    return steps;
  };

  const tutorialSteps = getTutorialSteps();

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            Vested: {formatNumber(payload[0].value)} shares
          </p>
          <p className="text-sm">
            Value: {formatCurrency(payload[0].value * sharesValue)}
          </p>
          {payload[1] && (
            <p className="text-sm">
              Unvested: {formatNumber(payload[1].value)} shares
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render the UI
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Vesting Explainer</CardTitle>
          <CardDescription>
            Understand how equity vesting works by adjusting parameters and
            seeing results in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="simulator" className="space-y-4">
            <TabsList>
              <TabsTrigger value="simulator">Vesting Simulator</TabsTrigger>
              <TabsTrigger value="learn">Learn About Vesting</TabsTrigger>
              <TabsTrigger value="scenarios">Common Scenarios</TabsTrigger>
            </TabsList>

            <TabsContent value="simulator" className="space-y-6">
              {/* Grant Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Grant Parameters</h3>

                  <div className="space-y-2">
                    <Label htmlFor="grantSize">Number of Shares</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="grantSize"
                        type="number"
                        value={grantSize}
                        onChange={(e) =>
                          setGrantSize(parseInt(e.target.value) || 1000)
                        }
                        min={100}
                        max={1000000}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGrantSize(10000)}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sharesValue">Share Value ($)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="sharesValue"
                        type="number"
                        value={sharesValue}
                        onChange={(e) =>
                          setSharesValue(parseFloat(e.target.value) || 1)
                        }
                        min={0.01}
                        max={1000}
                        step={0.01}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSharesValue(10)}
                      >
                        Reset
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current value per share
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Vesting Schedule</h3>

                  <div className="space-y-2">
                    <Label htmlFor="vestingYears">Vesting Period (years)</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">1</span>
                      <Slider
                        id="vestingYears"
                        value={[vestingYears]}
                        onValueChange={(values) => setVestingYears(values[0])}
                        min={1}
                        max={6}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm">6</span>
                      <span className="w-8 text-sm font-medium">
                        {vestingYears}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cliffMonths">Cliff Period (months)</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">0</span>
                      <Slider
                        id="cliffMonths"
                        value={[cliffMonths]}
                        onValueChange={(values) => setCliffMonths(values[0])}
                        min={0}
                        max={24}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm">24</span>
                      <span className="w-8 text-sm font-medium">
                        {cliffMonths}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cliffMonths === 0
                        ? "No cliff - shares begin vesting immediately"
                        : cliffMonths === 1
                        ? "1 month cliff"
                        : `${cliffMonths} months cliff`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Vesting Frequency</Label>
                    <RadioGroup
                      value={vestingSchedule}
                      onValueChange={setVestingSchedule}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly" className="cursor-pointer">
                          Monthly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quarterly" id="quarterly" />
                        <Label htmlFor="quarterly" className="cursor-pointer">
                          Quarterly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yearly" id="yearly" />
                        <Label htmlFor="yearly" className="cursor-pointer">
                          Yearly
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Vesting Visualization */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Vesting Timeline</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={timeScale === 12 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeScale(12)}
                    >
                      1 Year
                    </Button>
                    <Button
                      variant={timeScale === 24 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeScale(24)}
                    >
                      2 Years
                    </Button>
                    <Button
                      variant={timeScale === 48 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeScale(48)}
                    >
                      4 Years
                    </Button>
                    <Button
                      variant={timeScale === 72 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeScale(72)}
                    >
                      6 Years
                    </Button>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={vestingData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      stackOffset="expand"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 12 }}
                        interval={Math.floor(vestingData.length / 12)}
                      />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        x={
                          vestingData.find((d) => d.month === currentMonth)
                            ?.date
                        }
                        stroke="#ff0000"
                        label={{ value: "Current", position: "top" }}
                      />
                      <ReferenceLine
                        x={
                          vestingData.find((d) => d.month === cliffMonths)?.date
                        }
                        stroke="#f59e0b"
                        label={{ value: "Cliff", position: "top" }}
                      />
                      <Bar
                        dataKey="vestedShares"
                        stackId="a"
                        fill="#0f56b3"
                        name="Vested"
                      />
                      <Bar
                        dataKey="unvestedShares"
                        stackId="a"
                        fill="#e2e8f0"
                        name="Unvested"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Time Scrubber */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="timelineScrubber">
                    Explore Timeline (Month {currentMonth})
                  </Label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm whitespace-nowrap">
                      Grant Date
                    </span>
                    <Slider
                      id="timelineScrubber"
                      value={[currentMonth]}
                      onValueChange={(values) => {
                        setCurrentMonth(values[0]);
                        setIsGrantFresh(false);
                      }}
                      min={0}
                      max={timeScale}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm whitespace-nowrap">
                      {Math.floor(timeScale / 12)} year
                      {timeScale > 12 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Elapsed: {currentMonth} month
                      {currentMonth !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-4">
                      {tutorialSteps.map((step, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className={
                            currentMonth === step.month ? "bg-primary/10" : ""
                          }
                          onClick={() => setCurrentMonth(step.month)}
                        >
                          {step.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              {currentStatus && (
                <Card className="mt-6 border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Current Vesting Status
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {getVestingStatus()}
                        </p>

                        {/* Status Indicators */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`rounded-full p-1 ${
                                currentStatus.beforeCliff
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-green-500/20 text-green-500"
                              }`}
                            >
                              {currentStatus.beforeCliff ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </div>
                            <span className="text-sm">
                              {currentStatus.beforeCliff
                                ? "Before Cliff"
                                : "Cliff Passed"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`rounded-full p-1 ${
                                currentStatus.fullyVested
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-blue-500/20 text-blue-500"
                              }`}
                            >
                              {currentStatus.fullyVested ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </div>
                            <span className="text-sm">
                              {currentStatus.fullyVested
                                ? "Fully Vested"
                                : "Still Vesting"}
                            </span>
                          </div>
                        </div>

                        {/* Upcoming Events */}
                        {upcomingEvents.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">
                              Upcoming Vesting Events
                            </h4>
                            <div className="space-y-2">
                              {upcomingEvents.map((event, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-background rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-sm">
                                      {event.date}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium">
                                    +
                                    {formatNumber(
                                      event.vestedShares -
                                        (index > 0
                                          ? upcomingEvents[index - 1]
                                              .vestedShares
                                          : currentStatus.vestedShares)
                                    )}{" "}
                                    shares
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-background p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Vested Shares
                            </div>
                            <div className="text-2xl font-bold mt-1">
                              {formatNumber(currentStatus.vestedShares)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {currentStatus.vestedPercent.toFixed(1)}% of total
                            </div>
                          </div>

                          <div className="bg-background p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Unvested Shares
                            </div>
                            <div className="text-2xl font-bold mt-1">
                              {formatNumber(currentStatus.unvestedShares)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {(100 - currentStatus.vestedPercent).toFixed(1)}%
                              of total
                            </div>
                          </div>

                          <div className="bg-background p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Current Value
                            </div>
                            <div className="text-2xl font-bold mt-1">
                              {formatCurrency(currentStatus.value)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              @ ${sharesValue} per share
                            </div>
                          </div>

                          <div className="bg-background p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Total Value
                            </div>
                            <div className="text-2xl font-bold mt-1">
                              {formatCurrency(grantSize * sharesValue)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              when fully vested
                            </div>
                          </div>
                        </div>

                        {/* Vesting Progress Bar */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Vesting Progress</span>
                            <span>
                              {currentStatus.vestedPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${currentStatus.vestedPercent}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                            <span>Grant Date</span>
                            <span>Fully Vested</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="learn" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>Key Vesting Concepts</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium">What is Vesting?</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vesting is the process by which you earn your equity
                        grant over time. When shares vest, they become yours to
                        keep or exercise (for options).
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Standard Vesting Schedule</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        The most common schedule is 4 years with a 1-year cliff,
                        meaning 25% vests after your first anniversary, and the
                        rest vests monthly over the remaining 3 years.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">The Cliff</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        A cliff is a period where no equity vests until that
                        period is complete. After the cliff, you receive a
                        larger chunk of equity all at once.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">Equity Types</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Different equity types (ISO, NSO, RSU) have different
                        vesting implications and tax treatments. RSUs typically
                        vest automatically, while options give you the right to
                        purchase shares.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>Tax Implications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium">
                        ISOs (Incentive Stock Options)
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        No tax at vesting. When exercised, may trigger AMT
                        (Alternative Minimum Tax). If held for qualifying
                        periods, can receive long-term capital gains treatment.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">
                        NSOs (Non-Qualified Stock Options)
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        No tax at vesting. When exercised, you pay ordinary
                        income tax on the "spread" (difference between fair
                        market value and strike price).
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">
                        RSUs (Restricted Stock Units)
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Taxed as ordinary income at vesting based on the fair
                        market value of shares. Companies often withhold some
                        shares for taxes ("net settlement").
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">83(b) Election</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        For early exercise options or restricted stock, allows
                        you to pay taxes upfront on unvested shares, potentially
                        reducing future tax liability if share value increases.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Common Scenarios & Edge Cases</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Leaving Before the Cliff
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        If you leave before reaching your cliff, typically you
                        forfeit all equity. Nothing has vested yet.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Leaving After the Cliff
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        You keep what has vested up to your last day. For
                        options, you usually have a limited window to exercise
                        (often 90 days).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Acceleration Provisions
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Some grants include "acceleration" that vests shares
                        faster in case of acquisition or termination without
                        cause.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Repurchase Rights</h4>
                      <p className="text-xs text-muted-foreground">
                        Companies may retain the right to buy back vested shares
                        at fair market value if you leave.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Double-Trigger RSUs
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Some RSUs require both time-based vesting and a
                        liquidity event (like an IPO) to fully vest.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Refresher Grants</h4>
                      <p className="text-xs text-muted-foreground">
                        Companies may issue additional equity grants over time,
                        creating overlapping vesting schedules.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Leaving a Company</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-red-500/10 p-2 mt-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Before the Cliff</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          If you leave before your cliff (typically 1 year), you
                          forfeit all equity. Nothing has vested yet.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setCurrentMonth(6);
                            setVestingYears(4);
                            setCliffMonths(12);
                            setVestingSchedule("monthly");
                          }}
                        >
                          Simulate This Scenario
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/10 p-2 mt-1">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          After the Cliff, During Vesting
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          You keep what has vested up to your last day. For
                          options, you typically have 90 days to exercise vested
                          options.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setCurrentMonth(15);
                            setVestingYears(4);
                            setCliffMonths(12);
                            setVestingSchedule("monthly");
                          }}
                        >
                          Simulate This Scenario
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-green-500/10 p-2 mt-1">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">After Full Vesting</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          All shares have vested. For options, you may still
                          need to exercise within a certain timeframe after
                          leaving.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setCurrentMonth(48);
                            setVestingYears(4);
                            setCliffMonths(12);
                            setVestingSchedule("monthly");
                          }}
                        >
                          Simulate This Scenario
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Different Vesting Schedules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-2 mt-1">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Standard 4-Year Monthly Vesting
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          After a 1-year cliff (25%), the remaining 75% vests
                          monthly over the next 3 years (approximately 2.08% per
                          month).
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setVestingYears(4);
                            setCliffMonths(12);
                            setVestingSchedule("monthly");
                            setCurrentMonth(15);
                          }}
                        >
                          Simulate This Schedule
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-2 mt-1">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Quarterly Vesting</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          After the cliff, shares vest in larger chunks every
                          quarter (3 months) instead of monthly.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setVestingYears(4);
                            setCliffMonths(12);
                            setVestingSchedule("quarterly");
                            setCurrentMonth(15);
                          }}
                        >
                          Simulate This Schedule
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-2 mt-1">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">No Cliff Vesting</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Shares begin vesting immediately with no cliff period,
                          typically on a monthly basis.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setVestingYears(4);
                            setCliffMonths(0);
                            setVestingSchedule("monthly");
                            setCurrentMonth(15);
                          }}
                        >
                          Simulate This Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Complex Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2 mt-1">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Early Exercise</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Some companies allow you to exercise options before
                          they vest. Combined with an 83(b) election, this can
                          provide tax advantages, but comes with risks if you
                          leave before vesting.
                        </p>
                        <div className="mt-3 p-3 bg-amber-500/10 rounded-md">
                          <h5 className="text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Risk Factors
                          </h5>
                          <ul className="mt-1 text-xs space-y-1 text-muted-foreground">
                            <li>• You pay for unvested shares upfront</li>
                            <li>
                              • If you leave before full vesting, company can
                              repurchase unvested shares
                            </li>
                            <li>
                              • Company might fail, making shares worthless
                            </li>
                            <li>
                              • 83(b) election must be filed within 30 days
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2 mt-1">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Acceleration Provisions</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Acceleration clauses can trigger partial or full
                          vesting in specific scenarios:
                        </p>
                        <ul className="mt-2 text-sm space-y-2 text-muted-foreground">
                          <li className="flex items-start gap-1">
                            <span className="font-medium whitespace-nowrap">
                              Single-trigger:
                            </span>
                            <span>
                              Accelerated vesting occurs upon a change in
                              control (acquisition) regardless of employment
                              status.
                            </span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="font-medium whitespace-nowrap">
                              Double-trigger:
                            </span>
                            <span>
                              Requires both a change in control AND being
                              terminated without cause within a specified
                              period.
                            </span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="font-medium whitespace-nowrap">
                              Partial acceleration:
                            </span>
                            <span>
                              Only a portion of unvested shares accelerate,
                              often 50% or 12 months worth.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VestingExplainer;
