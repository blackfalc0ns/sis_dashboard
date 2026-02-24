// FILE: src/components/ui/button/ExportButton.tsx

"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import Button from "./Button";

export interface ExportButtonProps {
  onExport: (format: "csv" | "excel") => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Reusable Export Button with format selection dropdown
 * Integrates with existing export utilities
 */
export default function ExportButton({
  onExport,
  disabled = false,
  label = "Export",
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: "csv" | "excel") => {
    setShowMenu(false);
    onExport(format);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        variant="secondary"
        leftIcon={<Download className="w-4 h-4" />}
      >
        {label}
      </Button>

      {showMenu && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => handleExport("excel")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Export as Excel</span>
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Export as CSV</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
