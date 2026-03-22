"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Save, Trash2, CheckCircle, BookOpen } from "lucide-react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
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
  markLessonDone,
  undoLessonDone,
} from "@/features/academics/curriculum/services/curriculumService";
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

export default function CurriculumEditor({
  curriculum,
  units,
  lessons,
  selectedNode,
  termWeeks,
  onRefresh,
  onDirtyChange,
  isReadOnly,
  gradeId,
  onSelectNode,
}: CurriculumEditorProps) {
  const t = useTranslations("academics.curriculum.editor");
  const tValidation = useTranslations("validation");

  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [originalData, setOriginalData] = useState<Record<string, string | number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ ar?: string; en?: string }>({});
  const [learningContentOpen, setLearningContentOpen] = useState(false);

  useEffect(() => {
    if (!selectedNode) {
      setFormData({});
      setOriginalData({});
      onDirtyChange(false);
      return;
    }

    if (selectedNode.type === "unit") {
      if (selectedNode.id === "new") {
        const data = { titleAr: "", titleEn: "", title: "", description: "" };
        setFormData(data);
        setOriginalData(data);
      } else {
        const unit = units.find((u) => u.id === selectedNode.id);
        if (unit) {
          const data = { 
            titleAr: unit.titleAr || "", 
            titleEn: unit.titleEn || "", 
            title: unit.title, 
            description: unit.description || "" 
          };
          setFormData(data);
          setOriginalData(data);
        }
      }
    } else if (selectedNode.type === "lesson") {
      if (selectedNode.id.startsWith("new-")) {
        const data = {
          titleAr: "",
          titleEn: "",
          title: "",
          objectives: "",
          resources: "",
          durationMinutes: 45,
          plannedWeek: 1,
        };
        setFormData(data);
        setOriginalData(data);
      } else {
        const lesson = lessons.find((l) => l.id === selectedNode.id);
        if (lesson) {
          const data = {
            titleAr: lesson.titleAr || "",
            titleEn: lesson.titleEn || "",
            title: lesson.title,
            objectives: lesson.objectives || "",
            resources: lesson.resources || "",
            durationMinutes: lesson.durationMinutes || 45,
            plannedWeek: lesson.plannedWeek,
            status: lesson.status,
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

  const handleSave = async () => {
    if (!selectedNode) return;

    // Validate required fields
    const titleAr = (formData.titleAr as string || "").trim();
    const titleEn = (formData.titleEn as string || "").trim();
    
    // Both titles are required
    const errors: { ar?: string; en?: string } = {};
    if (!titleAr) {
      errors.ar = tValidation("required_ar");
    }
    if (!titleEn) {
      errors.en = tValidation("required_en");
    }
    
    if (errors.ar || errors.en) {
      setValidationErrors(errors);
      return;
    }

    // Validate AR != EN
    const arEnErrors = validateArEnDifferent(titleAr, titleEn);
    if (arEnErrors.arError || arEnErrors.enError) {
      setValidationErrors({
        ar: arEnErrors.arError ? tValidation("arEnMustDiffer") : undefined,
        en: arEnErrors.enError ? tValidation("arEnMustDiffer") : undefined,
      });
      return;
    }

    setValidationErrors({});
    setIsSaving(true);
    try {
      if (selectedNode.type === "unit") {
        if (selectedNode.id === "new") {
          await createUnit(curriculum.id, {
            titleAr: formData.titleAr as string,
            titleEn: formData.titleEn as string,
            title: (formData.titleEn as string) || (formData.titleAr as string),
            description: formData.description as string,
          });
        } else {
          await updateUnit(selectedNode.id, {
            titleAr: formData.titleAr as string,
            titleEn: formData.titleEn as string,
            title: (formData.titleEn as string) || (formData.titleAr as string),
            description: formData.description as string,
          });
        }
      } else if (selectedNode.type === "lesson") {
        if (selectedNode.id.startsWith("new-")) {
          const unitId = selectedNode.id.replace("new-", "");
          await createLesson(unitId, {
            titleAr: formData.titleAr as string,
            titleEn: formData.titleEn as string,
            title: (formData.titleEn as string) || (formData.titleAr as string),
            objectives: formData.objectives as string,
            resources: formData.resources as string,
            durationMinutes: formData.durationMinutes as number,
            plannedWeek: formData.plannedWeek as number,
          });
        } else {
          await updateLesson(selectedNode.id, {
            titleAr: formData.titleAr as string,
            titleEn: formData.titleEn as string,
            title: (formData.titleEn as string) || (formData.titleAr as string),
            objectives: formData.objectives as string,
            resources: formData.resources as string,
            durationMinutes: formData.durationMinutes as number,
            plannedWeek: formData.plannedWeek as number,
          });
        }
      }

      await onRefresh();
      onDirtyChange(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode || !confirm(t("confirm_delete"))) return;

    try {
      if (selectedNode.type === "unit") {
        await deleteUnit(selectedNode.id);
      } else {
        await deleteLesson(selectedNode.id);
      }
      await onRefresh();
      if (onSelectNode) {
        onSelectNode(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleMarkDone = async () => {
    if (!selectedNode || selectedNode.type !== "lesson") return;

    try {
      const lesson = lessons.find((l) => l.id === selectedNode.id);
      if (lesson?.status === "done") {
        await undoLessonDone(selectedNode.id);
      } else {
        await markLessonDone(selectedNode.id);
      }
      await onRefresh();
    } catch (error) {
      console.error("Failed to mark done:", error);
    }
  };

  const weekOptions = Array.from({ length: termWeeks }, (_, i) => ({
    value: String(i + 1),
    label: `Week ${i + 1}`,
  }));

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t("no_selection")}</p>
      </div>
    );
  }

  const isNew = selectedNode.id === "new" || selectedNode.id.startsWith("new-");
  const lesson = selectedNode.type === "lesson" && !isNew
    ? lessons.find((l) => l.id === selectedNode.id)
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
              {lesson && (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    lesson.status === "done"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {lesson.status === "done" ? t("status_done") : t("status_planned")}
                </span>
              )}
              {selectedNode.type === "lesson" && !isNew && (
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

          <BilingualTextField
            label={t("title")}
            value={{
              ar: (formData.titleAr as string) || "",
              en: (formData.titleEn as string) || "",
            }}
            onChange={(value) => {
              setFormData({ 
                ...formData, 
                titleAr: value.ar, 
                titleEn: value.en,
                title: value.en || value.ar 
              });
              setValidationErrors({});
            }}
            requiredAr
            requiredEn
            errors={validationErrors}
            disabled={isReadOnly}
          />

          {selectedNode.type === "unit" && (
            <TextArea
              label={t("description")}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isReadOnly}
              rows={3}
            />
          )}

          {selectedNode.type === "lesson" && (
            <>
              <TextArea
                label={t("objectives")}
                value={formData.objectives || ""}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                disabled={isReadOnly}
                rows={3}
              />

              <TextArea
                label={t("resources")}
                value={formData.resources || ""}
                onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                disabled={isReadOnly}
                rows={2}
              />

              <Input
                label={t("duration_minutes")}
                type="number"
                value={formData.durationMinutes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })
                }
                disabled={isReadOnly}
              />

              <Select
                label={t("planned_week")}
                required
                value={String(formData.plannedWeek || 1)}
                onChange={(val) => setFormData({ ...formData, plannedWeek: parseInt(val) })}
                options={weekOptions}
                selectSize="md"
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
                {selectedNode.type === "lesson" && (
                  <Button
                    onClick={handleMarkDone}
                    variant="secondary"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    disabled={isReadOnly}
                  >
                    {lesson?.status === "done" ? t("undo_done") : t("mark_done")}
                  </Button>
                )}
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
      {selectedNode.type === "lesson" && !isNew && (
        <LearningContentPanel
          lessonId={selectedNode.id}
          isReadOnly={isReadOnly}
          gradeId={gradeId}
          open={learningContentOpen}
          onClose={() => setLearningContentOpen(false)}
        />
      )}
    </div>
  );
}
