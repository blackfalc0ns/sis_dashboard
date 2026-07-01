"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Input, Modal, Select, TextArea } from "@/components/ui";
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
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t("add_note")}
      description={t("note_for_student", { studentName })}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="add-note-form">
            {t("add_note")}
          </Button>
        </>
      }
    >
        <form id="add-note-form" onSubmit={handleSubmit}>
          <div className="space-y-6 pb-4">
              <Select
                label={t("category")}
                required
                value={formData.category}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as NoteCategory,
                  })
                }
                options={[
                  { value: "general", label: t("general") },
                  { value: "academic", label: t("academic") },
                  { value: "behavioral", label: t("behavioral") },
                  { value: "medical", label: t("medical") },
                ]}
              />
              <p className="mt-1 text-xs text-gray-500">{t("category_help")}</p>

              <TextArea
                label={t("note")}
                required
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                rows={6}
                placeholder={t("note_placeholder")}
                resize="none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("characters", { count: formData.note.length })}
              </p>

              <Input
                label={t("xp_adjustment")}
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
                error={xpError ?? undefined}
                helperText={t("xp_help")}
              />

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                {t("visibility")} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className={`justify-start rounded-lg border p-3 text-left ${
                    formData.visibility === "internal" ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, visibility: "internal" })
                  }
                >
                  <div className="flex-1 text-start">
                    <div className="mb-1 flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {t("internal")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{t("internal_help")}</p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className={`justify-start rounded-lg border p-3 text-left ${
                    formData.visibility === "visible_to_guardian" ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, visibility: "visible_to_guardian" })
                  }
                >
                  <div className="flex-1 text-start">
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
                </Button>
              </div>
            </div>

              <Input
                label={t("your_name")}
                type="text"
                required
                value={formData.created_by}
                onChange={(e) =>
                  setFormData({ ...formData, created_by: e.target.value })
                }
                placeholder={t("your_name_placeholder")}
                helperText={t("creator_help")}
              />

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
        </form>
    </Modal>
  );
}
