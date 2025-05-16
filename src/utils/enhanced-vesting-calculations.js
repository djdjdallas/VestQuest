/**
 * Enhanced vesting calculation utility
 * Handles complex vesting schedules, edge cases, and provides more detailed outputs
 */

import { formatCurrency, formatNumber } from "@/utils/format-utils";
import { addMonths, addDays, differenceInMonths, differenceInDays, parseISO, format } from "date-fns";

/**
 * Calculate vested shares with support for complex vesting schedules
 * @param {Object} grant - The equity grant
 * @param {Date} [asOfDate=new Date()] - The date to calculate vesting as of
 * @returns {Object} Detailed vesting information
 */
export function calculateDetailedVesting(grant, asOfDate = new Date()) {
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
    milestones: [], // Track key vesting milestones
  };

  // If invalid dates or no shares, return default result
  if (!vestingStart || !vestingEnd || totalShares <= 0) {
    return result;
  }

  // Handle accelerated vesting if flag is set
  if (grant.accelerated_vesting) {
    return calculateAcceleratedVesting(grant, now, result);
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

  // Generate milestone events (25%, 50%, 75%, 100%)
  result.milestones = generateMilestones(grant, result.vestingSchedule);

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
    result.nextVestingShares = Math.floor(totalShares * (grant.cliff_percentage || 0.25));
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
    const cliffPercentage = grant.cliff_percentage || 0.25;
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
    // Simple linear vesting (no cliff or cliff has passed)
    vestedShares = Math.floor((elapsedDays / totalVestingDays) * totalShares);
  }

  // Handle double-trigger RSUs that require liquidity event
  if (grant.grant_type === "RSU" && grant.liquidity_event_only && !grant.liquidity_event_date) {
    vestedShares = 0;
  } else if (grant.grant_type === "RSU" && grant.liquidity_event_only && grant.liquidity_event_date) {
    // Handle the case where the liquidity event has occurred
    const liquidityDate = new Date(grant.liquidity_event_date);
    if (now >= liquidityDate) {
      // Only time-vested shares (as of liquidityDate) actually vest when the liquidity event happens
      const timeVestedAtLiquidity = calculateVestedSharesAtDate(grant, liquidityDate);
      vestedShares = Math.min(timeVestedAtLiquidity, vestedShares);
    } else {
      // Liquidity event is in the future
      vestedShares = 0;
    }
  }

  // Calculate next vesting date and amount
  const nextVestingEvent = calculateNextVestingEvent(
    grant,
    vestingSchedule,
    now,
    intervalDays,
    vestedShares,
    cliffDate
  );

  // Update result
  result.vestedShares = vestedShares;
  result.unvestedShares = totalShares - vestedShares;
  result.vestedPercentage = (vestedShares / totalShares) * 100;
  result.nextVestingDate = nextVestingEvent.nextDate;
  result.nextVestingShares = nextVestingEvent.nextShares;
  result.timeUntilNextVesting = nextVestingEvent.nextDate
    ? Math.ceil((nextVestingEvent.nextDate - now) / (1000 * 60 * 60 * 24))
    : null;

  return result;
}

/**
 * Calculate the vesting for grants with accelerated vesting
 * @param {Object} grant - The equity grant
 * @param {Date} now - Current reference date
 * @param {Object} baseResult - Base result object to extend
 * @returns {Object} Result with accelerated vesting calculated
 */
