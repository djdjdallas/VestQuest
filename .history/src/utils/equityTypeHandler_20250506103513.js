// src/utils/equityTypeHandler.js

/**
 * Comprehensive equity type handler with support for complex scenarios
 */

/**
 * Calculate vested shares with support for complex vesting schedules
 * @param {Object} grant - The equity grant
 * @param {Date} [asOfDate=new Date()] - The date to calculate vesting as of
 * @returns {Object} Vesting details with multiple metrics
 */
export function calculateDetailedVesting(grant, asOfDate = new Date()) {
  // Handle string date inputs
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = new Date(grant.vesting_cliff_date);

  // Initialize result object
  const result = {
    totalShares: grant.shares,
    vestedShares: 0,
    unvestedShares: grant.shares,
    vestedPercentage: 0,
    isCliffPassed: asOfDate >= cliffDate,
    isFullyVested: asOfDate >= vestingEnd,
    nextVestingDate: null,
    nextVestingShares: 0,
    vestingSchedule: [],
    accelerationImpact: 0,
  };

  // Return 0 vested if before cliff date
  if (asOfDate < cliffDate) {
    // Calculate next vesting date and amount (the cliff)
    result.nextVestingDate = cliffDate;

    // For standard 4-year vesting with 1-year cliff, 25% vests at cliff
    const cliffPercentage = 0.25; // This could be a parameter or based on grant details
    result.nextVestingShares = Math.floor(grant.shares * cliffPercentage);

    return result;
  }

  // Return all shares if after vesting end date
  if (asOfDate >= vestingEnd) {
    result.vestedShares = grant.shares;
    result.unvestedShares = 0;
    result.vestedPercentage = 100;
    result.isFullyVested = true;
    return result;
  }

  // Calculate vesting based on schedule type
  const vestingSchedule = grant.vesting_schedule || "monthly";
  const totalVestingDays =
    (vestingEnd.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24);
  const vestedDays =
    (asOfDate.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24);

  // For cliff vesting
  if (vestingSchedule === "cliff") {
    result.vestedShares = grant.shares;
    result.unvestedShares = 0;
    result.vestedPercentage = 100;
    return result;
  }

  // For RSUs that vest only at liquidity events
  if (grant.grant_type === "RSU" && grant.liquidity_event_only === true) {
    // No vesting until liquidity event
    result.vestedShares = 0;
    result.unvestedShares = grant.shares;
    result.vestedPercentage = 0;
    result.isDoubleTriggered = true;
    return result;
  }

  // Calculate vested shares based on schedule
  let vestedShares;
  let intervalDays;

  switch (vestingSchedule) {
    case "yearly":
      intervalDays = 365;
      break;
    case "quarterly":
      intervalDays = 91.25; // Approximately a quarter
      break;
    case "monthly":
    default:
      intervalDays = 30.44; // Average month length
      break;
  }

  // For standard cliff + periodic vesting
  if (asOfDate >= cliffDate) {
    // Calculate cliff amount
    const cliffPercentage = getCliffPercentage(grant);
    const cliffShares = Math.floor(grant.shares * cliffPercentage);

    // Calculate additional vesting after cliff
    const daysAfterCliff = (asOfDate - cliffDate) / (1000 * 60 * 60 * 24);
    const periodsAfterCliff = Math.floor(daysAfterCliff / intervalDays);
    const periodSize =
      (grant.shares - cliffShares) /
      ((vestingEnd - cliffDate) / (intervalDays * 1000 * 60 * 60 * 24));

    // Calculate total vested shares
    vestedShares = Math.min(
      cliffShares + Math.floor(periodsAfterCliff * periodSize),
      grant.shares
    );
  } else {
    vestedShares = 0;
  }

  // Handle back-loaded or custom vesting schedules
  if (grant.custom_vesting_schedule) {
    vestedShares = calculateCustomVestingSchedule(grant, asOfDate);
  }

  // Calculate next vesting event
  const { nextDate, nextShares } = calculateNextVestingEvent(
    grant,
    vestingSchedule,
    asOfDate,
    intervalDays,
    vestedShares
  );

  // Calculate acceleration impact if applicable
  const accelerationImpact = grant.accelerated_vesting
    ? grant.shares - vestedShares
    : 0;

  // Generate full vesting schedule for visualization
  const vestingScheduleData = generateVestingSchedule(
    grant,
    cliffDate,
    vestingStart,
    vestingEnd,
    intervalDays
  );

  // Update result object
  result.vestedShares = vestedShares;
  result.unvestedShares = grant.shares - vestedShares;
  result.vestedPercentage = (vestedShares / grant.shares) * 100;
  result.nextVestingDate = nextDate;
  result.nextVestingShares = nextShares;
  result.vestingSchedule = vestingScheduleData;
  result.accelerationImpact = accelerationImpact;

  return result;
}

