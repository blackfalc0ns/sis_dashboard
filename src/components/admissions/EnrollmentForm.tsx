// FILE: src/components/admissions/EnrollmentForm.tsx

"use client";

import React, { useState } from "react";
import { X, FileText, Download } from "lucide-react";
import { Application } from "@/types/admissions";

interface EnrollmentFormProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function EnrollmentForm({
  application,
  isOpen,
  onClose,
  onSubmit,
}: EnrollmentFormProps) {
  const [formData, setFormData] = useState({
    academicYear: "2024-2025",
    grade: application.gradeRequested,
    section: "",
    startDate: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGenerateAcceptance = () => {
    alert("Acceptance letter generated successfully!");
  };

  const handleGenerateContract = () => {
    alert("Initial contract generated successfully!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Enrollment Setup
            </h2>
            <p className="text-sm text-gray-500">
              {application.studentName} - {application.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                Application Accepted
              </p>
            </div>
            <p className="text-sm text-emerald-700">
              This student has been accepted and is ready for enrollment.
            </p>
          </div>

          {/* Enrollment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade *
              </label>
              <select
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <option key={grade} value={`Grade ${grade}`}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section *
              </label>
              <select
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                <option value="">Select section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              />
            </div>
          </div>

          {/* Document Generation */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Generate Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGenerateAcceptance}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generate Acceptance Letter
              </button>
              <button
                type="button"
                onClick={handleGenerateContract}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Generate Initial Contract
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
