// FILE: src/components/students-guardians/profile-tabs/NotesTab.tsx

"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, Edit2, Trash2, Filter } from "lucide-react";
import { Student } from "@/types/students";
import DataTable from "@/components/ui/common/DataTable";

interface NotesTabProps {
  student: Student;
}

// Mock notes data
const mockNotes = [
  {
    id: "1",
    date: "2024-02-10",
    category: "academic",
    note: "Excellent progress in mathematics. Shows strong problem-solving skills.",
    visibility: "visible_to_guardian",
    created_by: "Mr. Ahmed Hassan",
  },
  {
    id: "2",
    date: "2024-02-08",
    category: "behavioral",
    note: "Student was very helpful to classmates during group project.",
    visibility: "visible_to_guardian",
    created_by: "Ms. Fatima Ali",
  },
  {
    id: "3",
    date: "2024-02-05",
    category: "general",
    note: "Parent meeting scheduled for next week to discuss progress.",
    visibility: "internal",
    created_by: "Mr. Hassan Omar",
  },
  {
    id: "4",
    date: "2024-02-01",
    category: "medical",
    note: "Student used inhaler during PE class. No issues reported.",
    visibility: "internal",
    created_by: "Nurse Sarah",
  },
  {
    id: "5",
    date: "2024-01-28",
    category: "academic",
    note: "Needs additional support in English writing assignments.",
    visibility: "visible_to_guardian",
    created_by: "Ms. Layla Mahmoud",
  },
];

export default function NotesTab({ student }: NotesTabProps) {
  const [notes] = useState(mockNotes);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      academic: "bg-blue-100 text-blue-700",
      behavioral: "bg-purple-100 text-purple-700",
      medical: "bg-red-100 text-red-700",
      general: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[category]}`}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    if (visibility === "visible_to_guardian") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <Eye className="w-3 h-3" />
          Visible
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
        <EyeOff className="w-3 h-3" />
        Internal
      </span>
    );
  };

  const filteredNotes = notes.filter((note) => {
    const matchesCategory =
      categoryFilter === "all" || note.category === categoryFilter;
    const matchesVisibility =
      visibilityFilter === "all" || note.visibility === visibilityFilter;
    return matchesCategory && matchesVisibility;
  });

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "category",
      label: "Category",
      render: (value: unknown) => getCategoryBadge(value as string),
    },
    {
      key: "note",
      label: "Note",
      render: (value: unknown) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-2">
            {value as string}
          </p>
        </div>
      ),
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (value: unknown) => getVisibilityBadge(value as string),
    },
    {
      key: "created_by",
      label: "Created By",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: () => (
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Notes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track observations and important information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? "bg-[#036b80] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="medical">Medical</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">All Notes</option>
                <option value="visible_to_guardian">Visible to Guardian</option>
                <option value="internal">Internal Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Total Notes</p>
          <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Academic</p>
          <p className="text-2xl font-bold text-blue-600">
            {notes.filter((n) => n.category === "academic").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Behavioral</p>
          <p className="text-2xl font-bold text-purple-600">
            {notes.filter((n) => n.category === "behavioral").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Visible to Guardian</p>
          <p className="text-2xl font-bold text-green-600">
            {notes.filter((n) => n.visibility === "visible_to_guardian").length}
          </p>
        </div>
      </div>

      {/* Notes Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No notes match your filters</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredNotes}
              showPagination={true}
              itemsPerPage={10}
            />
          )}
        </div>
      </div>
    </div>
  );
}
