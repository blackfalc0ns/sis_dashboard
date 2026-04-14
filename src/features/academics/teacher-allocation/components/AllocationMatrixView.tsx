"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, RotateCcw, AlertCircle, Users } from "lucide-react";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import { IconButton, Tooltip } from "@mui/material";
import Button from "@/components/ui/button/Button";
import FilterBar from "./FilterBar";
import TeacherSelect from "./TeacherSelect";
import BulkActionDialog from "./BulkActionDialog";
import AllocationMatrixTable, { MatrixColumn, MatrixRow } from "../../components/shared/AllocationMatrixTable";
import {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  Teacher,
  TeacherAllocation,
  bulkUpsertTeacherAllocations,
  resolveTeacherAllocationForTarget,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  ExportColumn,
  ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";
import { CheckCircle } from "lucide-react";

interface AllocationMatrixViewProps {
  termId: string;
  yearName?: string;
  termName?: string;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
  isReadOnly: boolean;
  onRefresh: () => Promise<void>;
  onValidate: () => void;
  onAllocationsChange?: (allocations: TeacherAllocation[]) => void;
}

type TargetRow = MatrixRow & {
  section: Section;
  classroom?: Classroom;
};

export default function AllocationMatrixView({
  termId,
  yearName,
  termName,
  grades,
  sections,
  classrooms,
  subjects,
  subjectAllocations,
  teachers,
  teacherAllocations,
  isReadOnly,
  onRefresh,
  onValidate,
  onAllocationsChange,
}: AllocationMatrixViewProps) {
  const t = useTranslations("academics.teacherAllocation");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === "ar";
  const queryState = useMemo(
    () => ({
      selectedGradeId: searchParams.get("grade") || "",
      selectedSectionId: searchParams.get("section") || "",
      selectedClassroomId: searchParams.get("classroom") || "",
      selectedSubjectId: searchParams.get("subject") || "",
      showOnlyMissing: searchParams.get("missing") === "1",
    }),
    [searchParams]
  );
  const {
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    showOnlyMissing,
  } = queryState;

  const [localAllocations, setLocalAllocations] = useState<TeacherAllocation[]>([]);
  const [originalAllocations, setOriginalAllocations] = useState<TeacherAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionGrade, setBulkActionGrade] = useState<Grade | null>(null);
  const [bulkActionSubject, setBulkActionSubject] = useState<Subject | null>(null);
  const [bulkActionTeacher, setBulkActionTeacher] = useState<Teacher | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setLocalAllocations(teacherAllocations);
    setOriginalAllocations(teacherAllocations);
  }, [teacherAllocations]);

  useEffect(() => {
    onAllocationsChange?.(localAllocations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAllocations]);

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        selectedGradeId: string;
        selectedSectionId: string;
        selectedClassroomId: string;
        selectedSubjectId: string;
        showOnlyMissing: boolean;
      }>,
      historyMode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const mergedState = {
        selectedGradeId:
          nextState.selectedGradeId ?? queryState.selectedGradeId,
        selectedSectionId:
          nextState.selectedSectionId ?? queryState.selectedSectionId,
        selectedClassroomId:
          nextState.selectedClassroomId ?? queryState.selectedClassroomId,
        selectedSubjectId:
          nextState.selectedSubjectId ?? queryState.selectedSubjectId,
        showOnlyMissing:
          nextState.showOnlyMissing ?? queryState.showOnlyMissing,
      };

      const entries: Array<[string, string]> = [
        ["grade", mergedState.selectedGradeId],
        ["section", mergedState.selectedSectionId],
        ["classroom", mergedState.selectedClassroomId],
        ["subject", mergedState.selectedSubjectId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

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
    },
    [queryState, router, searchParams]
  );

  const allocationsEqual = useCallback((left: TeacherAllocation, right: TeacherAllocation) => {
    return (
      left.sectionId === right.sectionId &&
      left.subjectId === right.subjectId &&
      (left.classroomId || "") === (right.classroomId || "") &&
      left.teacherId === right.teacherId
    );
  }, []);

  const isDirty = useMemo(() => {
    if (localAllocations.length !== originalAllocations.length) return true;

    return localAllocations.some((local) => {
      const original = originalAllocations.find(
        (item) =>
          item.sectionId === local.sectionId &&
          item.subjectId === local.subjectId &&
          (item.classroomId || "") === (local.classroomId || "")
      );
      return !original || !allocationsEqual(local, original);
    });
  }, [allocationsEqual, localAllocations, originalAllocations]);

  const filteredSections = useMemo(() => {
    let result = sections;

    if (selectedGradeId) {
      result = result.filter((section) => section.gradeId === selectedGradeId);
    }

    if (selectedSectionId) {
      result = result.filter((section) => section.id === selectedSectionId);
    }

    return result;
  }, [sections, selectedGradeId, selectedSectionId]);

  const selectedSectionClassrooms = useMemo(() => {
    if (!selectedSectionId) return [];
    return classrooms.filter((classroom) => classroom.sectionId === selectedSectionId);
  }, [classrooms, selectedSectionId]);

  useEffect(() => {
    if (grades.length === 0 && sections.length === 0 && classrooms.length === 0) {
      return;
    }

    const normalizedGradeId = grades.some((grade) => grade.id === selectedGradeId)
      ? selectedGradeId
      : "";
    const normalizedSectionId = sections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId)
    )
      ? selectedSectionId
      : "";
    const normalizedClassroomId = classrooms.some(
      (classroom) =>
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId)
    )
      ? selectedClassroomId
      : "";

    if (
      normalizedGradeId === selectedGradeId &&
      normalizedSectionId === selectedSectionId &&
      normalizedClassroomId === selectedClassroomId
    ) {
      return;
    }

    syncQueryParams(
      {
        selectedGradeId: normalizedGradeId,
        selectedSectionId: normalizedSectionId,
        selectedClassroomId: normalizedClassroomId,
      },
      "replace"
    );
  }, [
    classrooms,
    grades,
    sections,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    syncQueryParams,
  ]);

  const filteredSubjects = useMemo(() => {
    let result = subjects;

    if (selectedGradeId) {
      const subjectsWithHours = new Set(
        subjectAllocations
          .filter((allocation) => allocation.gradeId === selectedGradeId && allocation.weeklyHours > 0)
          .map((allocation) => allocation.subjectId)
      );
      result = result.filter((subject) => subjectsWithHours.has(subject.id));
    }

    if (selectedSubjectId) {
      result = result.filter((subject) => subject.id === selectedSubjectId);
    }

    return result;
  }, [selectedGradeId, selectedSubjectId, subjectAllocations, subjects]);

  const teacherLoads = useMemo(() => {
    const loads = new Map<string, number>();

    localAllocations.forEach((allocation) => {
      if (!allocation.teacherId) return;

      const section = sections.find((item) => item.id === allocation.sectionId);
      if (!section) return;

      const subjectAllocation = subjectAllocations.find(
        (item) => item.gradeId === section.gradeId && item.subjectId === allocation.subjectId
      );

      if (!subjectAllocation || subjectAllocation.weeklyHours <= 0) return;

      const currentLoad = loads.get(allocation.teacherId) || 0;
      loads.set(allocation.teacherId, currentLoad + subjectAllocation.weeklyHours);
    });

    return loads;
  }, [localAllocations, sections, subjectAllocations]);

  const getAllocation = useCallback(
    (sectionId: string, subjectId: string, classroomId?: string) => {
      const allocation = resolveTeacherAllocationForTarget(localAllocations, {
        sectionId,
        classroomId,
        subjectId,
      });
      return allocation?.teacherId || null;
    },
    [localAllocations]
  );

  const setAllocation = useCallback(
    (sectionId: string, subjectId: string, teacherId: string | null, classroomId?: string) => {
      setLocalAllocations((previous) => {
        const existing = previous.find(
          (allocation) =>
            allocation.sectionId === sectionId &&
            allocation.subjectId === subjectId &&
            (allocation.classroomId || "") === (classroomId || "")
        );

        if (existing) {
          return previous.map((allocation) =>
            allocation.sectionId === sectionId &&
            allocation.subjectId === subjectId &&
            (allocation.classroomId || "") === (classroomId || "")
              ? { ...allocation, teacherId, classroomId }
              : allocation
          );
        }

        return [
          ...previous,
          {
            id: `temp-${Date.now()}-${Math.random()}`,
            termId,
            sectionId,
            classroomId,
            subjectId,
            teacherId,
          },
        ];
      });
    },
    [termId]
  );

  const getMissingCount = useCallback(
    (sectionId: string, classroomId?: string) => {
      return filteredSubjects.filter((subject) => {
        const allocation = resolveTeacherAllocationForTarget(localAllocations, {
          sectionId,
          classroomId,
          subjectId: subject.id,
        });
        return !allocation || !allocation.teacherId;
      }).length;
    },
    [filteredSubjects, localAllocations]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const items = localAllocations.map((allocation) => ({
        sectionId: allocation.sectionId,
        classroomId: allocation.classroomId,
        subjectId: allocation.subjectId,
        teacherId: allocation.teacherId,
      }));

      await bulkUpsertTeacherAllocations(termId, items);
      await onRefresh();
      setOriginalAllocations(localAllocations);
    } catch (error) {
      console.error("Failed to save allocations:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalAllocations(originalAllocations);
  };

  const displaySections = useMemo(() => {
    if (!showOnlyMissing) return filteredSections;
    return filteredSections.filter((section) => getMissingCount(section.id) > 0);
  }, [filteredSections, getMissingCount, showOnlyMissing]);

  const matrixRows = useMemo<TargetRow[]>(() => {
    const getGradeName = (gradeId: string) => {
      const grade = grades.find((item) => item.id === gradeId);
      return grade
        ? locale === "ar"
          ? (grade.nameAr || grade.nameEn || grade.name)
          : (grade.nameEn || grade.nameAr || grade.name)
        : "-";
    };

    if (selectedSectionId && selectedSectionClassrooms.length > 0) {
      const rows = selectedSectionClassrooms
        .filter((classroom) => !selectedClassroomId || classroom.id === selectedClassroomId)
        .map((classroom) => {
          const section = sections.find((item) => item.id === classroom.sectionId)!;
          const sectionName = locale === "ar"
            ? (section.nameAr || section.nameEn || section.name)
            : (section.nameEn || section.nameAr || section.name);
          const classroomName = locale === "ar"
            ? (classroom.nameAr || classroom.nameEn || classroom.name)
            : (classroom.nameEn || classroom.nameAr || classroom.name);
          return {
            id: classroom.id,
            section,
            classroom,
            label: classroomName,
            secondaryLabel: `${getGradeName(section.gradeId)} / ${sectionName}`,
          };
        });

      if (!showOnlyMissing) return rows;
      return rows.filter((row) => getMissingCount(row.section.id, row.classroom?.id) > 0);
    }

    return displaySections.map((section) => {
      const sectionName = locale === "ar"
        ? (section.nameAr || section.nameEn || section.name)
        : (section.nameEn || section.nameAr || section.name);
      return {
        id: section.id,
        section,
        label: sectionName,
        secondaryLabel: getGradeName(section.gradeId),
      };
    });
  }, [displaySections, getMissingCount, grades, locale, sections, selectedClassroomId, selectedSectionClassrooms, selectedSectionId, showOnlyMissing]);

  const matrixColumns = useMemo<(MatrixColumn & { subject: Subject })[]>(() => {
    return filteredSubjects.map((subject) => ({
      id: subject.id,
      subject,
      label: locale === "ar"
        ? (subject.nameAr || subject.nameEn || subject.name)
        : (subject.nameEn || subject.nameAr || subject.name),
      code: subject.code,
      minWidth: "250px",
    }));
  }, [filteredSubjects, locale]);

  const completionPercentage = useMemo(() => {
    const totalCells = matrixRows.length * filteredSubjects.length;
    if (totalCells === 0) return 0;

    const filledCells = matrixRows.reduce((count, row) => {
      return count + filteredSubjects.filter((subject) => {
        const allocation = resolveTeacherAllocationForTarget(localAllocations, {
          sectionId: row.section.id,
          classroomId: row.classroom?.id,
          subjectId: subject.id,
        });
        return Boolean(allocation?.teacherId);
      }).length;
    }, 0);

    return Math.round((filledCells / totalCells) * 100);
  }, [filteredSubjects, localAllocations, matrixRows]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName,
      termName,
      exportDate: formatExportDate(locale),
    };

    if (selectedGradeId) {
      const grade = grades.find((item) => item.id === selectedGradeId);
      if (grade) metadata.gradeName = locale === "ar" ? grade.nameAr : grade.nameEn;
    }

    if (selectedSectionId) {
      const section = sections.find((item) => item.id === selectedSectionId);
      if (section) metadata.sectionName = locale === "ar" ? section.nameAr : section.nameEn;
    }

    if (selectedClassroomId) {
      const classroom = classrooms.find((item) => item.id === selectedClassroomId);
      if (classroom) metadata.classroomName = locale === "ar" ? classroom.nameAr : classroom.nameEn;
    }

    const columns: ExportColumn[] = [
      { key: "section", label: t("matrix.columns.section") },
      { key: "grade", label: t("matrix.columns.grade") },
      ...(selectedSectionId && selectedSectionClassrooms.length > 0
        ? [{ key: "classroom", label: t("filters.classroom") }]
        : []),
      ...filteredSubjects.map((subject) => ({
        key: `subject_${subject.id}`,
        label: locale === "ar" ? subject.nameAr : subject.nameEn,
      })),
    ];

    const rows = matrixRows.map((row) => {
      const grade = grades.find((item) => item.id === row.section.gradeId);
      const record: Record<string, unknown> = {
        section: locale === "ar" ? row.section.nameAr : row.section.nameEn,
        grade: grade ? (locale === "ar" ? grade.nameAr : grade.nameEn) : "",
      };

      if (row.classroom) {
        record.classroom = locale === "ar" ? row.classroom.nameAr : row.classroom.nameEn;
      }

      filteredSubjects.forEach((subject) => {
        const allocation = resolveTeacherAllocationForTarget(localAllocations, {
          sectionId: row.section.id,
          classroomId: row.classroom?.id,
          subjectId: subject.id,
        });
        const teacher = allocation?.teacherId
          ? teachers.find((item) => item.id === allocation.teacherId)
          : null;
        record[`subject_${subject.id}`] = teacher
          ? locale === "ar"
            ? teacher.nameAr
            : teacher.nameEn
          : "";
      });

      return record;
    });

    const filename = generateExportFilename(
      "teacher-allocation",
      termId,
      selectedClassroomId || selectedSectionId || selectedGradeId || undefined
    );

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename,
      format,
      columns,
      rows,
      locale,
      jsonData: {
        title: t("title"),
        metadata,
        rows,
      },
    });
  };

  const handleOpenBulkAction = (gradeId: string, subjectId: string, teacherId: string | null) => {
    if (!teacherId || !selectedGradeId) return;

    const grade = grades.find((item) => item.id === gradeId);
    const subject = subjects.find((item) => item.id === subjectId);
    const teacher = teachers.find((item) => item.id === teacherId);

    if (grade && subject && teacher) {
      setBulkActionGrade(grade);
      setBulkActionSubject(subject);
      setBulkActionTeacher(teacher);
      setBulkActionDialogOpen(true);
    }
  };

  const renderCell = (row: TargetRow, column: MatrixColumn & { subject: Subject }) => {
    const teacherId = getAllocation(row.section.id, column.subject.id, row.classroom?.id);

    return (
      <div className="px-4 py-3">
        <TeacherSelect
          teachers={teachers}
          value={teacherId}
          onChange={(newTeacherId) => setAllocation(row.section.id, column.subject.id, newTeacherId, row.classroom?.id)}
          disabled={isReadOnly}
          teacherLoads={teacherLoads}
          size="small"
        />
      </div>
    );
  };

  const renderColumnHeader = (column: MatrixColumn & { subject: Subject }) => {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <span className={isRTL ? "text-right" : "text-left"}>{column.label}</span>
          {column.code && (
            <span className="inline-flex">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                {column.code}
              </span>
            </span>
          )}
        </div>
        {selectedGradeId && !selectedSectionId && !isReadOnly && (
          <Tooltip title={t("actions.applyToAllSections")} arrow>
            <IconButton
              size="small"
              onClick={() => {
                const firstRow = matrixRows[0];
                if (!firstRow) return;
                const teacherId = getAllocation(firstRow.section.id, column.subject.id);
                if (teacherId) {
                  handleOpenBulkAction(selectedGradeId, column.subject.id, teacherId);
                }
              }}
              sx={{
                padding: "4px",
                color: "var(--color-primary, #006D82)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-100, #e0f2f5)",
                },
              }}
            >
              <Users className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    );
  };

  const handleBulkActionSuccess = async () => {
    await onRefresh();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <FilterBar
        grades={grades}
        sections={sections}
        classrooms={classrooms}
        subjects={subjects}
        selectedGradeId={selectedGradeId}
        selectedSectionId={selectedSectionId}
        selectedClassroomId={selectedClassroomId}
        selectedSubjectId={selectedSubjectId}
        showOnlyMissing={showOnlyMissing}
        onGradeChange={(gradeId) =>
          syncQueryParams(
            {
              selectedGradeId: gradeId,
              selectedSectionId: "",
              selectedClassroomId: "",
            },
            "push"
          )
        }
        onSectionChange={(sectionId) =>
          syncQueryParams(
            {
              selectedSectionId: sectionId,
              selectedClassroomId: "",
            },
            "push"
          )
        }
        onClassroomChange={(classroomId) =>
          syncQueryParams({ selectedClassroomId: classroomId }, "push")
        }
        onSubjectChange={(subjectId) =>
          syncQueryParams({ selectedSubjectId: subjectId }, "push")
        }
        onShowOnlyMissingChange={(show) =>
          syncQueryParams({ showOnlyMissing: show }, "push")
        }
        onValidate={onValidate}
      />

      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t("matrix.title")}</h2>
              <div className="flex items-center gap-6 text-sm text-gray-600 mt-1 flex-wrap">
                <span>
                  {t("matrix.summary.sections")}: <strong>{matrixRows.length}</strong>
                </span>
                <span>
                  {t("matrix.summary.subjects")}: <strong>{filteredSubjects.length}</strong>
                </span>
                <span>
                  {t("matrix.summary.completion")}: <strong>{completionPercentage}%</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <div className="flex items-center gap-2 text-sm text-amber-600 mr-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t("unsavedChanges.message")}</span>
                </div>
              )}
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={matrixRows.length === 0 || filteredSubjects.length === 0}
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
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto">
            {matrixRows.length === 0 || filteredSubjects.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500">
                  {matrixRows.length === 0
                    ? t("emptyState.noGrades.message")
                    : t("emptyState.noSubjects.message")}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <AllocationMatrixTable
                  rows={matrixRows}
                  columns={matrixColumns}
                  rowHeaderLabel={selectedSectionId && selectedSectionClassrooms.length > 0 ? t("filters.classroom") : t("matrix.section")}
                  totalColumnLabel={t("matrix.missingCount")}
                  showPagination
                  itemsPerPage={10}
                  renderCell={renderCell}
                  renderColumnHeader={renderColumnHeader}
                  renderRowTotal={(row) => {
                    const typedRow = row as TargetRow;
                    const missingCount = getMissingCount(typedRow.section.id, typedRow.classroom?.id);
                    return (
                      <div className="flex items-center justify-center">
                        {missingCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-200 text-primary-900">
                            {missingCount}
                          </span>
                        ) : (
                          <span className="text-green-600"><CheckCircle className="w-7 h-7" /></span>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <BulkActionDialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
        termId={termId}
        grade={bulkActionGrade}
        subject={bulkActionSubject}
        teacher={bulkActionTeacher}
        sections={sections}
        classrooms={classrooms}
        onSuccess={handleBulkActionSuccess}
      />

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("actions.export")}
        subtitle={t("matrix.title")}
        datasetCount={matrixRows.length}
      />
    </div>
  );
}
