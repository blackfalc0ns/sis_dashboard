// FILE: src/components/leads/ImportLeadsModal.tsx

"use client";

import { useState } from "react";
import { X, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

export default function ImportLeadsModal({
  isOpen,
  onClose,
  onSubmit,
}: ImportLeadsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
      setSelectedFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Import Leads</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">File Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Supported formats: CSV, Excel (.xlsx, .xls)</li>
                  <li>Required columns: Name, Phone, Channel, Status, Owner</li>
                  <li>
                    Optional columns: Email, Grade Interest, Source, Notes
                  </li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-[#036b80] bg-teal-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {selectedFile ? (
                <>
                  <FileSpreadsheet className="w-12 h-12 text-[#036b80] mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedFile(null);
                    }}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    CSV or Excel files up to 5MB
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Template Download */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don't have a file ready?
            </p>
            <button
              type="button"
              className="text-sm text-[#036b80] hover:text-[#024d5c] font-medium underline"
            >
              Download CSV Template
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Leads
          </button>
        </div>
      </div>
    </div>
  );
}
