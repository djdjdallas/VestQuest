// src/utils/exportService.js
import { saveAs } from "file-saver";

/**
 * Service for exporting scenario data in various formats
 */
export class ScenarioExportService {
  /**
   * Export scenarios comparison as CSV file
   * @param {Array} scenarios - Array of scenario objects
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static exportAsCSV(scenarios, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Default filename format: scenario-comparison-YYYY-MM-DD.csv
        const filename =
          options.filename ||
          `scenario-comparison-${new Date().toISOString().split("T")[0]}.csv`;

        // Generate CSV content
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add header row - customize based on included fields
        const headers = [
          "Scenario Name",
          "Exit Type",
          "Exit Value",
          "Shares Included",
          "Gross Proceeds",
          "Exercise Cost",
          "Tax Liability",
          "Net Proceeds",
          "ROI (%)",
          "Effective Tax Rate (%)",
        ];

        csvContent += headers.join(",") + "\n";

        // Add data rows
        scenarios.forEach((scenario) => {
          // Calculate metrics if needed
          const effectiveTaxRate = scenario.gross_proceeds
            ? (scenario.tax_liability / scenario.gross_proceeds) * 100
            : 0;

          const rowData = [
            `"${scenario.scenario_name || "Unnamed"}"`,
            `"${scenario.exit_type || "Custom"}"`,
            scenario.exit_value || 0,
            scenario.shares_included || 0,
            scenario.gross_proceeds || 0,
            scenario.exercise_cost || 0,
            scenario.tax_liability || 0,
            scenario.net_proceeds || 0,
            (scenario.roi_percentage || 0).toFixed(1),
            effectiveTaxRate.toFixed(1),
          ];

          csvContent += rowData.join(",") + "\n";
        });

        // Create blob and trigger download
        const encodedUri = encodeURI(csvContent);
        const blob = new Blob([decodeURIComponent(encodedUri.split(",")[1])], {
          type: "text/csv;charset=utf-8;",
        });

        saveAs(blob, filename);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export scenarios as JSON file with detailed data
   * @param {Array} scenarios - Array of scenario objects
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static exportAsJSON(scenarios, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Default filename
        const filename =
          options.filename ||
          `scenario-detailed-report-${
            new Date().toISOString().split("T")[0]
          }.json`;

        // Generate a comprehensive report object
        const report = {
          metadata: {
            generatedAt: new Date().toISOString(),
            title: "Equity Scenario Comparison",
            scenarioCount: scenarios.length,
            exportVersion: "1.0",
          },
          scenarios: scenarios.map((scenario) => {
            // Calculate any needed metrics
            const costBasis = scenario.shares_included
              ? scenario.exercise_cost / scenario.shares_included
              : 0;

            const effectiveTaxRate = scenario.gross_proceeds
              ? (scenario.tax_liability / scenario.gross_proceeds) * 100
              : 0;

            const netValuePerShare = scenario.shares_included
              ? scenario.net_proceeds / scenario.shares_included
              : 0;

            // Create a comprehensive scenario object
            return {
              id: scenario.id,
              name: scenario.scenario_name,
              description: scenario.description,
              exitType: scenario.exit_type,
              exitDate: scenario.exit_date,
              sharePrice: scenario.exit_value,
              sharesIncluded: scenario.shares_included,
              financials: {
                grossProceeds: scenario.gross_proceeds,
                exerciseCost: scenario.exercise_cost,
                taxLiability: scenario.tax_liability,
                netProceeds: scenario.net_proceeds,
              },
              metrics: {
                roi: scenario.roi_percentage,
                effectiveTaxRate: effectiveTaxRate,
                costBasis: costBasis,
                netValuePerShare: netValuePerShare,
                profitPerShare: netValuePerShare - costBasis,
              },
              created: scenario.created_at,
              updated: scenario.updated_at,
            };
          }),
        };

        // Add projections data if provided
        if (options.timelineData) {
          report.projections = options.timelineData;
        }

        // Convert to JSON string with formatting
        const jsonString = JSON.stringify(report, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: "application/json" });
        saveAs(blob, filename);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export scenarios as PDF document (would need a PDF library)
   * @param {Array} scenarios - Array of scenario objects
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static exportAsPDF(scenarios, options = {}) {
    // This would require a PDF generation library like jsPDF
    // Implementation would depend on the chosen library
    return Promise.reject(new Error("PDF export not implemented yet"));
  }

  /**
   * Export as Excel file (would need a spreadsheet library)
   * @param {Array} scenarios - Array of scenario objects
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static exportAsExcel(scenarios, options = {}) {
    // This would require a library like SheetJS/xlsx
    // Implementation would depend on the chosen library
    return Promise.reject(new Error("Excel export not implemented yet"));
  }
}
