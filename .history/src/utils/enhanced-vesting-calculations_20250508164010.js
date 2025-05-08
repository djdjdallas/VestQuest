/**
 * Enhanced vesting calculation utility
 * Handles complex vesting schedules, edge cases, and provides more detailed outputs
 */

/**
 * Calculate vested shares with support for complex vesting schedules
 * @param {Object} grant - The equity grant
 * @param {Date} [asOfDate=new Date()] - The date to calculate vesting as of
 * @returns {Object} Detailed vesting information
 */
function calculateDetailedVesting(grant, asOfDate = new Date()) {
  // Handle null/undefined grant
  if (!grant) {
    return {
      totalShares: 0,
      vestedShares: 0,
      unvestedShares: 0,
      vestedPercentage: 0,
      isCliffPassed: false,
      isFullyVested: false,
      nextVestingDate: null,
      nextVestingShares: 0,
      vestingSchedule: [], // Empty array, not undefined
      timeUntilNextVesting: null,
    };
  }

  const now = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = grant.vesting_cliff_date
    ? new Date(grant.vesting_cliff_date)
    : null;
  const totalShares = grant.shares || 0;

  // Initialize result
  const result = {
    totalShares,
    vestedShares: 0,
    unvestedShares: totalShares,
    vestedPercentage: 0,
    isCliffPassed: cliffDate ? now >= cliffDate : true,
    isFullyVested: now >= vestingEnd,
    nextVestingDate: null,
    nextVestingShares: 0,
    vestingSchedule: [], // Initialize with empty array
    timeUntilNextVesting: null,
  };

  // If invalid dates or no shares, return default result
  if (!vestingStart || !vestingEnd || totalShares <= 0) {
    return result;
  }

  // Determine vesting schedule type and calculate accordingly
  const vestingSchedule = grant.vesting_schedule || "monthly";

  // Calculate interval days based on vesting schedule
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

  // Generate vesting schedule first so it's available for any return path
  result.vestingSchedule = generateVestingSchedule(
    grant,
    cliffDate,
    vestingStart,
    vestingEnd,
    intervalDays
  );

  // If fully vested
  if (now >= vestingEnd) {
    result.vestedShares = totalShares;
    result.unvestedShares = 0;
    result.vestedPercentage = 100;
    return result;
  }

  // If before vesting start, no shares are vested
  if (now < vestingStart) {
    result.nextVestingDate = cliffDate || vestingStart;
    // For cliff, typically 25% vests
    const cliffPercentage = cliffDate ? 0.25 : 0;
    result.nextVestingShares = Math.floor(totalShares * cliffPercentage);
    result.timeUntilNextVesting = Math.ceil(
      (result.nextVestingDate - now) / (1000 * 60 * 60 * 24)
    );
    return result;
  }

  // If cliff exists and we're before cliff date, no shares are vested
  if (cliffDate && now < cliffDate) {
    result.nextVestingDate = cliffDate;
    // Typical cliff vesting amount (can be customized based on grant details)
    result.nextVestingShares = Math.floor(totalShares * 0.25);
    result.timeUntilNextVesting = Math.ceil(
      (cliffDate - now) / (1000 * 60 * 60 * 24)
    );
    return result;
  }

  const totalVestingDays = (vestingEnd - vestingStart) / (1000 * 60 * 60 * 24);
  const elapsedDays = Math.min(
    totalVestingDays,
    (now - vestingStart) / (1000 * 60 * 60 * 24)
  );

  // Calculate vested shares
  let vestedShares = 0;

  // Standard vesting with cliff
  if (cliffDate && now >= cliffDate) {
    // Calculate cliff amount (typically 25% for 1-year cliff)
    const cliffPercentage = 0.25;
    const cliffShares = Math.floor(totalShares * cliffPercentage);

    // Calculate additional vesting after cliff
    const daysAfterCliff = (now - cliffDate) / (1000 * 60 * 60 * 24);
    const remainingShares = totalShares - cliffShares;
    const remainingDays = (vestingEnd - cliffDate) / (1000 * 60 * 60 * 24);

    const additionalVested = Math.floor(
      (daysAfterCliff / remainingDays) * remainingShares
    );
    vestedShares = Math.min(cliffShares + additionalVested, totalShares);
  } else {
    // Simple linear vesting
    vestedShares = Math.floor((elapsedDays / totalVestingDays) * totalShares);
  }

  // RSUs that require liquidity event
  if (grant.grant_type === "RSU" && grant.liquidity_event_only) {
    vestedShares = 0;
  }

  // Calculate next vesting date and amount
  let nextDate = null;
  let nextShares = 0;

  if (vestedShares < totalShares) {
    if (vestingSchedule === "monthly") {
      nextDate = new Date(now);
      nextDate.setMonth(nextDate.getMonth() + 1);
      // Adjust day to match original grant's day if possible
      const originalDay = vestingStart.getDate();
      const maxDaysInMonth = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + 1,
        0
      ).getDate();
      nextDate.setDate(Math.min(originalDay, maxDaysInMonth));

      const monthlyAmount = totalShares / 48; // Typical 48-month vesting
      nextShares = Math.min(
        Math.floor(monthlyAmount),
        totalShares - vestedShares
      );
    } else if (vestingSchedule === "quarterly") {
      nextDate = new Date(now);
      nextDate.setMonth(nextDate.getMonth() + 3);
      // Adjust day to match original grant's day if possible
      const originalDay = vestingStart.getDate();
      const maxDaysInMonth = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + 1,
        0
      ).getDate();
      nextDate.setDate(Math.min(originalDay, maxDaysInMonth));

      const quarterlyAmount = totalShares / 16; // Typical 16-quarter vesting
      nextShares = Math.min(
        Math.floor(quarterlyAmount),
        totalShares - vestedShares
      );
    } else {
      nextDate = new Date(now);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      // Keep exact date for yearly vesting
      nextDate.setMonth(vestingStart.getMonth());
      nextDate.setDate(vestingStart.getDate());

      const yearlyAmount = totalShares / 4; // Typical 4-year vesting
      nextShares = Math.min(
        Math.floor(yearlyAmount),
        totalShares - vestedShares
      );
    }

    // If next date is beyond vesting end, use vesting end
    if (nextDate > vestingEnd) {
      nextDate = new Date(vestingEnd);
      nextShares = totalShares - vestedShares;
    }
  }

  // Update result
  result.vestedShares = vestedShares;
  result.unvestedShares = totalShares - vestedShares;
  result.vestedPercentage = (vestedShares / totalShares) * 100;
  result.nextVestingDate = nextDate;
  result.nextVestingShares = nextShares;
  result.timeUntilNextVesting = nextDate
    ? Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24))
    : null;

  return result;
}

