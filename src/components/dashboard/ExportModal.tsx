// FILE: src/components/dashboard/ExportModal.tsx

"use client";

import { useState } from "react";
import { X, FileText, FileSpreadsheet, FileJson, Printer } from "lucide-react";
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
  generateDashboardSummary,
  generateAttendanceData,
  generateIncidentsData,
} from "@/utils/exportUtils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "csv" | "excel" | "json" | "pdf";
type ExportData = "summary" | "attendance" | "incidents" | "all";

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const [selectedData, setSelectedData] = useState<ExportData>("summary");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const formats = [
    {
      value: "excel" as const,
      label: "Excel (CSV)",
      icon: FileSpreadsheet,
      description: "Best for spreadsheet analysis",
    },
    {
      value: "csv" as const,
      label: "CSV",
      icon: FileText,
      description: "Universal format",
    },
    {
      value: "json" as const,
      label: "JSON",
      icon: FileJson,
      description: "For developers",
    },
    {
      value: "pdf" as const,
      label: "PDF",
      icon: Printer,
      description: "Print-ready report",
    },
  ];

  const dataOptions = [
    {
      value: "summary" as const,
      label: "Dashboard Summary",
      description: "KPIs and key metrics",
    },
    {
      value: "attendance" as const,
      label: "Attendance Data",
      description: "Detailed attendance by grade",
    },
    {
      value: "incidents" as const,
      label: "Incidents Report",
      description: "All incidents and violations",
    },
    {
      value: "all" as const,
      label: "Complete Report",
      description: "All data combined",
    },
  ];

  const handleExport = () => {
    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split("T")[0];

      if (selectedFormat === "pdf") {
        exportToPDF();
        onClose();
        return;
      }

      let data: unknown;
      let filename: string;

      switch (selectedData) {
        case "summary":
          data = [generateDashboardSummary()];
          filename = `dashboard-summary-${timestamp}`;
          break;
        case "attendance":
          data = generateAttendanceData();
          filename = `attendance-report-${timestamp}`;
          break;
        case "incidents":
          data = generateIncidentsData();
          filename = `incidents-report-${timestamp}`;
          break;
        case "all":
          data = {
            summary: generateDashboardSummary(),
            attendance: generateAttendanceData(),
            incidents: generateIncidentsData(),
          };
          filename = `complete-report-${timestamp}`;
          break;
      }

      switch (selectedFormat) {
        case "excel":
          if (Array.isArray(data)) {
            exportToExcel(data as Record<string, unknown>[], filename);
          } else {
            alert(
              "Excel export requires tabular data. Please select a specific data type.",
            );
            return;
          }
          break;
        case "csv":
          if (Array.isArray(data)) {
            exportToCSV(data as Record<string, unknown>[], filename);
          } else {
            alert(
              "CSV export requires tabular data. Please select a specific data type.",
            );
            return;
          }
          break;
        case "json":
          exportToJSON(data, filename);
          break;
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#036b80] to-[#024d5c] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Export Dashboard Data</h2>
              <p className="text-sm text-white/80 mt-1">
                Choose format and data to export
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedFormat === format.value
                        ? "border-[#036b80] bg-[#036b80]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-6 h-6 flex-shrink-0 ${
                          selectedFormat === format.value
                            ? "text-[#036b80]"
                            : "text-gray-400"
                        }`}
                      />
                      <div>
                        <div
                          className={`font-semibold ${
                            selectedFormat === format.value
                              ? "text-[#036b80]"
                              : "text-gray-700"
                          }`}
                        >
                          {format.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Data to Export
            </label>
            <div className="space-y-2">
              {dataOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedData(option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedData === option.value
                      ? "border-[#036b80] bg-[#036b80]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className={`font-semibold ${
                          selectedData === option.value
                            ? "text-[#036b80]"
                            : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedData === option.value
                          ? "border-[#036b80] bg-[#036b80]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedData === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Export Information
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                • Files will be downloaded to your default download folder
              </li>
              <li>• Filename includes current date for easy organization</li>
              <li>• Excel/CSV formats work best with tabular data</li>
              <li>• JSON format includes all nested data structures</li>
              <li>• PDF export uses your browser&apos;s print function</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-6 py-3 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
