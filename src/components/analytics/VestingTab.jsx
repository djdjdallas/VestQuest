// src/components/analytics/VestingTab.jsx

import React from "react";
import VestingForecastChart from "./VestingForecastChart";
import VestingValueChart from "./VestingValueChart";
import CumulativeVestingChart from "./CumulativeVestingChart";

/**
 * Vesting Forecast tab content
 * @param {Object} analytics - Analytics data object
 * @param {Array} grants - Equity grants
 */
export const VestingTab = ({ analytics, grants }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <VestingForecastChart data={analytics.vestingForecast} grants={grants} />
      <VestingValueChart data={analytics.valueForecast} grants={grants} />
      <CumulativeVestingChart
        forecastData={analytics.vestingForecast}
        vestedShares={analytics.vestedShares}
        valueForecast={analytics.valueForecast}
      />
    </div>
  );
};

export default VestingTab;
