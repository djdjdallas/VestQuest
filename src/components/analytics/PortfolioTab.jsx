// src/components/analytics/PortfolioTab.jsx

import React from "react";
import GrantTypeChart from "./GrantTypeChart";
import CompanyValueChart from "./CompanyValueChart";
import PortfolioHistoryChart from "./PortfolioHistoryChart";

/**
 * Portfolio Analysis tab content
 * @param {Object} analytics - Analytics data object
 */
export const PortfolioTab = ({ analytics }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <GrantTypeChart data={analytics.valueByGrantType} />
      <CompanyValueChart data={analytics.valueByCompany} />
      <PortfolioHistoryChart
        data={analytics.portfolioHistory}
        className="md:col-span-2"
      />
    </div>
  );
};

export default PortfolioTab;