function calculateAcceleratedVesting(grant, now, baseResult) {
  // Start with regular vesting calculation
  const regularVesting = { ...baseResult };
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = grant.vesting_cliff_date ? new Date(grant.vesting_cliff_date) : null;
  const totalShares = grant.shares || 0;
  
  // Calculate the elapsed time as a percentage of total vesting period
  const totalVestingDays = (vestingEnd - vestingStart) / (1000 * 60 * 60 * 24);
  const elapsedDays = Math.min(
    totalVestingDays,
    (now - vestingStart) / (1000 * 60 * 60 * 24)
  );
  const elapsedPercentage = elapsedDays / totalVestingDays;
  
  // Calculate the accelerated percentage (typically 1.25-1.5 times the normal rate)
  const accelerationFactor = grant.acceleration_factor || 1.25;
  let acceleratedPercentage = elapsedPercentage * accelerationFactor;
  
  // Handle cliff for accelerated vesting
  if (cliffDate && now < cliffDate) {
    // Before cliff, no acceleration
    return regularVesting;
  } else if (cliffDate && now >= cliffDate) {
    // After cliff, apply acceleration to post-cliff vesting
    const cliffPercentage = grant.cliff_percentage || 0.25;
    const postCliffElapsed = Math.min(totalVestingDays, (now - cliffDate) / (1000 * 60 * 60 * 24));
    const postCliffTotal = totalVestingDays - (cliffDate - vestingStart) / (1000 * 60 * 60 * 24);
    const postCliffPercentage = postCliffElapsed / postCliffTotal;
    const acceleratedPostCliff = postCliffPercentage * accelerationFactor;
    
    // Combine cliff and accelerated post-cliff vesting
    acceleratedPercentage = cliffPercentage + (1 - cliffPercentage) * acceleratedPostCliff;
  }
  
  // Cap at 100%
  acceleratedPercentage = Math.min(acceleratedPercentage, 1);
  
  // Calculate vested shares
  const vestedShares = Math.floor(totalShares * acceleratedPercentage);
  
  // Generate accelerated schedule
  const vestingSchedule = generateAcceleratedSchedule(
    grant,
    cliffDate,
    vestingStart,
    vestingEnd,
    accelerationFactor
  );
  
  // Return the result with accelerated vesting
  return {
    ...regularVesting,
    vestedShares,
    unvestedShares: totalShares - vestedShares,
    vestedPercentage: acceleratedPercentage * 100,
    vestingSchedule,
    milestones: generateMilestones(grant, vestingSchedule),
    accelerated: true,
    accelerationFactor
  };
}

/**
 * Generate vesting schedule for accelerated vesting
 * @param {Object} grant - The equity grant
 * @param {Date} cliffDate - Cliff date (if applicable)
 * @param {Date} vestingStart - Vesting start date
 * @param {Date} vestingEnd - Vesting end date
 * @param {number} accelerationFactor - The acceleration factor (e.g. 1.25)
 * @returns {Array} Array of vesting events with dates and amounts
 */
function generateAcceleratedSchedule(
  grant,
  cliffDate,
  vestingStart,
  vestingEnd,
  accelerationFactor
) {
  const schedule = [];
  const totalShares = grant.shares || 0;
  
  // Add initial grant date with 0 vested
  schedule.push({
    date: new Date(vestingStart),
    shares: 0,
    event: "Grant Date",
  });
  
  // Handle cliff vesting
  if (cliffDate) {
    const cliffPercentage = grant.cliff_percentage || 0.25;
    schedule.push({
      date: new Date(cliffDate),
      shares: Math.floor(totalShares * cliffPercentage),
      event: "Cliff Vesting",
    });
    
    // Calculate accelerated post-cliff vesting
    const postCliffPeriod = (vestingEnd - cliffDate) / (1000 * 60 * 60 * 24);
    const acceleratedEnd = new Date(cliffDate.getTime() + postCliffPeriod * 1000 * 60 * 60 * 24 / accelerationFactor);
    
    // Add monthly points between cliff and accelerated end
    let currentDate = new Date(cliffDate);
    const monthlyInterval = 30; // days
    const cliffShares = Math.floor(totalShares * cliffPercentage);
    const remainingShares = totalShares - cliffShares;
    
    while (currentDate < acceleratedEnd && currentDate < vestingEnd) {
      // Move to next month
      currentDate = addDays(currentDate, monthlyInterval);
      
      // Calculate percentage of post-cliff period complete
      const daysAfterCliff = (currentDate - cliffDate) / (1000 * 60 * 60 * 24);
      const acceleratedPercentage = Math.min(daysAfterCliff / (postCliffPeriod / accelerationFactor), 1);
      
      // Calculate shares vested
      const postCliffShares = Math.floor(remainingShares * acceleratedPercentage);
      const totalVested = Math.min(cliffShares + postCliffShares, totalShares);
      
      schedule.push({
        date: new Date(currentDate),
        shares: totalVested,
        event: currentDate >= vestingEnd ? "Final Vesting" : "Accelerated Vesting",
      });
      
      // Break if we've reached full vesting
      if (totalVested >= totalShares || currentDate >= vestingEnd) {
        break;
      }
    }
    
    // Ensure final vesting point
    if (schedule[schedule.length - 1].shares < totalShares) {
      schedule.push({
        date: new Date(Math.min(acceleratedEnd, vestingEnd)),
        shares: totalShares,
        event: "Final Vesting",
      });
    }
  } else {
    // No cliff, just accelerated linear vesting
    const acceleratedEnd = new Date(vestingStart.getTime() + 
      (vestingEnd - vestingStart) / accelerationFactor);
    
    // Add monthly points between start and accelerated end
    let currentDate = new Date(vestingStart);
    const monthlyInterval = 30; // days
    
    while (currentDate < acceleratedEnd && currentDate < vestingEnd) {
      // Move to next month
      currentDate = addDays(currentDate, monthlyInterval);
      
      // Calculate percentage complete
      const daysSinceStart = (currentDate - vestingStart) / (1000 * 60 * 60 * 24);
      const totalDays = (vestingEnd - vestingStart) / (1000 * 60 * 60 * 24);
      const acceleratedPercentage = Math.min(daysSinceStart / (totalDays / accelerationFactor), 1);
      
      // Calculate shares vested
      const vestedShares = Math.floor(totalShares * acceleratedPercentage);
      
      schedule.push({
        date: new Date(currentDate),
        shares: vestedShares,
        event: currentDate >= vestingEnd ? "Final Vesting" : "Accelerated Vesting",
      });
      
      // Break if we've reached full vesting
      if (vestedShares >= totalShares || currentDate >= vestingEnd) {
        break;
      }
    }
    
    // Ensure final vesting point
    if (schedule[schedule.length - 1].shares < totalShares) {
      schedule.push({
        date: new Date(Math.min(acceleratedEnd, vestingEnd)),
        shares: totalShares,
        event: "Final Vesting",
      });
    }
  }
  
  return schedule;
}

