// src/hooks/useCalculator.js
import { useState, useCallback } from "react";
import { calculateComprehensiveTax } from "@/utils/enhancedTaxCalculations";

export function useCalculator() {
  const [calculationResults, setCalculationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateTax = useCallback(
    (grant, exercisePrice, exitPrice, shares, taxSettings) => {
      setIsLoading(true);
      try {
        const results = calculateComprehensiveTax(
          grant,
          exercisePrice,
          exitPrice,
          shares,
          taxSettings
        );
        setCalculationResults(results);
        return results;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    calculationResults,
    calculateTax,
    isLoading,
  };
}
