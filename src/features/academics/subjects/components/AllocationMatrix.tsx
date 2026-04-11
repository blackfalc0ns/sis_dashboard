"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, RotateCcw } from "lucide-react";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import AllocationMatrixTable, { MatrixColumn, MatrixRow } from "../../components/shared/AllocationMatrixTable";
import {
  Subject,
  SubjectAllocation,
  bulkUpsertSubjectAllocations,
} from "@/features/academics/subjects/services/subjectsService";
import { Grade } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  ExportColumn,
  ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";

interface AllocationMatrixProps {
  grades: Grade[];
  subjects: Subject[];
  allocations: SubjectAllocation[];
  termId: string;
  yearName?: string;
  termName?: string;
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
  yearName,
  termName,
  isReadOnly,
  onDirtyChange,
  onRefresh,
}: AllocationMatrixProps) {
  const t = useTranslations("academics.subjects.matrix");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryState = useMemo(
    () => ({
      stageFilter: searchParams.get("stage") || "",
      showOnlyMissing: searchParams.get("missing") === "1",
    }),
    [searchParams]
  );
  const { stageFilter, showOnlyMissing } = queryState;

  const [localAllocations, setLocalAllocations] = useState<SubjectAllocation[]>([]);
  const [originalAllocations, setOriginalAllocations] = useState<SubjectAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

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

  const syncQueryParams = (
    nextState: Partial<{
      stageFilter: string;
      showOnlyMissing: boolean;
    }>,
    historyMode: "push" | "replace" = "push"
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const mergedState = {
      stageFilter: nextState.stageFilter ?? queryState.stageFilter,
      showOnlyMissing:
        nextState.showOnlyMissing ?? queryState.showOnlyMissing,
    };

    if (mergedState.stageFilter) {
      params.set("stage", mergedState.stageFilter);
    } else {
      params.delete("stage");
    }

    if (mergedState.showOnlyMissing) {
      params.set("missing", "1");
    } else {
      params.delete("missing");
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `?${nextQuery}` : "?";
    if (historyMode === "push") {
      router.push(nextUrl, { scroll: false });
      return;
    }
    router.replace(nextUrl, { scroll: false });
  };

  // Filter grades by stage
  const stageFilteredGrades = useMemo(() => {
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

  useEffect(() => {
    if (!stageFilter) {
      return;
    }

    const isValidStage = stagesData.some((stage) => stage.id === stageFilter);
    if (isValidStage) {
      return;
    }

    syncQueryParams({ stageFilter: "" }, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter, stagesData]);

  const filteredGrades = useMemo(() => {
    if (!showOnlyMissing) {
      return stageFilteredGrades;
    }

    return stageFilteredGrades.filter((grade) =>
      subjects.some((subject) => {
        const allocation = localAllocations.find(
          (item) => item.gradeId === grade.id && item.subjectId === subject.id
        );
        return (allocation?.weeklyHours || 0) <= 0;
      })
    );
  }, [showOnlyMissing, stageFilteredGrades, subjects, localAllocations]);

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

  // Export handler
  const handleExport = (format: AcademicsExportFormat) => {
    // Prepare title
    const title = t("title");

    // Prepare metadata
    const metadata: ExportMetadata = {
      yearName,
      termName,
      exportDate: formatExportDate(locale),
    };

    // Add grade filter if selected
    if (stageFilter) {
      const stage = stagesData.find((s) => s.id === stageFilter);
      if (stage) {
        metadata.gradeName = locale === "ar" ? stage.nameAr : stage.nameEn;
      }
    }

    // Prepare columns
    const columns: ExportColumn[] = [
      { key: "grade", label: t("columns.grade") },
      ...subjects.map((subject) => ({
        key: `subject_${subject.id}`,
        label: locale === "ar" ? subject.nameAr : subject.nameEn,
      })),
    ];

    // Prepare rows
    const rows = filteredGrades.map((grade) => {
      const row: Record<string, unknown> = {
        grade: locale === "ar" ? grade.nameAr : grade.nameEn,
      };

      subjects.forEach((subject) => {
        const hours = getAllocation(grade.id, subject.id);
        row[`subject_${subject.id}`] = hours || "";
      });

      return row;
    });

    // Generate filename
    const filename = generateExportFilename(
      "subjects-allocation",
      termId,
      stageFilter || undefined
    );

    // Export with title and metadata
    exportAcademicsData({ title, metadata, filename, format, columns, rows, locale });
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

  // Prepare matrix data
  const matrixRows: (MatrixRow & { gradeId: string })[] = useMemo(() => {
    return filteredGrades.map((grade) => ({
      id: grade.id,
      gradeId: grade.id,
      label: locale === "ar" ? (grade.nameAr || grade.nameEn || grade.name) : (grade.nameEn || grade.nameAr || grade.name),
    }));
  }, [filteredGrades, locale]);

  const matrixColumns: (MatrixColumn & { subjectId: string })[] = useMemo(() => {
    return subjects.map((subject) => ({
      id: subject.id,
      subjectId: subject.id,
      label: locale === "ar" ? (subject.nameAr || subject.nameEn || subject.name) : (subject.nameEn || subject.nameAr || subject.name),
      code: subject.code,
    }));
  }, [subjects, locale]);

  const renderCell = (row: MatrixRow & { gradeId: string }, column: MatrixColumn & { subjectId: string }) => {
    const value = getAllocation(row.gradeId, column.subjectId);
    const originalValue = originalAllocations.find(
      (a) => a.gradeId === row.gradeId && a.subjectId === column.subjectId
    )?.weeklyHours || 0;
    const isChanged = originalValue !== value;
    const cellId = getCellId(row.gradeId, column.subjectId);
    const isFocused = focusedCell === cellId;

    return (
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
              setAllocation(row.gradeId, column.subjectId, val);
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
            fontFamily: 'inherit',
                       backgroundColor: isChanged 
              ? 'var(--color-hover-50)' 
              : isFocused 
                ? 'var(--color-primary-200)' 
                : isReadOnly 
                  ? 'var(--color-primary-100)' 
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
              e.currentTarget.style.backgroundColor = 'var(--color-primary-200)';
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
    );
  };

  const getRowTotal = (row: MatrixRow & { gradeId: string }) => {
    return getGradeTotal(row.gradeId);
  };

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
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              disabled={filteredGrades.length === 0 || subjects.length === 0}
            >
              {t("actions.export")}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              disabled={!isDirty || isReadOnly}
            >
              {t("actions.reset")}
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
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
              onChange={(value) => syncQueryParams({ stageFilter: value }, "push")}
              options={stageOptions}
              selectSize="sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyMissing}
              onChange={(e) =>
                syncQueryParams({ showOnlyMissing: e.target.checked }, "push")
              }
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
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-4">
          <AllocationMatrixTable
            rows={matrixRows}
            columns={matrixColumns}
            rowHeaderLabel={t("table.grade")}
            totalColumnLabel={t("table.total")}
            renderCell={renderCell}
            getRowTotal={getRowTotal}
          />
        </div>
      </div>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("actions.export")}
        subtitle={t("title")}
        datasetCount={filteredGrades.length}
      />
    </div>
  );
}