/**
 * Calculate vested shares at a specific date
 * @param {Object} grant - The equity grant
 * @param {Date} asOfDate - The date to calculate vesting as of
 * @returns {number} Number of vested shares
 */
function calculateVestedSharesAtDate(grant, asOfDate) {
  const vestingStart = new Date(grant.vesting_start_date);
  const vestingEnd = new Date(grant.vesting_end_date);
  const cliffDate = grant.vesting_cliff_date ? new Date(grant.vesting_cliff_date) : null;
  const totalShares = grant.shares || 0;
  
  // If date is before vesting start or no shares, return 0
  if (asOfDate < vestingStart || totalShares <= 0) {
    return 0;
  }
  
  // If date is after vesting end, return all shares
  if (asOfDate >= vestingEnd) {
    return totalShares;
  }
  
  // If cliff exists and date is before cliff, return 0
  if (cliffDate && asOfDate < cliffDate) {
    return 0;
  }
  
  // Calculate based on elapsed time
  const totalVestingDays = (vestingEnd - vestingStart) / (1000 * 60 * 60 * 24);
  const elapsedDays = (asOfDate - vestingStart) / (1000 * 60 * 60 * 24);
  
  // Handle cliff
  if (cliffDate && asOfDate >= cliffDate) {
    const cliffPercentage = grant.cliff_percentage || 0.25;
    const cliffShares = Math.floor(totalShares * cliffPercentage);
    const daysAfterCliff = (asOfDate - cliffDate) / (1000 * 60 * 60 * 24);
    const remainingShares = totalShares - cliffShares;
    const remainingDays = (vestingEnd - cliffDate) / (1000 * 60 * 60 * 24);
    
    const additionalVested = Math.floor((daysAfterCliff / remainingDays) * remainingShares);
    return Math.min(cliffShares + additionalVested, totalShares);
  } else {
    // Simple linear vesting
    return Math.floor((elapsedDays / totalVestingDays) * totalShares);
  }
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
      nextShares: Math.floor(grant.shares * (grant.cliff_percentage || 0.25)),
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
  let nextDate;
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
      const cliffShares = Math.floor(grant.shares * (grant.cliff_percentage || 0.25));
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
    const cliffPercentage = grant.cliff_percentage || 0.25; // Allow custom cliff %
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
 * Generate key vesting milestones (25%, 50%, 75%, 100%)
 * @param {Object} grant - The equity grant
 * @param {Array} vestingSchedule - The detailed vesting schedule
 * @returns {Array} Key vesting milestone events
 */
function generateMilestones(grant, vestingSchedule) {
  if (!vestingSchedule || vestingSchedule.length === 0) return [];
  
  const totalShares = grant.shares || 0;
  if (totalShares <= 0) return [];
  
  const milestones = [];
  const milestonePercentages = [25, 50, 75, 100];
  
  // Find the date when each milestone percentage is reached
  milestonePercentages.forEach(percentage => {
    const targetShares = Math.floor(totalShares * (percentage / 100));
    
    // Find the first schedule entry that reaches this milestone
    for (let i = 0; i < vestingSchedule.length; i++) {
      if (vestingSchedule[i].shares >= targetShares) {
        // We found the entry that reaches/exceeds this milestone
        milestones.push({
          date: vestingSchedule[i].date,
          percentage,
          shares: targetShares,
          event: percentage === 100 ? "Final Vesting" : `${percentage}% Milestone`,
          value: targetShares * (grant.current_fmv || 0),
        });
        break;
      }
    }
  });
  
  return milestones;
}

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

  // Add milestone events if they're in our time range
  if (detailedVesting.milestones && detailedVesting.milestones.length > 0) {
    detailedVesting.milestones.forEach(milestone => {
      if (milestone.date > now && milestone.date <= futureDate) {
        // Check if this milestone is already in events by date matching
        const existingEventIndex = events.findIndex(
          event => event.date.getTime() === milestone.date.getTime()
        );
        
        if (existingEventIndex >= 0) {
          // Update existing event with milestone info
          events[existingEventIndex].event = milestone.event;
          events[existingEventIndex].isMilestone = true;
          events[existingEventIndex].percentage = milestone.percentage;
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

/**
 * Handle M&A acceleration scenario
 * @param {Object} grant - The equity grant
 * @param {Object} mnaEvent - Details about the M&A event
 * @param {boolean} doubleTrigger - Whether this is a double-trigger acceleration
 * @returns {Object} Vesting implications after M&A event
 */
export function handleMnAAcceleration(grant, mnaEvent, doubleTrigger = false) {
  // Calculate normal vesting as of M&A event
  const normalVesting = calculateDetailedVesting(
    grant,
    new Date(mnaEvent.date)
  );
  
  // If double-trigger, check if termination happened within window
  let accelerationApplies = !doubleTrigger; // Single trigger always applies
  
  if (doubleTrigger && mnaEvent.terminationDate) {
    // Check if termination is within the double-trigger window (typically 3-12 months)
    const terminationDate = new Date(mnaEvent.terminationDate);
    const eventDate = new Date(mnaEvent.date);
    const windowDays = mnaEvent.windowDays || 90; // Default 90-day window
    
    const daysBetween = (terminationDate - eventDate) / (1000 * 60 * 60 * 24);
    accelerationApplies = daysBetween >= 0 && daysBetween <= windowDays;
  }
  
  // If acceleration doesn't apply, return normal vesting
  if (!accelerationApplies) {
    return {
      applicable: false,
      message: doubleTrigger ? "Double-trigger conditions not met" : "Acceleration not applicable",
      normalVestedShares: normalVesting.vestedShares,
      normalUnvestedShares: normalVesting.unvestedShares,
      acceleratedShares: 0,
      totalVestedShares: normalVesting.vestedShares,
      totalVestedValue: normalVesting.vestedShares * mnaEvent.sharePrice,
    };
  }
  
  // Determine acceleration percentage (typically 50% or 100%)
  const accelerationPercentage = mnaEvent.accelerationPercentage || 100;
  
  // Calculate how many additional shares vest due to acceleration
  const acceleratedShares = Math.floor(
    normalVesting.unvestedShares * (accelerationPercentage / 100)
  );
  
  return {
    applicable: true,
    normalVestedShares: normalVesting.vestedShares,
    normalUnvestedShares: normalVesting.unvestedShares,
    acceleratedShares,
    totalVestedShares: normalVesting.vestedShares + acceleratedShares,
    totalVestedValue: (normalVesting.vestedShares + acceleratedShares) * mnaEvent.sharePrice,
    accelerationType: doubleTrigger ? "Double-Trigger" : "Single-Trigger",
    accelerationPercentage
  };
}