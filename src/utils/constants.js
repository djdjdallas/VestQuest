export const GRANT_TYPES = {
  ISO: 'ISO',
  NSO: 'NSO',
  RSU: 'RSU',
};

export const VESTING_SCHEDULES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
};

export const TAX_RATES = {
  FEDERAL_LONG_TERM: 0.20,
  FEDERAL_SHORT_TERM: 0.37,
  STATE_CA: 0.13,
};

export const COMMON_SCENARIOS = [
  { name: 'IPO - Conservative', multiplier: 10 },
  { name: 'IPO - Moderate', multiplier: 25 },
  { name: 'IPO - Optimistic', multiplier: 50 },
  { name: 'Acquisition - Conservative', multiplier: 5 },
  { name: 'Acquisition - Moderate', multiplier: 15 },
  { name: 'Acquisition - Optimistic', multiplier: 30 },
];
