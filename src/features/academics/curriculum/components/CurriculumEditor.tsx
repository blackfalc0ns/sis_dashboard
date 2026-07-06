"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Save, Trash2, BookOpen } from "lucide-react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import Input from "@/components/ui/input/Input";
import {
  Curriculum,
  Unit,
  Lesson,
  createUnit,
  updateUnit,
  deleteUnit,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  curriculumFormErrors,
  curriculumUiError,
} from "@/features/academics/curriculum/services/curriculumErrors";
import LearningContentPanel from "./LearningContentPanel";

interface CurriculumEditorProps {
  curriculum: Curriculum;
  units: Unit[];
  lessons: Lesson[];
  selectedNode: { type: "unit" | "lesson"; id: string } | null;
  termWeeks: number;
  onRefresh: () => Promise<void>;
  onDirtyChange: (isDirty: boolean) => void;
  isReadOnly: boolean;
  gradeId?: string; // For scope-aware holiday checking
  onSelectNode?: (node: { type: "unit" | "lesson"; id: string } | null) => void;
}

type CurriculumEditorForm = {
  title: string;
  description: string;
  objectives: string;
  estimatedLessons: string;
  estimatedMinutes: string;
};

const emptyForm: CurriculumEditorForm = {
  title: "",
  description: "",
  objectives: "",
  estimatedLessons: "",
  estimatedMinutes: "",
};

const curriculumEditorFields = [
  "title",
  "description",
  "objectives",
  "estimatedLessons",
  "estimatedMinutes",
] as const satisfies readonly (keyof CurriculumEditorForm)[];

