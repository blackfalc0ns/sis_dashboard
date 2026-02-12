// FILE: src/components/students-guardians/profile-tabs/PersonalInfoTab.tsx

"use client";

import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import { Student } from "@/types/students";

interface PersonalInfoTabProps {
  student: Student;
}

export default function PersonalInfoTab({ student }: PersonalInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: student.name,
    date_of_birth: student.date_of_birth,
    grade: student.grade,
    section: student.section,
    status: student.status,
    enrollment_year: student.enrollment_year,
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: student.name,
      date_of_birth: student.date_of_birth,
      grade: student.grade,
      section: student.section,
      status: student.status,
      enrollment_year: student.enrollment_year,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Personal Information
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student ID
            </label>
            <input
              type="text"
              value={student.student_id}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <select
              value={formData.grade}
              onChange={(e) =>
                setFormData({ ...formData, grade: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <select
              value={formData.section}
              onChange={(e) =>
                setFormData({ ...formData, section: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Enrollment Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Year
            </label>
            <input
              type="number"
              value={formData.enrollment_year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  enrollment_year: parseInt(e.target.value),
                })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Created At
            </label>
            <input
              type="text"
              value={new Date(student.created_at).toLocaleString()}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
