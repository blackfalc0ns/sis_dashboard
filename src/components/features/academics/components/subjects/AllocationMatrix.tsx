"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Save, RotateCcw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import {
  Subject,
  SubjectAllocation,
  bulkUpsertSubjectAllocations,
} from "@/services/academics/subjectsService";
import { Grade } from "@/services/academics/structureService";

interface AllocationMatrixProps {
  grades: Grade[];
  subjects: Subject[];
  allocations: SubjectAllocation[];
  termId: string;
  isReadOnly: boolean;
  onAllocationsChange: (allocations: SubjectAllocation[]) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onRefresh: () => Promise<void>;
}

export default function AllocationMatrix({
  grades,
  subjects,
  allocations,
  termId,
  isReadOnly,
  onAllocationsChange,
  onDirtyChange,
  onRefresh,
}: AllocationMatrixProps) {
  const t = useTranslations("academics.subjects.matrix");

  const [localAllocations, setLocalAllocations] = useState<SubjectAllocation[]>([]);
  const [originalAllocations, setOriginalAllocations] = useState<SubjectAllocation[]>([]);
  const [stageFilter, setStageFilter] = useState("");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local allocations
  useEffect(() => {
    setLocalAllocations(allocations);
    setOriginalAllocations(allocations);
  }, [allocations]);

  const getAllocation = (gradeId: string, subjectId: string): number => {
    const allocation = localAllocations.find(
      (a) => a.gradeId === gradeId && a.subjectId === subjectId
    );
    return allocation?.weeklyHours || 0;
  };

  // Track dirty state
  const isDirty = useMemo(() => {
    if (localAllocations.length !== originalAllocations.length) return true;
    
    return localAllocations.some((local) => {
      const original = originalAllocations.find(
        (o) => o.gradeId === local.gradeId && o.subjectId === local.subjectId
      );
      return !original || original.weeklyHours !== local.weeklyHours;
    });
  }, [localAllocations, originalAllocations]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Filter grades by stage
  const filteredGrades = useMemo(() => {
    if (!stageFilter) return grades;
    return grades.filter((g) => g.stageId === stageFilter);
  }, [grades, stageFilter]);

  // Get unique stages
  const stages = useMemo(() => {
    const stageIds = new Set(grades.map((g) => g.stageId));
    return Array.from(stageIds);
  }, [grades]);

  const stageOptions = [
    { value: "", label: t("filters.all_stages") },
    ...stages.map((stageId) => ({ value: stageId, label: `Stage ${stageId}` })),
  ];

  const setAllocation = (gradeId: string, subjectId: string, weeklyHours: number) => {
    const value = Math.max(0, Math.min(50, weeklyHours)); // Clamp between 0-50
    
    setLocalAllocations((prev) => {
      const existing = prev.find(
        (a) => a.gradeId === gradeId && a.subjectId === subjectId
      );

      if (existing) {
        return prev.map((a) =>
          a.gradeId === gradeId && a.subjectId === subjectId
            ? { ...a, weeklyHours: value }
            : a
        );
      } else {
        return [...prev, { gradeId, subjectId, weeklyHours: value }];
      }
    });
  };

  const getGradeTotal = (gradeId: string): number => {
    return subjects.reduce((sum, subject) => {
      return sum + getAllocation(gradeId, subject.id);
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await bulkUpsertSubjectAllocations(termId, localAllocations);
      await onRefresh();
      setOriginalAllocations(localAllocations);
      onDirtyChange(false);
    } catch (error) {
      console.error("Failed to save allocations:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalAllocations(originalAllocations);
    onDirtyChange(false);
  };

  const completionPercentage = useMemo(() => {
    const totalCells = filteredGrades.length * subjects.length;
    if (totalCells === 0) return 0;
    
    const filledCells = filteredGrades.reduce((count, grade) => {
      return count + subjects.filter((subject) => {
        const allocation = localAllocations.find(
          (a) => a.gradeId === grade.id && a.subjectId === subject.id
        );
        return (allocation?.weeklyHours || 0) > 0;
      }).length;
    }, 0);
    
    return Math.round((filledCells / totalCells) * 100);
  }, [filteredGrades, subjects, localAllocations]);

  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-6">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty_state.no_subjects.title")}</h3>
          <p className="text-gray-600">{t("empty_state.no_subjects.message")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-white space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReset}
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              disabled={!isDirty || isReadOnly}
            >
              {t("actions.reset")}
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              disabled={!isDirty || isReadOnly || isSaving}
            >
              {isSaving ? t("actions.saving") : t("actions.save")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-48">
            <Select
              label={t("filters.stage")}
              value={stageFilter}
              onChange={setStageFilter}
              options={stageOptions}
              selectSize="sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyMissing}
              onChange={(e) => setShowOnlyMissing(e.target.checked)}
              className="rounded border border-border"
            />
            <span className="text-gray-700">{t("filters.show_missing")}</span>
          </label>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-600">{t("summary.subjects")}: </span>
            <span className="font-medium">{subjects.length}</span>
          </div>
          <div>
            <span className="text-gray-600">{t("summary.grades")}: </span>
            <span className="font-medium">{filteredGrades.length}</span>
          </div>
          <div>
            <span className="text-gray-600">{t("summary.completion")}: </span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-block min-w-full">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border border-border-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                  {t("table.grade")}
                </th>
                {subjects.map((subject) => (
                  <th
                    key={subject.id}
                    className="bg-gray-50 border border-border-200 px-4 py-2 text-left text-sm font-medium text-gray-700 min-w-[120px]"
                  >
                    <div className="truncate" title={subject.name}>
                      {subject.name}
                    </div>
                    {subject.code && (
                      <div className="text-xs text-gray-500 font-normal">{subject.code}</div>
                    )}
                  </th>
                ))}
                <th className="sticky right-0 z-10 bg-gray-50 border border-border-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                  {t("table.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade) => {
                const gradeTotal = getGradeTotal(grade.id);
                
                return (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white border border-border-200 px-4 py-2 text-sm font-medium text-gray-900">
                      {grade.name}
                    </td>
                    {subjects.map((subject) => {
                      const value = getAllocation(grade.id, subject.id);
                      const isChanged = originalAllocations.find(
                        (a) => a.gradeId === grade.id && a.subjectId === subject.id
                      )?.weeklyHours !== value;

                      return (
                        <td key={subject.id} className="border border-border-200 p-1">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={value || ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                              setAllocation(grade.id, subject.id, val);
                            }}
                            disabled={isReadOnly}
                            className={`w-full px-2 py-1 text-sm text-center border rounded ${
                              isChanged
                                ? "border-border bg-primary/5"
                                : "border-border-300"
                            } ${isReadOnly ? "bg-primary-50 cursor-not-allowed" : ""}`}
                            placeholder="0"
                          />
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-gray-100 border border-border-200 px-4 py-2 text-sm font-semibold text-gray-900 text-center">
                      {gradeTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