/**
 * Calculate the next vesting event
 * @param {Object} grant - The equity grant
 * @param {string} vestingSchedule - The vesting schedule type
 * @param {Date} asOfDate - Current reference date
 * @param {number} intervalDays - Days between vesting events
 * @param {number} currentVestedShares - Currently vested shares
 * @param {Date} cliffDate - Cliff vesting date (if applicable)
 * @returns {Object} Next vesting date and shares
 */
function calculateNextVestingEvent(
  grant,
  vestingSchedule,
  asOfDate,
  intervalDays,
  currentVestedShares,
  cliffDate
) {
  const vestingEnd = new Date(grant.vesting_end_date);

  // If before cliff, next vesting is the cliff
  if (cliffDate && asOfDate < cliffDate) {
    return {
      nextDate: cliffDate,
      nextShares: Math.floor(grant.shares * 0.25), // Typical cliff vesting
    };
  }

  // If fully vested, no next vesting
  if (currentVestedShares >= grant.shares) {
    return {
      nextDate: null,
      nextShares: 0,
    };
  }

  // Find next vesting date based on schedule
  if (vestingSchedule === "cliff") {
    return {
      nextDate: vestingEnd,
      nextShares: grant.shares - currentVestedShares,
    };
  }

  // Calculate next periodic vesting date
  let nextDate = new Date(asOfDate);
  let foundNextDate = false;

  // Start from last vesting date before current date
  const vestingStart = new Date(grant.vesting_start_date);
  const startPoint =
    cliffDate && asOfDate >= cliffDate ? cliffDate : vestingStart;

  let checkDate = new Date(startPoint);
  while (checkDate <= asOfDate) {
    checkDate = new Date(
      checkDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
    );
  }

  // Found the next vesting date
  nextDate = checkDate > vestingEnd ? vestingEnd : checkDate;

  // Calculate shares to vest at next date
  let nextShares = 0;

  if (
    vestingSchedule === "monthly" ||
    vestingSchedule === "quarterly" ||
    vestingSchedule === "yearly"
  ) {
    // Calculate total vesting periods
    const totalPeriods = Math.ceil(
      (vestingEnd - vestingStart) / (intervalDays * 24 * 60 * 60 * 1000)
    );

    // For cliff vesting followed by periodic
    if (cliffDate) {
      const cliffShares = Math.floor(grant.shares * 0.25);
      const sharesPerPeriod = Math.floor(
        (grant.shares - cliffShares) / (totalPeriods - 1)
      );
      nextShares = Math.min(
        sharesPerPeriod,
        grant.shares - currentVestedShares
      );
    } else {
      // Simple periodic vesting
      const sharesPerPeriod = Math.floor(grant.shares / totalPeriods);
      nextShares = Math.min(
        sharesPerPeriod,
        grant.shares - currentVestedShares
      );
    }

    // Handle last period (may have remainder shares)
    if (nextDate.getTime() === vestingEnd.getTime()) {
      nextShares = grant.shares - currentVestedShares;
    }
  }

  return {
    nextDate,
    nextShares,
  };
}

