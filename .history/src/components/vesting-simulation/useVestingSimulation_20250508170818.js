import { useState } from "react";
import {
  format,
  addMonths,
  addDays,
  differenceInDays,
  addQuarters,
} from "date-fns";

export function useVestingSimulation() {
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [simulationType, setSimulationType] = useState("scenario"); // "scenario" or "schedule"

  // Helper function to generate vesting data points
  const generateVestingDataPoints = (
    startDate,
    endDate,
    totalShares,
    scheduleType,
    cliffMonths,
    sharePrice
  ) => {
    const dataPoints = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const cliff = cliffMonths ? addMonths(start, cliffMonths) : null;

    // Determine interval based on schedule type
    let interval;
    if (scheduleType === "monthly") {
      interval = 1; // 1 month
    } else if (scheduleType === "quarterly") {
      interval = 3; // 3 months
    } else if (scheduleType === "yearly") {
      interval = 12; // 12 months
    } else {
      interval = 1; // Default to monthly
    }

    // Calculate cliff percentage (typically 25% for 1-year cliff)
    const cliffPercentage = cliffMonths === 12 ? 0.25 : cliffMonths / 48;
    const cliffShares = cliff ? Math.floor(totalShares * cliffPercentage) : 0;

    // Calculate shares per period after cliff
    const totalMonths = differenceInDays(end, start) / 30;
    const remainingMonths = cliff
      ? differenceInDays(end, cliff) / 30
      : totalMonths;
    const remainingShares = cliff ? totalShares - cliffShares : totalShares;
    const sharesPerMonth = remainingShares / remainingMonths;

    // Add start point (0 shares vested)
    dataPoints.push({
      date: start,
      sharesVested: 0,
      percentageVested: 0,
      value: 0,
    });

    // Add cliff point if applicable
    if (cliff) {
      dataPoints.push({
        date: cliff,
        sharesVested: cliffShares,
        percentageVested: (cliffShares / totalShares) * 100,
        value: cliffShares * sharePrice,
      });
    }

    // Add regular vesting points
    let currentDate = cliff || start;
    let currentShares = cliff ? cliffShares : 0;

    while (currentDate < end) {
      if (scheduleType === "quarterly") {
        currentDate = addQuarters(currentDate, 1);
      } else {
        currentDate = addMonths(currentDate, interval);
      }

      if (currentDate > end) {
        currentDate = new Date(end);
      }

      if (cliff && currentDate <= cliff) {
        continue; // Skip points before cliff
      }

      // Calculate shares vested by this date
      if (currentDate >= end) {
        // Fully vested at end date
        currentShares = totalShares;
      } else {
        // Calculate based on vesting schedule
        const monthsSinceStart = differenceInDays(currentDate, start) / 30;
        const monthsSinceCliff = cliff
          ? differenceInDays(currentDate, cliff) / 30
          : 0;

        if (cliff) {
          currentShares =
            cliffShares + Math.floor(monthsSinceCliff * sharesPerMonth);
        } else {
          currentShares = Math.floor(monthsSinceStart * sharesPerMonth);
        }

        // Ensure we don't exceed total shares
        currentShares = Math.min(currentShares, totalShares);
      }

      dataPoints.push({
        date: currentDate,
        sharesVested: currentShares,
        percentageVested: (currentShares / totalShares) * 100,
        value: currentShares * sharePrice,
      });

      if (currentDate.getTime() === end.getTime()) {
        break; // Break if we're at the end date
      }
    }

    return dataPoints;
  };

  // Simulate a vesting scenario (leaving company, etc.)
  const simulateScenario = (scenario, grantData) => {
    // Default grant data if not provided
    const grant = grantData || {
      shares: 10000,
      grant_date: new Date("2023-01-01"),
      vesting_start_date: new Date("2023-01-01"),
      vesting_end_date: new Date("2027-01-01"),
      vesting_cliff_date: new Date("2024-01-01"),
      current_fmv: 10.0,
      vesting_schedule: "monthly",
      company_name: "Example Corp",
      grant_type: "ISO",
    };

    // Set up simulation parameters based on scenario
    let simulationData = {
      title: "",
      description: "",
      metrics: [],
      chartData: [],
      chartConfig: {
        showPercentage: true,
        showValue: true,
      },
      events: [],
      notes: [],
    };

    // Customize simulation based on scenario
    switch (scenario) {
      case "before-cliff":
        simulationData.title = "Leaving Before the Cliff";
        simulationData.description =
          "Simulation of vesting when leaving the company before the cliff period (typically 1 year)";

        // Calculate dates
        const grantDate = new Date(grant.grant_date);
        const cliffDate = new Date(grant.vesting_cliff_date);
        const sixMonthsAfterGrant = addMonths(grantDate, 6);

        // Generate chart data showing 0 vesting before cliff
        simulationData.chartData = [
          {
            date: grantDate,
            sharesVested: 0,
            percentageVested: 0,
            value: 0,
          },
          {
            date: sixMonthsAfterGrant,
            sharesVested: 0,
            percentageVested: 0,
            value: 0,
          },
          {
            date: cliffDate,
            sharesVested: 0, // No vesting because left before cliff
            percentageVested: 0,
            value: 0,
          },
        ];

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          { label: "Vested Shares", value: 0, type: "number" },
          { label: "Forfeited Shares", value: grant.shares, type: "number" },
          {
            label: "Value Lost",
            value: grant.shares * grant.current_fmv,
            type: "currency",
          },
        ];

        // Add events
        simulationData.events = [
          {
            title: "Grant Date",
            description: `Received ${grant.shares.toLocaleString()} shares of ${
              grant.grant_type
            }`,
            date: grantDate,
            type: "neutral",
          },
          {
            title: "Left Company",
            description: "Departed before cliff vesting date",
            date: sixMonthsAfterGrant,
            type: "negative",
          },
          {
            title: "Cliff Date (Not Reached)",
            description: "You would have vested 25% of shares at this date",
            date: cliffDate,
            type: "neutral",
          },
        ];

        // Add explanatory notes
        simulationData.notes = [
          "If you leave a company before reaching the cliff vesting date, you typically forfeit all equity.",
          "This simulation assumes a standard 1-year cliff with 25% vesting at cliff date.",
          "Always check your specific grant agreement as terms may vary.",
        ];
        break;

      case "after-cliff":
        simulationData.title = "Leaving After the Cliff";
        simulationData.description =
          "Simulation of vesting when leaving the company after the cliff period but before full vesting";

        // Calculate dates
        const startDate = new Date(grant.vesting_start_date);
        const cliffDate2 = new Date(grant.vesting_cliff_date);
        const endDate = new Date(grant.vesting_end_date);
        const twoYearsAfterStart = addMonths(startDate, 24);

        // Calculate vested shares at departure (2 years into 4-year vesting)
        const totalVestingDays = differenceInDays(endDate, startDate);
        const daysVested = differenceInDays(twoYearsAfterStart, startDate);
        const vestingRatio = daysVested / totalVestingDays;

        // With a 1-year cliff, you typically get 25% at cliff and the rest vests monthly
        let vestedShares;
        if (grant.vesting_schedule === "monthly") {
          vestedShares = Math.floor(grant.shares * 0.5); // 2 years = 50% vested
        } else if (grant.vesting_schedule === "quarterly") {
          vestedShares = Math.floor(grant.shares * 0.5); // 2 years = 50% vested
        } else {
          vestedShares = Math.floor(grant.shares * vestingRatio);
        }

        // Generate chart data
        simulationData.chartData = generateVestingDataPoints(
          startDate,
          twoYearsAfterStart,
          grant.shares,
          grant.vesting_schedule || "monthly",
          12, // Assume 1-year cliff
          grant.current_fmv
        );

        // Add a point showing what would have vested if stayed
        simulationData.chartData.push({
          date: endDate,
          sharesVested: grant.shares,
          percentageVested: 100,
          value: grant.shares * grant.current_fmv,
          dotted: true,
        });

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          { label: "Vested Shares", value: vestedShares, type: "number" },
          {
            label: "Forfeited Shares",
            value: grant.shares - vestedShares,
            type: "number",
          },
          {
            label: "Value Retained",
            value: vestedShares * grant.current_fmv,
            type: "currency",
          },
        ];

        // Add events
        simulationData.events = [
          {
            title: "Grant Date",
            description: `Received ${grant.shares.toLocaleString()} shares of ${
              grant.grant_type
            }`,
            date: startDate,
            type: "neutral",
          },
          {
            title: "Cliff Date",
            description: `Vested ${Math.floor(
              grant.shares * 0.25
            ).toLocaleString()} shares (25%)`,
            date: cliffDate2,
            type: "positive",
          },
          {
            title: "Left Company",
            description: `Vested total of ${vestedShares.toLocaleString()} shares (${Math.round(
              vestingRatio * 100
            )}%)`,
            date: twoYearsAfterStart,
            type: "neutral",
          },
        ];

        // Add explanatory notes
        simulationData.notes = [
          "When you leave after the cliff but before full vesting, you keep all vested shares.",
          `For ${grant.grant_type} options, you typically have 90 days to exercise after departure.`,
          "This simulation assumes standard vesting with retention of all vested shares upon departure.",
        ];
        break;

      case "fully-vested":
        simulationData.title = "Leaving After Full Vesting";
        simulationData.description =
          "Simulation of leaving the company after all shares have fully vested";

        // Calculate dates
        const vestStart = new Date(grant.vesting_start_date);
        const vestEnd = new Date(grant.vesting_end_date);
        const sixMonthsAfterVesting = addMonths(vestEnd, 6);

        // Generate chart data showing complete vesting
        simulationData.chartData = generateVestingDataPoints(
          vestStart,
          vestEnd,
          grant.shares,
          grant.vesting_schedule || "monthly",
          grant.vesting_cliff_date ? 12 : 0, // Assume 1-year cliff if cliff date exists
          grant.current_fmv
        );

        // Add point showing continued employment after vesting
        simulationData.chartData.push({
          date: sixMonthsAfterVesting,
          sharesVested: grant.shares,
          percentageVested: 100,
          value: grant.shares * grant.current_fmv,
        });

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          { label: "Vested Shares", value: grant.shares, type: "number" },
          { label: "Vesting Complete", value: 100, type: "percentage" },
          {
            label: "Total Value",
            value: grant.shares * grant.current_fmv,
            type: "currency",
          },
        ];

        // Add events
        simulationData.events = [
          {
            title: "Grant Date",
            description: `Received ${grant.shares.toLocaleString()} shares of ${
              grant.grant_type
            }`,
            date: vestStart,
            type: "neutral",
          },
          {
            title: "Final Vesting Date",
            description: `All ${grant.shares.toLocaleString()} shares fully vested`,
            date: vestEnd,
            type: "positive",
          },
          {
            title: "Left Company",
            description: "Departed after all shares fully vested",
            date: sixMonthsAfterVesting,
            type: "neutral",
          },
        ];

        // Add explanatory notes
        simulationData.notes = [
          "After all shares are fully vested, you retain all equity regardless of when you leave.",
          `For ${grant.grant_type} options, be aware of expiration dates (typically 10 years from grant date).`,
          "Even after full vesting, check your specific agreement for any post-termination exercise periods.",
        ];
        break;

      default:
        simulationData.title = "Generic Vesting Scenario";
        simulationData.description =
          "Basic simulation of equity vesting over time";

        // Generate generic chart data
        simulationData.chartData = generateVestingDataPoints(
          new Date(grant.vesting_start_date),
          new Date(grant.vesting_end_date),
          grant.shares,
          grant.vesting_schedule || "monthly",
          grant.vesting_cliff_date ? 12 : 0,
          grant.current_fmv
        );

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          { label: "Fully Vested", value: grant.shares, type: "number" },
          { label: "Vesting Period", value: 48, type: "number" }, // Typically 48 months
          {
            label: "Total Value",
            value: grant.shares * grant.current_fmv,
            type: "currency",
          },
        ];
    }

    // Update state and open modal
    setCurrentSimulation(simulationData);
    setSimulationType("scenario");
    setSimulationModalOpen(true);
  };

  // Simulate a vesting schedule (monthly, quarterly, no cliff, etc.)
  const simulateSchedule = (scheduleType, grantData) => {
    // Default grant data if not provided
    const grant = grantData || {
      shares: 10000,
      grant_date: new Date("2023-01-01"),
      vesting_start_date: new Date("2023-01-01"),
      vesting_end_date: new Date("2027-01-01"),
      current_fmv: 10.0,
      company_name: "Example Corp",
      grant_type: "ISO",
    };

    // Set up simulation parameters based on schedule type
    let simulationData = {
      title: "",
      description: "",
      metrics: [],
      chartData: [],
      chartConfig: {
        showPercentage: true,
        showValue: true,
      },
      events: [],
      notes: [],
    };

    // Calculate common dates
    const startDate = new Date(grant.vesting_start_date);
    const endDate = new Date(grant.vesting_end_date);

    // Customize simulation based on schedule type
    switch (scheduleType) {
      case "monthly":
        simulationData.title = "Standard 4-Year Monthly Vesting";
        simulationData.description =
          "Simulation of equity vesting monthly over 4 years with a 1-year cliff";

        // Define cliff date (1 year after start)
        const cliffDate = addMonths(startDate, 12);

        // Generate vesting data
        simulationData.chartData = generateVestingDataPoints(
          startDate,
          endDate,
          grant.shares,
          "monthly",
          12, // 12 months = 1 year cliff
          grant.current_fmv
        );

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          {
            label: "Cliff Date",
            value: format(cliffDate, "MM/dd/yyyy"),
            type: "text",
          },
          {
            label: "Cliff Amount",
            value: Math.floor(grant.shares * 0.25),
            type: "number",
          },
          {
            label: "Monthly Rate",
            value: Math.floor((grant.shares * 0.75) / 36),
            type: "number",
          }, // Remaining 75% over 36 months
        ];

        // Add key events
        simulationData.events = [
          {
            title: "Grant Date",
            description: `Grant of ${grant.shares.toLocaleString()} shares begins vesting`,
            date: startDate,
            type: "neutral",
          },
          {
            title: "Cliff Date",
            description: `${Math.floor(
              grant.shares * 0.25
            ).toLocaleString()} shares (25%) vest at once`,
            date: cliffDate,
            type: "positive",
          },
          {
            title: "Monthly Vesting",
            description: `Approximately ${Math.floor(
              (grant.shares * 0.75) / 36
            ).toLocaleString()} shares vest each month after cliff`,
            type: "neutral",
          },
          {
            title: "Vesting Complete",
            description: `All ${grant.shares.toLocaleString()} shares fully vested`,
            date: endDate,
            type: "positive",
          },
        ];

        // Add explanatory notes
        simulationData.notes = [
          "The standard 4-year vesting schedule with 1-year cliff is the most common for startups and tech companies.",
          "After the cliff, shares vest in equal monthly increments for the remaining 36 months.",
          "This schedule balances employee retention with reasonable vesting progression.",
        ];
        break;

      case "quarterly":
        simulationData.title = "Quarterly Vesting Schedule";
        simulationData.description =
          "Simulation of equity vesting quarterly over 4 years with a 1-year cliff";

        // Define cliff date (1 year after start)
        const quarterlyCliffDate = addMonths(startDate, 12);

        // Generate vesting data
        simulationData.chartData = generateVestingDataPoints(
          startDate,
          endDate,
          grant.shares,
          "quarterly",
          12, // 12 months = 1 year cliff
          grant.current_fmv
        );

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          {
            label: "Cliff Amount",
            value: Math.floor(grant.shares * 0.25),
            type: "number",
          },
          {
            label: "Quarterly Rate",
            value: Math.floor((grant.shares * 0.75) / 12),
            type: "number",
          }, // Remaining 75% over 12 quarters
          { label: "Total Quarters", value: 16, type: "number" }, // 4 years = 16 quarters
        ];

        // Add key events
        simulationData.events = [
          {
            title: "Grant Date",
            description: `Grant of ${grant.shares.toLocaleString()} shares begins vesting`,
            date: startDate,
            type: "neutral",
          },
          {
            title: "Cliff Date",
            description: `${Math.floor(
              grant.shares * 0.25
            ).toLocaleString()} shares (25%) vest at once`,
            date: quarterlyCliffDate,
            type: "positive",
          },
          {
            title: "Quarterly Vesting",
            description: `Approximately ${Math.floor(
              (grant.shares * 0.75) / 12
            ).toLocaleString()} shares vest each quarter after cliff`,
            type: "neutral",
          },
          {
            title: "Vesting Complete",
            description: `All ${grant.shares.toLocaleString()} shares fully vested`,
            date: endDate,
            type: "positive",
          },
        ];

        // Add explanatory notes
        simulationData.notes = [
          "Quarterly vesting results in larger vesting events but less frequent than monthly vesting.",
          "This schedule may be simpler to administer but creates 'lumpier' vesting patterns.",
          "Some companies prefer quarterly vesting to align with business quarters and reporting periods.",
        ];
        break;

      case "no-cliff":
        simulationData.title = "No Cliff Vesting";
        simulationData.description =
          "Simulation of equity vesting monthly over 4 years with no cliff period";

        // Generate vesting data without cliff
        simulationData.chartData = generateVestingDataPoints(
          startDate,
          endDate,
          grant.shares,
          "monthly",
          0, // 0 months = no cliff
          grant.current_fmv
        );

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          {
            label: "Monthly Rate",
            value: Math.floor(grant.shares / 48),
            type: "number",
          }, // Equal distribution over 48 months
          {
            label: "First Month",
            value: Math.floor(grant.shares / 48),
            type: "number",
          },
          { label: "No Cliff", value: "Yes", type: "text" },
        ];

        // Add key events
        simulationData.events = [
          {
            title: "Grant Date",
            description: `Grant of ${grant.shares.toLocaleString()} shares begins vesting immediately`,
            date: startDate,
            type: "neutral",
          },
          {
            title: "First Month Vesting",
            description: `${Math.floor(
              grant.shares / 48
            ).toLocaleString()} shares vest after first month`,
            date: addMonths(startDate, 1),
            type: "positive",
          },
          {
            title: "Continuous Monthly Vesting",
            description: `${Math.floor(
              grant.shares / 48
            ).toLocaleString()} shares vest each month`,
            type: "neutral",
          },
          {
            title: "Vesting Complete",
            description: `All ${grant.shares.toLocaleString()} shares fully vested`,
            date: endDate,
            type: "positive",
          },
        ];

        // Add explanatory notes
        simulationData.notes = [
          "No-cliff vesting provides immediate equity accrual from the first month.",
          "This is less common for new employees but may be used for senior hires or in certain acquisitions.",
          "Without a cliff, there's potentially less incentive for short-term retention compared to cliff vesting.",
        ];
        break;

      default:
        simulationData.title = "Custom Vesting Schedule";
        simulationData.description =
          "Simulation of a custom equity vesting schedule";

        // Generate generic vesting data
        simulationData.chartData = generateVestingDataPoints(
          startDate,
          endDate,
          grant.shares,
          "monthly",
          0,
          grant.current_fmv
        );

        // Add metrics
        simulationData.metrics = [
          { label: "Total Shares", value: grant.shares, type: "number" },
          {
            label: "Vesting Period",
            value: differenceInDays(endDate, startDate) / 30,
            type: "number",
          }, // Duration in months
          {
            label: "Monthly Rate",
            value: Math.floor(
              grant.shares / (differenceInDays(endDate, startDate) / 30)
            ),
            type: "number",
          },
          {
            label: "Final Value",
            value: grant.shares * grant.current_fmv,
            type: "currency",
          },
        ];
    }

    // Update state and open modal
    setCurrentSimulation(simulationData);
    setSimulationType("schedule");
    setSimulationModalOpen(true);
  };

  return {
    simulateScenario,
    simulateSchedule,
    simulationModalOpen,
    setSimulationModalOpen,
    currentSimulation,
    simulationType,
  };
}
