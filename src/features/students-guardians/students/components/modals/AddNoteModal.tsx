"use client";

import { useState } from "react";
import { XCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  NoteCategory,
  NoteVisibility,
} from "@/features/students-guardians/students/types/note";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: NoteFormData) => void;
  studentName: string;
}

export interface NoteFormData {
  category: NoteCategory;
  note: string;
  xpAdjustment: number | "";
  visibility: NoteVisibility;
  created_by: string;
}

export default function AddNoteModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
}: AddNoteModalProps) {
  const t = useTranslations("students_guardians.profile.notes");
  const [formData, setFormData] = useState<NoteFormData>({
    category: "general",
    note: "",
    xpAdjustment: "",
    visibility: "internal",
    created_by: "",
  });
  const [xpError, setXpError] = useState<string | null>(null);

  const validateXpAdjustment = (value: number | "") => {
    if (value === "") return t("xp_required");
    if (!Number.isInteger(value)) return t("xp_invalid_integer");
    if (value < -50 || value > 50) return t("xp_out_of_range");
    if (value === 0) return t("xp_non_zero");
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextXpError = validateXpAdjustment(formData.xpAdjustment);
    if (nextXpError) {
      setXpError(nextXpError);
      return;
    }

    setXpError(null);
    onSubmit(formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      category: "general",
      note: "",
      xpAdjustment: "",
      visibility: "internal",
      created_by: "",
    });
    setXpError(null);
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{t("add_note")}</h3>
              <p className="mt-0.5 text-sm text-gray-500">
                {t("note_for_student", { studentName })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("category")} <span className="text-red-500">*</span>
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
              >
                <option value="general">{t("general")}</option>
                <option value="academic">{t("academic")}</option>
                <option value="behavioral">{t("behavioral")}</option>
                <option value="medical">{t("medical")}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{t("category_help")}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("note")} <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                rows={6}
                placeholder={t("note_placeholder")}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("characters", { count: formData.note.length })}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("xp_adjustment")} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={-50}
                max={50}
                step={1}
                value={formData.xpAdjustment}
                onChange={(e) => {
                  const nextValue =
                    e.target.value === "" ? "" : Number(e.target.value);
                  setFormData({ ...formData, xpAdjustment: nextValue });
                  setXpError(validateXpAdjustment(nextValue));
                }}
                placeholder={t("xp_placeholder")}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary ${
                  xpError ? "border-red-300" : "border-gray-300"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">{t("xp_help")}</p>
              {xpError ? (
                <p className="mt-1 text-xs text-red-600">{xpError}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                {t("visibility")} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
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
                    className="mt-0.5 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {t("internal")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{t("internal_help")}</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
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
                    className="mt-0.5 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {t("visible_to_guardian")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("visible_to_guardian_help")}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("your_name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.created_by}
                onChange={(e) =>
                  setFormData({ ...formData, created_by: e.target.value })
                }
                placeholder={t("your_name_placeholder")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-500">{t("creator_help")}</p>
            </div>

            {formData.visibility === "visible_to_guardian" ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="mb-1 text-sm font-medium text-blue-900">
                      {t("guardian_visibility_title")}
                    </p>
                    <p className="text-xs text-blue-700">
                      {t("guardian_visibility_help")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hover"
            >
              {t("add_note")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
