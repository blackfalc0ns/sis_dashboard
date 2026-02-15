// FILE: src/components/students-guardians/modals/UploadDocumentModal.tsx

"use client";

import { useState, useRef } from "react";
import { XCircle, Upload, FileText, AlertCircle } from "lucide-react";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documentData: DocumentUploadData) => void;
  studentId: string;
}

export interface DocumentUploadData {
  type: string;
  file: File;
  notes?: string;
}

const DOCUMENT_TYPES = [
  "Birth Certificate",
  "National ID",
  "Passport",
  "Medical Records",
  "Vaccination Card",
  "Previous School Records",
  "Photo",
  "Other",
];

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  studentId,
}: UploadDocumentModalProps) {
  const [formData, setFormData] = useState({
    type: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }
    if (!formData.type) {
      alert("Please select a document type");
      return;
    }

    onSubmit({
      type: formData.type,
      file: selectedFile,
      notes: formData.notes || undefined,
    });
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      type: "",
      notes: "",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-[#036b80] bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                {!selectedFile ? (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Drop your file here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#036b80] hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-[#036b80]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Add any additional notes about this document..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none"
              />
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Document Upload Guidelines
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Ensure the document is clear and readable</li>
                    <li>• File size should not exceed 10MB</li>
                    <li>• Accepted formats: PDF, DOC, DOCX, JPG, PNG</li>
                    <li>• Documents will be reviewed by administration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
