// src/components/scenario/ScenarioExportDialog.jsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DownloadIcon,
  FileTextIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { ScenarioExportService } from "@/utils/exportService";
import { toast } from "sonner";

/**
 * Dialog component for exporting scenario data with various options
 */
export function ScenarioExportDialog({
  scenarios,
  timelineData,
  trigger,
  onExportComplete,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [filename, setFilename] = useState("");
  const [includeProjections, setIncludeProjections] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);

  // Get formatted date for default filename
  const getDefaultFilename = () => {
    const date = new Date().toISOString().split("T")[0];
    return `scenario-comparison-${date}`;
  };

  // Handle export action
  const handleExport = async () => {
    setLoading(true);

    try {
      // Setup export options
      const options = {
        filename: filename || getDefaultFilename() + getFileExtension(),
        includeProjections,
        includeMetrics,
      };

      // Add timeline data if including projections
      if (includeProjections && timelineData) {
        options.timelineData = timelineData;
      }

      // Perform export based on selected format
      switch (exportFormat) {
        case "csv":
          await ScenarioExportService.exportAsCSV(scenarios, options);
          break;
        case "json":
          await ScenarioExportService.exportAsJSON(scenarios, options);
          break;
        case "excel":
          // This would use the Excel export method when implemented
          toast.error("Excel export is not yet implemented");
          return;
        case "pdf":
          // This would use the PDF export method when implemented
          toast.error("PDF export is not yet implemented");
          return;
        default:
          await ScenarioExportService.exportAsCSV(scenarios, options);
      }

      // Show success message
      toast.success(
        `Scenarios exported successfully as ${exportFormat.toUpperCase()}`
      );

      // Close dialog and notify parent component
      setOpen(false);
      if (onExportComplete) {
        onExportComplete(exportFormat);
      }
    } catch (error) {
      toast.error(`Failed to export: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get file extension based on format
  const getFileExtension = () => {
    switch (exportFormat) {
      case "csv":
        return ".csv";
      case "json":
        return ".json";
      case "excel":
        return ".xlsx";
      case "pdf":
        return ".pdf";
      default:
        return ".csv";
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen) => {
    if (newOpen) {
      // Initialize with defaults when opening
      setExportFormat("csv");
      setFilename("");
      setIncludeProjections(true);
      setIncludeMetrics(true);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Scenario Comparison</DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={setExportFormat}
              className="grid grid-cols-2 gap-2"
            >
              <div
                className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer ${
                  exportFormat === "csv" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="csv" id="csv" />
                <Label
                  htmlFor="csv"
                  className="cursor-pointer flex items-center"
                >
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  CSV
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer ${
                  exportFormat === "json" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="json" id="json" />
                <Label
                  htmlFor="json"
                  className="cursor-pointer flex items-center"
                >
                  <FileJsonIcon className="h-4 w-4 mr-2" />
                  JSON
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer opacity-50 ${
                  exportFormat === "excel" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="excel" id="excel" disabled />
                <Label
                  htmlFor="excel"
                  className="cursor-pointer flex items-center"
                >
                  <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                  Excel
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer opacity-50 ${
                  exportFormat === "pdf" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="pdf" id="pdf" disabled />
                <Label
                  htmlFor="pdf"
                  className="cursor-pointer flex items-center"
                >
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  PDF
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">Filename (optional)</Label>
            <Input
              id="filename"
              placeholder={getDefaultFilename() + getFileExtension()}
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeProjections"
              checked={includeProjections}
              onCheckedChange={setIncludeProjections}
            />
            <Label htmlFor="includeProjections" className="cursor-pointer">
              Include future value projections
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeMetrics"
              checked={includeMetrics}
              onCheckedChange={setIncludeMetrics}
            />
            <Label htmlFor="includeMetrics" className="cursor-pointer">
              Include calculated metrics
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