export default function CurriculumEditor({
  curriculum,
  units,
  lessons,
  selectedNode,
  termWeeks, // No longer used for planned week dropdown, but kept in props
  onRefresh,
  onDirtyChange,
  isReadOnly,
  gradeId,
  onSelectNode,
}: CurriculumEditorProps) {
  const t = useTranslations("academics.curriculum.editor");
  const tValidation = useTranslations("validation");
  void termWeeks;

  const [formData, setFormData] = useState<CurriculumEditorForm>(emptyForm);
  const [originalData, setOriginalData] = useState<CurriculumEditorForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CurriculumEditorForm, string>>
  >({});
  const [formMessages, setFormMessages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [learningContentOpen, setLearningContentOpen] = useState(false);

  useEffect(() => {
    setFieldErrors({});
    setFormMessages([]);
    if (!selectedNode) {
      setFormData(emptyForm);
      setOriginalData(emptyForm);
      onDirtyChange(false);
      return;
    }

    if (selectedNode.type === "unit") {
      if (selectedNode.id === "new") {
        setFormData(emptyForm);
        setOriginalData(emptyForm);
      } else {
        const unit = units.find((u) => u.id === selectedNode.id);
        if (unit) {
          const data: CurriculumEditorForm = {
            title: unit.title,
            description: unit.description || "",
            objectives: "",
            estimatedLessons: unit.estimatedLessons?.toString() ?? "",
            estimatedMinutes: "",
          };
          setFormData(data);
          setOriginalData(data);
        }
      }
    } else if (selectedNode.type === "lesson") {
      if (selectedNode.id.startsWith("new-")) {
        setFormData(emptyForm);
        setOriginalData(emptyForm);
      } else {
        const lesson = lessons.find((l) => l.id === selectedNode.id);
        if (lesson) {
          const data: CurriculumEditorForm = {
            title: lesson.title,
            description: lesson.description || "",
            objectives: lesson.objectives.join("\n"),
            estimatedLessons: "",
            estimatedMinutes: lesson.estimatedMinutes?.toString() ?? "",
          };
          setFormData(data);
          setOriginalData(data);
        }
      }
    }
  }, [selectedNode, units, lessons, onDirtyChange]);

  useEffect(() => {
    const dirty = JSON.stringify(formData) !== JSON.stringify(originalData);
    setIsDirty(dirty);
    onDirtyChange(dirty);
  }, [formData, originalData, onDirtyChange]);

  const updateFormField = <Field extends keyof CurriculumEditorForm>(
    field: Field,
    value: CurriculumEditorForm[Field],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    if (isReadOnly || !selectedNode) return;

    const title = formData.title.trim();
    if (!title) {
      setFieldErrors({ title: tValidation("required") });
      return;
    }

    setFieldErrors({});
    setFormMessages([]);
    setIsSaving(true);
    try {
      if (selectedNode.type === "unit") {
        const estimatedLessons = formData.estimatedLessons.trim()
          ? Number(formData.estimatedLessons)
          : null;
        const payload = {
          title,
          description: formData.description.trim() || null,
          estimatedLessons,
        };
        if (selectedNode.id === "new") {
          await createUnit(curriculum.id, {
            ...payload,
            sortOrder: units.length,
          });
        } else {
          await updateUnit(curriculum.id, selectedNode.id, payload);
        }
      } else {
        const estimatedMinutes = formData.estimatedMinutes.trim()
          ? Number(formData.estimatedMinutes)
          : null;
        const objectives = formData.objectives
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);
        if (selectedNode.id.startsWith("new-")) {
          const unitId = selectedNode.id.replace("new-", "");
          const unitLessons = lessons.filter((lesson) => lesson.unitId === unitId);
          await createLesson(curriculum.id, unitId, {
            title,
            description: formData.description.trim() || null,
            objectives,
            estimatedMinutes,
            sortOrder: unitLessons.length,
          });
        } else {
          const lesson = lessons.find((item) => item.id === selectedNode.id);
          if (!lesson) return;
          await updateLesson(curriculum.id, lesson.unitId, selectedNode.id, {
            title,
            description: formData.description.trim() || null,
            objectives,
            estimatedMinutes,
          });
        }
      }

      await onRefresh();
      onDirtyChange(false);
    } catch (error) {
      const mapped = curriculumUiError(error, tValidation("invalid"));
      const projected = curriculumFormErrors(mapped, curriculumEditorFields);
      setFieldErrors(projected.fieldErrors);
      setFormMessages([...new Set([mapped.message, ...projected.formMessages])]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly || !selectedNode || !confirm(t("confirm_delete"))) return;

    try {
      if (selectedNode.type === "unit") {
        await deleteUnit(curriculum.id, selectedNode.id);
      } else {
        const lesson = lessons.find((item) => item.id === selectedNode.id);
        if (!lesson) return;
        await deleteLesson(curriculum.id, lesson.unitId, selectedNode.id);
      }
      await onRefresh();
      if (onSelectNode) {
        onSelectNode(null);
      }
    } catch (error) {
      const mapped = curriculumUiError(error, tValidation("invalid"));
      setFormMessages([...new Set([mapped.message, ...mapped.details])]);
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t("no_selection")}</p>
      </div>
    );
  }

  const isNew = selectedNode.id === "new" || selectedNode.id.startsWith("new-");
  const selectedLesson =
    selectedNode.type === "lesson" && !isNew
      ? lessons.find((item) => item.id === selectedNode.id)
      : null;

  return (
    <div className="p-6">
      <div className="">
        <div className="bg-white rounded-lg shadow-sm border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {selectedNode.type === "unit"
                  ? isNew
                    ? t("new_unit")
                    : t("edit_unit")
                  : isNew
                    ? t("new_lesson")
                    : t("edit_lesson")}
              </h2>
              {isDirty && (
                <span className="text-sm text-amber-600 font-medium">
                  {t("unsaved_changes")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedLesson && (
                <Button
                  onClick={() => setLearningContentOpen(true)}
                  variant="primary"
                  size="sm"
                  leftIcon={<BookOpen className="w-4 h-4" />}
                >
                  {t("learning_content")}
                </Button>
              )}
            </div>
          </div>

          {formMessages.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {formMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <Input
            label={t("title")}
            value={formData.title}
            onChange={(e) => updateFormField("title", e.target.value)}
            required
            error={fieldErrors.title}
            disabled={isReadOnly}
          />

          <TextArea
            label={t("description")}
            value={formData.description}
            onChange={(e) => updateFormField("description", e.target.value)}
            error={fieldErrors.description}
            disabled={isReadOnly}
            rows={3}
          />

          {selectedNode.type === "unit" && (
            <Input
              label={t("estimated_lessons")}
              type="number"
              value={formData.estimatedLessons}
              onChange={(e) => updateFormField("estimatedLessons", e.target.value)}
              error={fieldErrors.estimatedLessons}
              disabled={isReadOnly}
            />
          )}

          {selectedNode.type === "lesson" && (
            <>
              <TextArea
                label={t("objectives")}
                value={formData.objectives}
                onChange={(e) => updateFormField("objectives", e.target.value)}
                error={fieldErrors.objectives}
                disabled={isReadOnly}
                rows={4}
              />
              <Input
                label={t("duration_minutes")}
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) => updateFormField("estimatedMinutes", e.target.value)}
                error={fieldErrors.estimatedMinutes}
                disabled={isReadOnly}
              />
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              disabled={isReadOnly || isSaving || !isDirty}
            >
              {isSaving ? t("saving") : t("save")}
            </Button>

            {!isNew && (
              <>
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  disabled={isReadOnly}
                >
                  {t("delete")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Learning Content Panel */}
      {selectedLesson && (
        <LearningContentPanel
          curriculumId={curriculum.id}
          unitId={selectedLesson.unitId}
          lessonId={selectedLesson.id}
          isReadOnly={isReadOnly}
          gradeId={gradeId} // Still passing this for holiday checking downstream
          open={learningContentOpen}
          onClose={() => setLearningContentOpen(false)}
        />
      )}
    </div>
  );
}