/**
 * Handle ISO/NSO conversion when $100,000 limit is exceeded
 * @param {Object} grant - The equity grant
 * @returns {Object} Split of ISO and NSO shares
 */
export function handleISOLimit(grant) {
  if (grant.grant_type !== "ISO") {
    return { isoShares: 0, nsoShares: grant.shares };
  }

  // ISO $100,000 limit calculation
  const limit = 100000;
  const yearlyVesting = generateYearlyVesting(grant);

  let isoShares = 0;
  let nsoShares = 0;

  // Calculate ISO-eligible shares based on $100K limit per year
  yearlyVesting.forEach((yearVest) => {
    const yearValue = yearVest.shares * grant.strike_price;

    if (yearValue <= limit) {
      // All shares this year are ISO-eligible
      isoShares += yearVest.shares;
    } else {
      // Calculate how many shares are ISO-eligible
      const isoEligibleShares = Math.floor(limit / grant.strike_price);
      isoShares += isoEligibleShares;
      nsoShares += yearVest.shares - isoEligibleShares;
    }
  });

  return {
    isoShares,
    nsoShares,
    isLimitExceeded: nsoShares > 0,
    totalValue: grant.shares * grant.strike_price,
    isoPercentage: (isoShares / grant.shares) * 100,
  };
}

/**
 * Handle early exercise and 83(b) election
 * @param {Object} grant - The equity grant
 * @param {Object} exerciseDetails - Details about the early exercise
 * @returns {Object} Tax and vesting implications
 */
export function processEarlyExercise(grant, exerciseDetails) {
  if (!grant.allows_early_exercise) {
    return {
      allowed: false,
      message: "This grant does not allow early exercise",
    };
  }

  const { exerciseDate, exerciseShares, file83b } = exerciseDetails;

  // Calculate unvested shares at exercise date
  const vesting = calculateDetailedVesting(grant, new Date(exerciseDate));
  const unvestedAtExercise = vesting.unvestedShares;

  // Calculate tax implications
  let taxableAmount = 0;
  let taxType = "";

  if (grant.grant_type === "NSO") {
    // NSOs are taxed at exercise on the spread
    taxableAmount = (grant.current_fmv - grant.strike_price) * exerciseShares;
    taxType = "ordinary income";
  } else if (grant.grant_type === "ISO") {
    // ISOs may trigger AMT
    if ((grant.current_fmv - grant.strike_price) * exerciseShares > 0) {
      taxableAmount = (grant.current_fmv - grant.strike_price) * exerciseShares;
      taxType = "AMT income";
    }
  }

  // 83(b) election implications
  let election83b = {
    eligible: unvestedAtExercise > 0,
    deadline: new Date(exerciseDate),
    taxImplications: null,
  };

  // Set deadline to 30 days after exercise
  election83b.deadline.setDate(election83b.deadline.getDate() + 30);

  if (file83b && election83b.eligible) {
    // Calculate 83(b) tax implications
    election83b.taxImplications = {
      taxNow: taxableAmount,
      taxType: taxType,
      futureBenefit:
        "Future appreciation will be capital gains instead of ordinary income",
    };
  }

  return {
    allowed: true,
    exerciseCost: exerciseShares * grant.strike_price,
    unvestedShares: unvestedAtExercise,
    taxableAmount,
    taxType,
    election83b,
  };
}