/**
 * Generate full vesting schedule for visualization
 * @param {Object} grant - The equity grant
 * @param {Date} cliffDate - Cliff date (if applicable)
 * @param {Date} vestingStart - Vesting start date
 * @param {Date} vestingEnd - Vesting end date
 * @param {number} intervalDays - Days between vesting events
 * @returns {Array} Array of vesting events with dates and amounts
 */
function generateVestingSchedule(
  grant,
  cliffDate,
  vestingStart,
  vestingEnd,
  intervalDays
) {
  const schedule = [];

  // Add initial grant date with 0 vested
  schedule.push({
    date: new Date(vestingStart),
    shares: 0,
    event: "Grant Date",
  });

  // Handle cliff vesting
  if (cliffDate) {
    const cliffPercentage = 0.25; // Typical 1-year cliff for 4-year vest
    schedule.push({
      date: new Date(cliffDate),
      shares: Math.floor(grant.shares * cliffPercentage),
      event: "Cliff Vesting",
    });

    // Add periodic vesting events after cliff
    let currentDate = new Date(cliffDate);
    const remainingShares =
      grant.shares - Math.floor(grant.shares * cliffPercentage);
    const remainingVestingDays =
      (vestingEnd - cliffDate) / (1000 * 60 * 60 * 24);
    const remainingPeriods = Math.ceil(remainingVestingDays / intervalDays);
    const sharesPerPeriod = Math.floor(remainingShares / remainingPeriods);

    for (let i = 0; i < remainingPeriods; i++) {
      currentDate = new Date(
        currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
      );

      // Don't go beyond vesting end date
      if (currentDate > vestingEnd) {
        currentDate = new Date(vestingEnd);
      }

      const isLastPeriod =
        i === remainingPeriods - 1 ||
        currentDate.getTime() === vestingEnd.getTime();
      const previousShares = schedule[schedule.length - 1].shares;
      const newShares = isLastPeriod
        ? grant.shares
        : previousShares + sharesPerPeriod;

      schedule.push({
        date: new Date(currentDate),
        shares: newShares,
        event: isLastPeriod ? "Final Vesting" : "Regular Vesting",
      });

      if (isLastPeriod) break;
    }
  } else {
    // Simple periodic vesting without cliff
    let currentDate = new Date(vestingStart);
    const totalPeriods = Math.ceil(
      (vestingEnd - vestingStart) / (intervalDays * 24 * 60 * 60 * 1000)
    );
    const sharesPerPeriod = Math.floor(grant.shares / totalPeriods);

    for (let i = 0; i < totalPeriods; i++) {
      currentDate = new Date(
        currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000
      );

      // Don't go beyond vesting end date
      if (currentDate > vestingEnd) {
        currentDate = new Date(vestingEnd);
      }

      const isLastPeriod =
        i === totalPeriods - 1 ||
        currentDate.getTime() === vestingEnd.getTime();
      const previousShares = schedule[schedule.length - 1].shares;
      const newShares = isLastPeriod
        ? grant.shares
        : previousShares + sharesPerPeriod;

      schedule.push({
        date: new Date(currentDate),
        shares: newShares,
        event: isLastPeriod ? "Final Vesting" : "Regular Vesting",
      });

      if (isLastPeriod) break;
    }
  }

  return schedule;
}

/**
 * Calculate upcoming vesting events
 * @param {Object} grant - The equity grant
 * @param {number} [monthsAhead=6] - Number of months to look ahead
 * @returns {Array} Upcoming vesting events
 */
/**
 * Calculate upcoming vesting events
 * @param {Object} grant - The equity grant
 * @param {number} [monthsAhead=6] - Number of months to look ahead
 * @returns {Array} Upcoming vesting events
 */
