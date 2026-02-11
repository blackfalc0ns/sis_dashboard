// FILE: src/components/leads/CreateLeadModal.tsx

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LeadChannel, LeadStatus } from "@/types/leads";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    email?: string;
    channel: LeadChannel;
    status: LeadStatus;
    owner: string;
    gradeInterest?: string;
    source?: string;
    notes?: string;
  }) => void;
}

export default function CreateLeadModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    channel: "In-app" as LeadChannel,
    status: "New" as LeadStatus,
    owner: "Sara Ahmed",
    gradeInterest: "",
    source: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      email: formData.email || undefined,
      gradeInterest: formData.gradeInterest || undefined,
      source: formData.source || undefined,
      notes: formData.notes || undefined,
    });
    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      channel: "In-app",
      status: "New",
      owner: "Sara Ahmed",
      gradeInterest: "",
      source: "",
      notes: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                placeholder="Enter lead name"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  placeholder="050-XXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Channel & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      channel: e.target.value as LeadChannel,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                >
                  <option value="In-app">In-app</option>
                  <option value="Referral">Referral</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as LeadStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                </select>
              </div>
            </div>

            {/* Owner & Grade Interest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.owner}
                  onChange={(e) =>
                    setFormData({ ...formData, owner: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                >
                  <option value="Sara Ahmed">Sara Ahmed</option>
                  <option value="Mohammed Khalil">Mohammed Khalil</option>
                  <option value="Fatima Hassan">Fatima Hassan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Interest
                </label>
                <input
                  type="text"
                  value={formData.gradeInterest}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeInterest: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  placeholder="e.g., Grade 5"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                placeholder="e.g., Website Form, Facebook Ad"
              />
            </div>

            {/* Notes */}
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none"
                placeholder="Additional information..."
              />
            </div>
          </div>
        </form>

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
            className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create Lead
          </button>
        </div>
      </div>
    </div>
  );
}
