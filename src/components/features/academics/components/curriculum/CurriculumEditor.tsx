"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Save, Trash2, CheckCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Select from "@/components/ui/input/Select";
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
} from "@/services/academics/curriculumService";
import LessonMaterials from "./LessonMaterials";

interface CurriculumEditorProps {
  curriculum: Curriculum;
  units: Unit[];
  lessons: Lesson[];
  selectedNode: { type: "unit" | "lesson"; id: string } | null;
  termWeeks: number;
  onRefresh: () => Promise<void>;
  onDirtyChange: (isDirty: boolean) => void;
  isReadOnly: boolean;
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
}: CurriculumEditorProps) {
  const t = useTranslations("academics.curriculum.editor");

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedNode) {
      setFormData({});
      setOriginalData({});
      onDirtyChange(false);
      return;
    }

    if (selectedNode.type === "unit") {
      if (selectedNode.id === "new") {
        const data = { title: "", description: "" };
        setFormData(data);
        setOriginalData(data);
      } else {
        const unit = units.find((u) => u.id === selectedNode.id);
        if (unit) {
          const data = { title: unit.title, description: unit.description || "" };
          setFormData(data);
          setOriginalData(data);
        }
      }
    } else if (selectedNode.type === "lesson") {
      if (selectedNode.id.startsWith("new-")) {
        const data = {
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
  }, [selectedNode, units, lessons]);

  useEffect(() => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);
    onDirtyChange(isDirty);
  }, [formData, originalData, onDirtyChange]);

  const handleSave = async () => {
    if (!selectedNode) return;

    setIsSaving(true);
    try {
      if (selectedNode.type === "unit") {
        if (selectedNode.id === "new") {
          await createUnit(curriculum.id, {
            title: formData.title,
            description: formData.description,
          });
        } else {
          await updateUnit(selectedNode.id, {
            title: formData.title,
            description: formData.description,
          });
        }
      } else if (selectedNode.type === "lesson") {
        if (selectedNode.id.startsWith("new-")) {
          const unitId = selectedNode.id.replace("new-", "");
          await createLesson(unitId, {
            title: formData.title,
            objectives: formData.objectives,
            resources: formData.resources,
            durationMinutes: formData.durationMinutes,
            plannedWeek: formData.plannedWeek,
          });
        } else {
          await updateLesson(selectedNode.id, {
            title: formData.title,
            objectives: formData.objectives,
            resources: formData.resources,
            durationMinutes: formData.durationMinutes,
            plannedWeek: formData.plannedWeek,
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {selectedNode.type === "unit"
                ? isNew
                  ? t("new_unit")
                  : t("edit_unit")
                : isNew
                  ? t("new_lesson")
                  : t("edit_lesson")}
            </h2>
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
          </div>

          <Input
            label={t("title")}
            required
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              disabled={isReadOnly || isSaving}
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

        {/* Lesson Materials Section - Only for existing lessons */}
        {selectedNode.type === "lesson" && !isNew && (
          <LessonMaterials lessonId={selectedNode.id} isReadOnly={isReadOnly} />
        )}
      </div>
    </div>
  );
}
