// FILE: src/components/students-guardians/modals/AddNoteModal.tsx

"use client";

import { useState } from "react";
import { XCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { NoteCategory, NoteVisibility } from "@/types/students/note";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: NoteFormData) => void;
  studentId: string;
  studentName: string;
}

export interface NoteFormData {
  category: NoteCategory;
  note: string;
  visibility: NoteVisibility;
  created_by: string;
}

export default function AddNoteModal({
  isOpen,
  onClose,
  onSubmit,
  studentId,
  studentName,
}: AddNoteModalProps) {
  const [formData, setFormData] = useState<NoteFormData>({
    category: "general",
    note: "",
    visibility: "internal",
    created_by: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      category: "general",
      note: "",
      visibility: "internal",
      created_by: "",
    });
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add Note</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                For student: {studentName}
              </p>
            </div>
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
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as NoteCategory,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="medical">Medical</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the category that best describes this note
              </p>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                rows={6}
                placeholder="Enter your note here..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.note.length} characters
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Visibility <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    value="internal"
                    checked={formData.visibility === "internal"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibility: e.target.value as NoteVisibility,
                      })
                    }
                    className="mt-0.5 w-4 h-4 text-[#036b80] border-gray-300 focus:ring-[#036b80]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <EyeOff className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Internal Only
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Only visible to school staff and administrators
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    value="visible_to_guardian"
                    checked={formData.visibility === "visible_to_guardian"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibility: e.target.value as NoteVisibility,
                      })
                    }
                    className="mt-0.5 w-4 h-4 text-[#036b80] border-gray-300 focus:ring-[#036b80]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Visible to Guardian
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Guardians will be able to see this note
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Created By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.created_by}
                onChange={(e) =>
                  setFormData({ ...formData, created_by: e.target.value })
                }
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your name will be recorded as the note creator
              </p>
            </div>

            {/* Info Alert */}
            {formData.visibility === "visible_to_guardian" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      Guardian Visibility
                    </p>
                    <p className="text-xs text-blue-700">
                      This note will be visible to the student&apos;s guardians.
                      Please ensure the content is appropriate and professional.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              Add Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
