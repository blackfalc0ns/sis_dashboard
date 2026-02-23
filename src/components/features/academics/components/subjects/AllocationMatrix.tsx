"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [localAllocations, setLocalAllocations] = useState<SubjectAllocation[]>([]);
  const [originalAllocations, setOriginalAllocations] = useState<SubjectAllocation[]>([]);
  const [stageFilter, setStageFilter] = useState("");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);

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

  // Get unique stages with their data
  const stagesData = useMemo(() => {
    const stageMap = new Map<string, { id: string; name: string; nameAr: string; nameEn: string }>();
    grades.forEach((grade) => {
      if (!stageMap.has(grade.stageId)) {
        stageMap.set(grade.stageId, {
          id: grade.stageId,
          name: grade.stageId,
          nameAr: grade.stageId,
          nameEn: grade.stageId,
        });
      }
    });
    return Array.from(stageMap.values());
  }, [grades]);

  const stageOptions = [
    { value: "", label: t("filters.all_stages") },
    ...stagesData.map((stage) => ({
      value: stage.id,
      label: locale === "ar" ? (stage.nameAr || stage.nameEn || stage.name) : (stage.nameEn || stage.nameAr || stage.name),
    })),
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

  const getCellId = (gradeId: string, subjectId: string) => `${gradeId}-${subjectId}`;

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
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-gray-50)' }}>
      {/* Toolbar */}
      <div className="p-4 border-b shadow-sm space-y-4" style={{ 
        backgroundColor: 'var(--background)',
        borderColor: 'var(--color-neutral-200)'
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary-900)' }}>{t("title")}</h2>
          
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
              className="rounded"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <span style={{ color: 'var(--color-gray-700)' }}>{t("filters.show_missing")}</span>
          </label>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span style={{ color: 'var(--color-gray-600)' }}>{t("summary.subjects")}: </span>
            <span className="font-medium" style={{ color: 'var(--color-primary-900)' }}>{subjects.length}</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-gray-600)' }}>{t("summary.grades")}: </span>
            <span className="font-medium" style={{ color: 'var(--color-primary-900)' }}>{filteredGrades.length}</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-gray-600)' }}>{t("summary.completion")}: </span>
            <span className="font-medium" style={{ color: 'var(--color-primary-900)' }}>{completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-block min-w-full">
          <table className="min-w-full border-collapse shadow-sm rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
            <thead>
              <tr>
                {/* Grade Column Header - Pinned */}
                <th 
                  className={`sticky ${isRTL ? 'right-0' : 'left-0'} z-20 px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-bold uppercase tracking-wider shadow-sm`}
                  style={{ 
                    minWidth: '200px',
                    backgroundColor: 'var(--color-surface-100)',
                    borderBottom: '2px solid var(--color-neutral-200)',
                    color: 'var(--color-primary-900)'
                  }}
                >
                  {t("table.grade")}
                </th>
                
                {/* Subject Column Headers */}
                {subjects.map((subject) => {
                  const subjectName = locale === "ar" 
                    ? (subject.nameAr || subject.nameEn || subject.name) 
                    : (subject.nameEn || subject.nameAr || subject.name);
                  
                  return (
                    <th
                      key={subject.id}
                      className={`px-3 py-3 ${locale === "ar" ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider`}
                      style={{ 
                        minWidth: '160px', 
                        maxWidth: '160px',
                        backgroundColor: 'var(--color-surface-100)',
                        borderBottom: '2px solid var(--color-neutral-200)',
                        color: 'var(--color-primary-900)'
                      }}
                      title={`${subjectName}${subject.code ? ` (${subject.code})` : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-bold truncate" style={{ color: 'var(--color-primary-900)' }}>
                          {subjectName}
                        </div>
                        {subject.code && (
                          <div className="inline-flex">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: 'var(--color-primary-50)',
                                color: 'var(--color-primary-700)',
                                border: '1px solid var(--color-primary-200)'
                              }}
                            >
                              {subject.code}
                            </span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
                
                {/* Total Column Header - Pinned */}
                <th 
                  className={`sticky ${isRTL ? 'left-0' : 'right-0'} z-20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider shadow-sm`}
                  style={{ 
                    minWidth: '110px',
                    backgroundColor: 'var(--color-accent-50)',
                    borderBottom: '2px solid var(--color-accent-200)',
                    color: 'var(--color-accent-900)'
                  }}
                >
                  {t("table.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade, gradeIndex) => {
                const gradeTotal = getGradeTotal(grade.id);
                const isEvenRow = gradeIndex % 2 === 0;
                
                return (
                  <tr 
                    key={grade.id} 
                    className="transition-colors"
                    style={{
                      backgroundColor: isEvenRow ? 'var(--background)' : 'var(--color-gray-50)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isEvenRow ? 'var(--background)' : 'var(--color-gray-50)';
                    }}
                  >
                    {/* Grade Cell - Pinned */}
                    <td 
                      className={`sticky ${isRTL ? 'right-0' : 'left-0'} z-10 px-4 py-3 text-sm font-semibold shadow-sm`}
                      style={{
                        backgroundColor: 'inherit',
                        borderBottom: '1px solid var(--color-neutral-100)',
                        color: 'var(--color-primary-900)'
                      }}
                    >
                      {locale === "ar" ? (grade.nameAr || grade.nameEn || grade.name) : (grade.nameEn || grade.nameAr || grade.name)}
                    </td>
                    
                    {/* Subject Allocation Cells */}
                    {subjects.map((subject) => {
                      const value = getAllocation(grade.id, subject.id);
                      const originalValue = originalAllocations.find(
                        (a) => a.gradeId === grade.id && a.subjectId === subject.id
                      )?.weeklyHours || 0;
                      const isChanged = originalValue !== value;
                      const cellId = getCellId(grade.id, subject.id);
                      const isFocused = focusedCell === cellId;

                      return (
                        <td 
                          key={subject.id} 
                          className="p-0"
                          style={{ borderBottom: '1px solid var(--color-neutral-100)' }}
                        >
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="1"
                              value={value || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  setAllocation(grade.id, subject.id, val);
                                }
                              }}
                              onFocus={() => setFocusedCell(cellId)}
                              onBlur={() => setFocusedCell(null)}
                              disabled={isReadOnly}
                              placeholder="—"
                              className="w-full h-full px-3 py-3 text-sm text-center border-0 focus:outline-none transition-all"
                              style={{
                                appearance: 'textfield',
                                MozAppearance: 'textfield',
                                WebkitAppearance: 'none',
                                backgroundColor: isChanged 
                                  ? 'var(--color-accent-50)' 
                                  : isFocused 
                                    ? 'var(--color-primary-50)' 
                                    : isReadOnly 
                                      ? 'var(--color-gray-100)' 
                                      : 'transparent',
                                color: isChanged 
                                  ? 'var(--color-accent-900)' 
                                  : value === 0 
                                    ? 'var(--color-gray-400)' 
                                    : isReadOnly 
                                      ? 'var(--color-gray-500)' 
                                      : 'var(--foreground)',
                                fontWeight: isChanged ? '600' : 'normal',
                                cursor: isReadOnly ? 'not-allowed' : 'text',
                                boxShadow: isFocused ? 'inset 0 0 0 2px var(--color-primary-500)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!isReadOnly && !isFocused && !isChanged) {
                                  e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isReadOnly && !isFocused && !isChanged) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            />
                            {isChanged && !isFocused && (
                              <div 
                                className="absolute top-1 right-1 w-2 h-2 rounded-full" 
                                style={{ backgroundColor: 'var(--color-accent-500)' }}
                                title="Modified" 
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    
                    {/* Total Cell - Pinned */}
                    <td 
                      className={`sticky ${isRTL ? 'left-0' : 'right-0'} z-10 px-4 py-3 text-sm font-bold text-center shadow-sm`}
                      style={{
                        backgroundColor: 'var(--color-accent-50)',
                        borderBottom: '1px solid var(--color-accent-200)',
                        color: 'var(--color-accent-900)'
                      }}
                    >
                      {gradeTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hide number input spinners */}
      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
