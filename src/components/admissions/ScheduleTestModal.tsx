// FILE: src/components/admissions/ScheduleTestModal.tsx

"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface ScheduleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  studentName: string;
}

export default function ScheduleTestModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
}: ScheduleTestModalProps) {
  const [formData, setFormData] = useState({
    type: "Placement Test",
    subject: "",
    date: "",
    time: "",
    duration: "60",
    location: "",
    proctor: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Schedule Placement Test
            </h2>
            <p className="text-sm text-gray-500">Student: {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                <option value="Placement Test">Placement Test</option>
                <option value="Aptitude Test">Aptitude Test</option>
                <option value="Language Test">Language Test</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                <option value="">Select subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
                <option value="Science">Science</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                placeholder="Room 101"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Droctor
              </label>
              <input
                type="text"
                value={formData.proctor}
                onChange={(e) =>
                  setFormData({ ...formData, proctor: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                placeholder="Teacher name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm resize-none"
              placeholder="Additional notes..."
            />
          </div>

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
              className="px-6 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
            >
              Schedule Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