/**
 * Handle equity acceleration in M&A scenarios
 * @param {Object} grant - The equity grant
 * @param {Object} accelerationDetails - Details about the acceleration event
 * @returns {Object} Acceleration impact
 */
export function calculateAcceleration(grant, accelerationDetails) {
  const { eventDate, accelerationType } = accelerationDetails;

  // Get current vesting status
  const vesting = calculateDetailedVesting(grant, new Date(eventDate));

  // Different types of acceleration
  let acceleratedShares = 0;

  switch (accelerationType) {
    case "single-trigger":
      // All unvested shares accelerate immediately
      acceleratedShares = vesting.unvestedShares;
      break;

    case "double-trigger":
      // Requires termination after change of control
      // This would be applied only if the termination occurs
      acceleratedShares = vesting.unvestedShares;
      break;

    case "partial":
      // Often accelerates a portion, like 50% or 12 months of vesting
      const accelerationMonths = accelerationDetails.months || 12;
      const monthlyVesting = grant.shares / 48; // Assuming standard 4-year vesting
      acceleratedShares = Math.min(
        vesting.unvestedShares,
        Math.floor(accelerationMonths * monthlyVesting)
      );
      break;

    default:
      acceleratedShares = 0;
  }

  return {
    unvestedBeforeEvent: vesting.unvestedShares,
    acceleratedShares,
    remainingUnvestedShares: vesting.unvestedShares - acceleratedShares,
    totalVestedAfterEvent: vesting.vestedShares + acceleratedShares,
    acceleratedValue: acceleratedShares * grant.current_fmv,
  };
}

/**
 * Handle double-trigger RSUs
 * @param {Object} grant - The equity grant
 * @param {Object} liquidityEvent - Details about the liquidity event
 * @returns {Object} Vesting implications
 */
export function handleDoubleTriggerRSUs(grant, liquidityEvent) {
  if (grant.grant_type !== "RSU" || !grant.liquidity_event_only) {
    return {
      applicable: false,
      message: "This grant is not a double-trigger RSU",
    };
  }

  // Calculate time-based vesting as of liquidity event
  const timeBasedVesting = calculateDetailedVesting(
    { ...grant, liquidity_event_only: false },
    new Date(liquidityEvent.date)
  );

  // For double-trigger RSUs, both conditions must be met to vest
  return {
    applicable: true,
    unvestedBeforeEvent: grant.shares, // All shares are unvested until liquidity event
    timeBasedVestedShares: timeBasedVesting.vestedShares,
    vestedAfterEvent: timeBasedVesting.vestedShares, // Only time-vested shares will vest
    vestingValue: timeBasedVesting.vestedShares * liquidityEvent.sharePrice,
    taxableIncome: timeBasedVesting.vestedShares * liquidityEvent.sharePrice,
    remainingUnvestedShares: grant.shares - timeBasedVesting.vestedShares,
  };
}

// Helper functions

function getCliffPercentage(grant) {
  // Calculate cliff percentage based on grant details
  // Standard is 25% for 1-year cliff in 4-year vesting
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = new Date(grant.vesting_cliff_date);

  const totalVestingDays = (vestingEnd - vestingStart) / (1000 * 60 * 60 * 24);
  const cliffDays = (cliffDate - vestingStart) / (1000 * 60 * 60 * 24);

  return cliffDays / totalVestingDays;
}

