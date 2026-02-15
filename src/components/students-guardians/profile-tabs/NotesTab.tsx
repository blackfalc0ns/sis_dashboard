// FILE: src/components/students-guardians/profile-tabs/NotesTab.tsx

"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, Edit2, Trash2, Filter } from "lucide-react";
import { Student } from "@/types/students";
import DataTable from "@/components/ui/common/DataTable";
import { getStudentNotes } from "@/services/studentsService";
import { getStudentDisplayName } from "@/utils/studentUtils";
import AddNoteModal, {
  NoteFormData,
} from "@/components/students-guardians/modals/AddNoteModal";
import { useTranslations } from "next-intl";

interface NotesTabProps {
  student: Student;
}

export default function NotesTab({ student }: NotesTabProps) {
  const t = useTranslations("students_guardians.profile.notes");
  const notes = getStudentNotes(student.student_id || "");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddNote = (noteData: NoteFormData) => {
    // TODO: Implement API call to add note
    console.log("Adding note:", noteData);

    // Close modal
    setShowAddModal(false);

    // Show success message (you can add a toast notification here)
    alert("Note added successfully!");
  };

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
        {t(category as any)}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    if (visibility === "visible_to_guardian") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <Eye className="w-3 h-3" />
          {t("visible")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
        <EyeOff className="w-3 h-3" />
        {t("internal")}
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
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "category",
      label: t("category"),
      render: (value: unknown) => getCategoryBadge(value as string),
    },
    {
      key: "note",
      label: t("note"),
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
      label: t("visibility"),
      render: (value: unknown) => getVisibilityBadge(value as string),
    },
    {
      key: "created_by",
      label: t("created_by"),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: () => (
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title={t("edit")}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title={t("delete")}
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
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
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
            {t("filters")}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("add_note")}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("category")}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_categories")}</option>
                <option value="academic">{t("academic")}</option>
                <option value="behavioral">{t("behavioral")}</option>
                <option value="medical">{t("medical")}</option>
                <option value="general">{t("general")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("visibility")}
              </label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_notes")}</option>
                <option value="visible_to_guardian">
                  {t("visible_to_guardian")}
                </option>
                <option value="internal">{t("internal")}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{t("total_notes")}</p>
          <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{t("academic")}</p>
          <p className="text-2xl font-bold text-blue-600">
            {notes.filter((n) => n.category === "academic").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{t("behavioral")}</p>
          <p className="text-2xl font-bold text-purple-600">
            {notes.filter((n) => n.category === "behavioral").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">
            {t("visible_to_guardian")}
          </p>
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
              <p className="text-gray-500">{t("no_match")}</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredNotes as unknown as Record<string, unknown>[]}
              showPagination={true}
              itemsPerPage={10}
            />
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNote}
        studentId={student.id}
        studentName={getStudentDisplayName(student)}
      />
    </div>
  );
}
