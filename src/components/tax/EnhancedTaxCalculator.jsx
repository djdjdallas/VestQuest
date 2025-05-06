import * as React from "react";
import { useCalculator } from "@/hooks/useCalculator";
import { TaxVisualization } from "@/components/tax/TaxVisualization";

const EnhancedTaxCalculator = () => {
  const [showDetails, setShowDetails] = React.useState(false);
  const { calculationResults, calculateTax, isLoading } = useCalculator();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tax Impact Analysis</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showDetails ? "Hide details" : "Show calculation details"}
        </button>
      </div>

      {showDetails && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium mb-2">How this is calculated</h4>
          <p className="text-sm text-gray-600 mb-4">
            Tax calculations include federal ordinary income tax, AMT
            calculations with proper exemptions and phase-outs, state tax with
            multi-state allocation, and capital gains considerations.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Federal Ordinary Income:</strong> Calculated using
              progressive tax brackets.
            </div>
            <div>
              <strong>AMT:</strong> Includes exemption phase-outs and multi-year
              credit tracking.
            </div>
            <div>
              <strong>State Tax:</strong> Uses proper allocation methodologies
              for multi-state scenarios.
            </div>
            <div>
              <strong>Capital Gains:</strong> Differentiates between short-term
              and long-term rates.
            </div>
          </div>
        </div>
      )}

      <TaxVisualization data={calculationResults} />
    </div>
  );
};

export default EnhancedTaxCalculator;
