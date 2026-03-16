// FILE: src/components/admissions/AdmissionsExportModal.tsx

"use client";

import { useState } from "react";
import { X, Download, FileText, BarChart3, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdmissionsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateRange?: {
    value: string;
    customStart?: string;
    customEnd?: string;
  };
}

type ExportType = "data" | "analytics";
type ExportFormat = "csv" | "json";

export default function AdmissionsExportModal({
  isOpen,
  onClose,
  currentDateRange,
}: AdmissionsExportModalProps) {
  const t = useTranslations("admissions.export");
  const [exportType, setExportType] = useState<ExportType>("data");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([
    "leads",
    "applications",
  ]);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const datasetOptions = [
    { value: "leads", label: t("datasets.leads.label"), description: t("datasets.leads.description") },
    {
      value: "applications",
      label: t("datasets.applications.label"),
      description: t("datasets.applications.description"),
    },
    {
      value: "decisions",
      label: t("datasets.decisions.label"),
      description: t("datasets.decisions.description"),
    },
    {
      value: "enrollments",
      label: t("datasets.enrollments.label"),
      description: t("datasets.enrollments.description"),
    },
  ];

  const toggleDataset = (dataset: string) => {
    setSelectedDatasets((prev) =>
      prev.includes(dataset)
        ? prev.filter((d) => d !== dataset)
        : [...prev, dataset],
    );
  };

  const getDateRange = () => {
    if (!currentDateRange) {
      // Default to last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        daysBack: 30,
      };
    }

    if (currentDateRange.value === "custom") {
      return {
        startDate: currentDateRange.customStart || "",
        endDate: currentDateRange.customEnd || "",
        daysBack: undefined,
      };
    }

    if (currentDateRange.value === "all") {
      return {
        startDate: undefined,
        endDate: undefined,
        daysBack: 365,
      };
    }

    return {
      startDate: undefined,
      endDate: undefined,
      daysBack: parseInt(currentDateRange.value),
    };
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const dateRange = getDateRange();

      if (exportType === "data") {
        // Export raw data
        if (selectedDatasets.length === 0) {
          alert(t("errors.noDatasets"));
          setIsExporting(false);
          return;
        }

        const response = await fetch("/api/exports/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datasets: selectedDatasets,
            format,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t("errors.exportFailed"));
        }

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        a.download = filenameMatch
          ? filenameMatch[1]
          : `admissions-data.${format}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Export analytics
        const response = await fetch("/api/exports/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            daysBack: dateRange.daysBack,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t("errors.exportFailed"));
        }

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        a.download = filenameMatch
          ? filenameMatch[1]
          : `admissions-analytics.${format}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // Success
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Export error:", error);
      alert(
        error instanceof Error
          ? error.message
          : t("errors.exportFailedGeneric"),
      );
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-hover text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t("title")}</h2>
              <p className="text-sm text-white/80 mt-1">
                {t("subtitle")}
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
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("exportType.label")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType("data")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  exportType === "data"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className={`w-6 h-6 flex-shrink-0 ${
                      exportType === "data" ? "text-primary" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div
                      className={`font-semibold ${
                        exportType === "data" ? "text-primary" : "text-gray-700"
                      }`}
                    >
                      {t("exportType.data.title")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t("exportType.data.description")}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportType("analytics")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  exportType === "analytics"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <BarChart3
                    className={`w-6 h-6 flex-shrink-0 ${
                      exportType === "analytics"
                        ? "text-primary"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div
                      className={`font-semibold ${
                        exportType === "analytics"
                          ? "text-primary"
                          : "text-gray-700"
                      }`}
                    >
                      {t("exportType.analytics.title")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t("exportType.analytics.description")}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Dataset Selection (only for data export) */}
          {exportType === "data" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t("datasets.label")}
              </label>
              <div className="space-y-2">
                {datasetOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDatasets.includes(option.value)}
                      onChange={() => toggleDataset(option.value)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("format.label")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat("csv")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  format === "csv"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`font-semibold ${
                    format === "csv" ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {t("format.csv.title")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t("format.csv.description")}
                </div>
              </button>

              <button
                onClick={() => setFormat("json")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  format === "json"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`font-semibold ${
                    format === "json" ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {t("format.json.title")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t("format.json.description")}
                </div>
              </button>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">
                  {t("dateRange.title")}
                </h4>
                <p className="text-xs text-blue-800 mt-1">
                  {currentDateRange?.value === "custom"
                    ? t("dateRange.custom", {
                        start: currentDateRange.customStart ?? "",
                        end: currentDateRange.customEnd ?? "",
                      })
                    : currentDateRange?.value === "all"
                      ? t("dateRange.allTime")
                      : t("dateRange.lastDays", {
                          days: currentDateRange?.value || "30",
                        })}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {t("dateRange.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              {t("actions.cancel")}
            </button>
            <button
              onClick={handleExport}
              disabled={
                isExporting ||
                (exportType === "data" && selectedDatasets.length === 0)
              }
              className="flex-1 px-6 py-3 bg-primary hover:bg-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("actions.exporting")}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {exportType === "data" ? t("actions.exportData") : t("actions.exportAnalytics")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