function calculateNextVestingEvent(
  grant,
  vestingSchedule,
  asOfDate,
  intervalDays,
  currentVestedShares
) {
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = new Date(grant.vesting_cliff_date);

  // If before cliff, next vesting is the cliff
  if (asOfDate < cliffDate) {
    return {
      nextDate: cliffDate,
      nextShares: Math.floor(grant.shares * getCliffPercentage(grant)),
    };
  }

  // If fully vested, no next vesting
  if (currentVestedShares >= grant.shares) {
    return {
      nextDate: null,
      nextShares: 0,
    };
  }

  // Calculate next vesting date based on schedule
  let nextDate = new Date(asOfDate);

  // Find next vesting date based on interval
  while (nextDate <= vestingEnd) {
    nextDate = new Date(
      nextDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
    );

    // If this date is in the future, it's our next vesting date
    if (nextDate > asOfDate) {
      break;
    }
  }

  // If next date is beyond vesting end, use vesting end
  if (nextDate > vestingEnd) {
    nextDate = vestingEnd;
  }

  // Calculate shares to vest at next date
  const nextVesting = calculateDetailedVesting(grant, nextDate);
  const nextShares = nextVesting.vestedShares - currentVestedShares;

  return {
    nextDate,
    nextShares,
  };
}

function generateVestingSchedule(
  grant,
  cliffDate,
  vestingStart,
  vestingEnd,
  intervalDays
) {
  const schedule = [];
  const cliffPercentage = getCliffPercentage(grant);

  // Add initial grant date with 0 vested
  schedule.push({
    date: new Date(vestingStart),
    shares: 0,
    event: "Grant Date",
  });

  // Add cliff vesting
  schedule.push({
    date: new Date(cliffDate),
    shares: Math.floor(grant.shares * cliffPercentage),
    event: "Cliff",
  });

  // Add periodic vesting events
  let currentDate = new Date(cliffDate);
  const sharesPerPeriod = Math.floor(
    (grant.shares - Math.floor(grant.shares * cliffPercentage)) /
      ((vestingEnd - cliffDate) / (intervalDays * 24 * 60 * 60 * 1000))
  );

  while (currentDate < vestingEnd) {
    currentDate = new Date(
      currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
    );

    // Don't go beyond vesting end date
    if (currentDate > vestingEnd) {
      currentDate = new Date(vestingEnd);
    }

    const prevVested = schedule[schedule.length - 1].shares;
    const newVested = Math.min(prevVested + sharesPerPeriod, grant.shares);

    schedule.push({
      date: new Date(currentDate),
      shares: newVested,
      event:
        currentDate.getTime() === vestingEnd.getTime()
          ? "Final Vesting"
          : "Regular Vesting",
    });

    // Stop if we've reached the end or all shares are vested
    if (
      currentDate.getTime() === vestingEnd.getTime() ||
      newVested >= grant.shares
    ) {
      break;
    }
  }

  return schedule;
}

function calculateCustomVestingSchedule(grant, asOfDate) {
  // Implement custom vesting schedule calculation
  // This would handle back-loaded vesting or other non-standard schedules
  return 0; // Placeholder
}

function generateYearlyVesting(grant) {
  // Calculate vesting by year for ISO $100K limit calculations
  const yearlyVesting = [];
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = new Date(grant.vesting_cliff_date);

  // Calculate total vesting years (rounded up)
  const vestingYears = Math.ceil(
    (vestingEnd - vestingStart) / (365 * 24 * 60 * 60 * 1000)
  );

  // For standard 4-year vesting with 1-year cliff
  if (
    vestingYears === 4 &&
    (cliffDate - vestingStart) / (24 * 60 * 60 * 1000) >= 364
  ) {
    // 25% at cliff (Year 1)
    yearlyVesting.push({
      year: 1,
      shares: Math.floor(grant.shares * 0.25),
    });

    // 25% per year for remaining 3 years
    for (let i = 2; i <= 4; i++) {
      yearlyVesting.push({
        year: i,
        shares: Math.floor(grant.shares * 0.25),
      });
    }
  } else {
    // Handle custom vesting schedules
    // This is a simplified approach - would need to be enhanced for complex schedules
    const sharesPerYear = Math.floor(grant.shares / vestingYears);

    for (let i = 1; i <= vestingYears; i++) {
      yearlyVesting.push({
        year: i,
        shares:
          i === vestingYears
            ? grant.shares - sharesPerYear * (vestingYears - 1) // Last year gets remainder
            : sharesPerYear,
      });
    }
  }

  return yearlyVesting;
}