export function getUpcomingVestingEvents(grant, monthsAhead = 6) {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + monthsAhead);

  const detailedVesting = calculateDetailedVesting(grant, now);
  const events = [];

  // Only process if there are unvested shares and we have a vesting schedule
  // Add null check for vestingSchedule and ensure it has elements
  if (
    detailedVesting.unvestedShares > 0 &&
    detailedVesting.vestingSchedule &&
    detailedVesting.vestingSchedule.length > 0
  ) {
    // Filter for events between now and future date
    detailedVesting.vestingSchedule.forEach((event) => {
      if (event.date > now && event.date <= futureDate && event.shares > 0) {
        const previousEvent = detailedVesting.vestingSchedule.find(
          (e) => e.date < event.date && e.date <= now
        );

        const previousShares = previousEvent ? previousEvent.shares : 0;
        const newlyVestedShares = event.shares - previousShares;

        if (newlyVestedShares > 0) {
          events.push({
            date: event.date,
            shares: newlyVestedShares,
            event: event.event,
            value: newlyVestedShares * (grant.current_fmv || 0),
          });
        }
      }
    });
  }

  return events;
}

/**
 * Calculate the combined vesting schedule for multiple grants
 * @param {Array} grants - Array of equity grants
 * @param {Date} [startDate=new Date()] - Start date for the schedule
 * @param {number} [monthsAhead=36] - Number of months to include in schedule
 * @returns {Array} Combined vesting schedule with monthly aggregation
 */
export function calculateCombinedVestingSchedule(
  grants,
  startDate = new Date(),
  monthsAhead = 36
) {
  if (!grants || !grants.length) return [];

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  // Create a map of dates to vesting amounts
  const vestingMap = new Map();

  // Process each grant
  grants.forEach((grant) => {
    const detailedVesting = calculateDetailedVesting(grant, startDate);

    // Skip grants that are fully vested
    if (detailedVesting.isFullyVested) return;

    // Process vesting schedule
    detailedVesting.vestingSchedule.forEach((event) => {
      // Only include events between start and end dates
      if (event.date >= startDate && event.date <= endDate) {
        // Get month key (YYYY-MM)
        const monthKey = `${event.date.getFullYear()}-${String(
          event.date.getMonth() + 1
        ).padStart(2, "0")}`;

        // Find previous event for this grant to calculate newly vested shares
        const previousEvents = detailedVesting.vestingSchedule.filter(
          (e) => e.date < event.date
        );

        const previousShares = previousEvents.length
          ? previousEvents.reduce(
              (max, e) => (e.shares > max ? e.shares : max),
              0
            )
          : 0;

        const newlyVestedShares = event.shares - previousShares;

        if (newlyVestedShares > 0) {
          // Add to the month's vesting total
          if (vestingMap.has(monthKey)) {
            const monthData = vestingMap.get(monthKey);
            monthData.shares += newlyVestedShares;
            monthData.value += newlyVestedShares * (grant.current_fmv || 0);
            monthData.details.push({
              company: grant.company_name,
              grantType: grant.grant_type,
              shares: newlyVestedShares,
              value: newlyVestedShares * (grant.current_fmv || 0),
            });
          } else {
            vestingMap.set(monthKey, {
              month: monthKey,
              date: new Date(
                event.date.getFullYear(),
                event.date.getMonth(),
                1
              ),
              shares: newlyVestedShares,
              value: newlyVestedShares * (grant.current_fmv || 0),
              details: [
                {
                  company: grant.company_name,
                  grantType: grant.grant_type,
                  shares: newlyVestedShares,
                  value: newlyVestedShares * (grant.current_fmv || 0),
                },
              ],
            });
          }
        }
      }
    });
  });

  // Convert map to array and sort by date
  const combinedSchedule = Array.from(vestingMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Add running totals
  let cumulativeShares = 0;
  let cumulativeValue = 0;

  combinedSchedule.forEach((month) => {
    cumulativeShares += month.shares;
    cumulativeValue += month.value;
    month.cumulativeShares = cumulativeShares;
    month.cumulativeValue = cumulativeValue;
  });

  return combinedSchedule;
}

/**
 * Handle double-trigger RSUs with time-based vesting + liquidity event
 * @param {Object} grant - The RSU grant
 * @param {Object} liquidityEvent - Details about the liquidity event
 * @returns {Object} Vesting implications after the liquidity event
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
