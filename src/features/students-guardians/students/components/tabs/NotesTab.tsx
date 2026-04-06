"use client";

import { useMemo, useState } from "react";
import { Plus, Eye, EyeOff, Edit2, Trash2 } from "lucide-react";
import { Student } from "@/features/students-guardians/students/types";
import { DataTable, FilterPanel } from "@/components/ui";
import {
  addStudentNote,
  getStudentNotes,
  getStudentXpSummary,
} from "@/features/students-guardians/students/services/studentsService";
import { getStudentDisplayName } from "@/features/students-guardians/students/utils/studentUtils";
import AddNoteModal, {
  NoteFormData,
} from "@/features/students-guardians/students/components/modals/AddNoteModal";
import { useTranslations } from "next-intl";

interface NotesTabProps {
  student: Student;
}

export default function NotesTab({ student }: NotesTabProps) {
  const t = useTranslations("students_guardians.profile.notes");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notesRevision, setNotesRevision] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const notes = useMemo(
    () => getStudentNotes(student.id),
    [notesRevision, student.id],
  );
  const xpSummary = useMemo(
    () => getStudentXpSummary(student.id),
    [notesRevision, student.id],
  );

  const handleAddNote = (noteData: NoteFormData) => {
    addStudentNote(student.id, {
      category: noteData.category,
      note: noteData.note,
      xpAdjustment: noteData.xpAdjustment as number,
      visibility: noteData.visibility,
      created_by: noteData.created_by,
    });

    setShowAddModal(false);
    setNotesRevision((current) => current + 1);
    setFeedback(t("note_added_successfully"));
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      academic: "bg-blue-100 text-blue-700",
      behavioral: "bg-purple-100 text-purple-700",
      medical: "bg-red-100 text-red-700",
      general: "bg-gray-100 text-gray-700",
    };

    const categoryKey = category as
      | "academic"
      | "behavioral"
      | "medical"
      | "general";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[category]}`}
      >
        {t(categoryKey)}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    if (visibility === "visible_to_guardian") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <Eye className="h-3 w-3" />
          {t("visible")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
        <EyeOff className="h-3 w-3" />
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
          <p className="line-clamp-2 text-sm text-gray-900">{value as string}</p>
        </div>
      ),
    },
    {
      key: "xpAdjustment",
      label: t("xp"),
      render: (value: unknown) => {
        const xp = value as number;
        const isPositive = xp > 0;
        return (
          <span
            className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {isPositive ? `+${xp}` : xp}
          </span>
        );
      },
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
            className="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
            title={t("edit")}
            disabled
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
            title={t("delete")}
            disabled
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {feedback ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hover"
        >
          <Plus className="h-4 w-4" />
          {t("add_note")}
        </button>
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="bg-transparent px-0 py-0 shadow-none"
        filtersSlot={
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("category")}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t("all_categories")}</option>
                <option value="academic">{t("academic")}</option>
                <option value="behavioral">{t("behavioral")}</option>
                <option value="medical">{t("medical")}</option>
                <option value="general">{t("general")}</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("visibility")}
              </label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t("all_notes")}</option>
                <option value="visible_to_guardian">
                  {t("visible_to_guardian")}
                </option>
                <option value="internal">{t("internal")}</option>
              </select>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-600">{t("total_notes")}</p>
          <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-600">{t("total_xp")}</p>
          <p className="text-2xl font-bold text-primary">{xpSummary.totalXp}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-600">{t("positive_notes")}</p>
          <p className="text-2xl font-bold text-green-600">
            {xpSummary.positiveNotesCount}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-600">{t("negative_notes")}</p>
          <p className="text-2xl font-bold text-red-600">
            {xpSummary.negativeNotesCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="p-6">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center">
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

      <AddNoteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNote}
        studentName={getStudentDisplayName(student)}
      />
    </div>
  );
}
