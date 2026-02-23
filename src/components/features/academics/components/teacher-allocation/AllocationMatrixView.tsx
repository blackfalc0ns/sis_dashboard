"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Save, RotateCcw, AlertCircle, Users } from "lucide-react";
import { IconButton, Tooltip } from "@mui/material";
import Button from "@/components/ui/button/Button";
import FilterBar from "./FilterBar";
import TeacherSelect from "./TeacherSelect";
import BulkActionDialog from "./BulkActionDialog";
import {
  Grade,
  Section,
} from "@/services/academics/structureService";
import {
  Subject,
  SubjectAllocation,
} from "@/services/academics/subjectsService";
import {
  Teacher,
  TeacherAllocation,
  bulkUpsertTeacherAllocations,
} from "@/services/academics/teacherAllocationService";

interface AllocationMatrixViewProps {
  termId: string;
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
  isReadOnly: boolean;
  onRefresh: () => Promise<void>;
  onValidate: () => void;
  onCopyFromTerm: () => void;
  onAllocationsChange?: (allocations: TeacherAllocation[]) => void;
}

export default function AllocationMatrixView({
  termId,
  grades,
  sections,
  subjects,
  subjectAllocations,
  teachers,
  teacherAllocations,
  isReadOnly,
  onRefresh,
  onValidate,
  onCopyFromTerm,
  onAllocationsChange,
}: AllocationMatrixViewProps) {
  const t = useTranslations("academics.teacherAllocation");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Filter state
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  // Local allocations state
  const [localAllocations, setLocalAllocations] = useState<TeacherAllocation[]>([]);
  const [originalAllocations, setOriginalAllocations] = useState<TeacherAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk action dialog state
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionGrade, setBulkActionGrade] = useState<Grade | null>(null);
  const [bulkActionSubject, setBulkActionSubject] = useState<Subject | null>(null);
  const [bulkActionTeacher, setBulkActionTeacher] = useState<Teacher | null>(null);

  // Initialize local allocations
  useEffect(() => {
    setLocalAllocations(teacherAllocations);
    setOriginalAllocations(teacherAllocations);
  }, [teacherAllocations]);

  // Notify parent of allocation changes
  useEffect(() => {
    onAllocationsChange?.(localAllocations);
  }, [localAllocations, onAllocationsChange]);

  // Track dirty state
  const isDirty = useMemo(() => {
    if (localAllocations.length !== originalAllocations.length) return true;

    return localAllocations.some((local) => {
      const original = originalAllocations.find(
        (o) => o.sectionId === local.sectionId && o.subjectId === local.subjectId
      );
      return !original || original.teacherId !== local.teacherId;
    });
  }, [localAllocations, originalAllocations]);

  // Get sections for selected grade
  const filteredSections = useMemo(() => {
    let result = sections;

    if (selectedGradeId) {
      result = result.filter((s) => s.gradeId === selectedGradeId);
    }

    if (selectedSectionId) {
      result = result.filter((s) => s.id === selectedSectionId);
    }

    return result;
  }, [sections, selectedGradeId, selectedSectionId]);

  // Get subjects with weekly hours > 0 for selected grade
  const filteredSubjects = useMemo(() => {
    let result = subjects;

    if (selectedGradeId) {
      // Only show subjects that have weekly hours for this grade
      const subjectsWithHours = new Set(
        subjectAllocations
          .filter((sa) => sa.gradeId === selectedGradeId && sa.weeklyHours > 0)
          .map((sa) => sa.subjectId)
      );
      result = result.filter((s) => subjectsWithHours.has(s.id));
    }

    if (selectedSubjectId) {
      result = result.filter((s) => s.id === selectedSubjectId);
    }

    return result;
  }, [subjects, subjectAllocations, selectedGradeId, selectedSubjectId]);

  // Calculate teacher loads
  const teacherLoads = useMemo(() => {
    const loads = new Map<string, number>();

    localAllocations.forEach((allocation) => {
      if (!allocation.teacherId) return;

      // Find section's grade
      const section = sections.find((s) => s.id === allocation.sectionId);
      if (!section) return;
      const gradeId = section.gradeId;

      if (!gradeId) return;

      // Find weekly hours for this grade-subject
      const subjectAlloc = subjectAllocations.find(
        (sa) => sa.gradeId === gradeId && sa.subjectId === allocation.subjectId
      );

      if (subjectAlloc && subjectAlloc.weeklyHours > 0) {
        const currentLoad = loads.get(allocation.teacherId) || 0;
        loads.set(allocation.teacherId, currentLoad + subjectAlloc.weeklyHours);
      }
    });

    return loads;
  }, [localAllocations, sections, subjectAllocations]);

  const getAllocation = (sectionId: string, subjectId: string): string | null => {
    const allocation = localAllocations.find(
      (a) => a.sectionId === sectionId && a.subjectId === subjectId
    );
    return allocation?.teacherId || null;
  };

  const setAllocation = (sectionId: string, subjectId: string, teacherId: string | null) => {
    setLocalAllocations((prev) => {
      const existing = prev.find(
        (a) => a.sectionId === sectionId && a.subjectId === subjectId
      );

      if (existing) {
        return prev.map((a) =>
          a.sectionId === sectionId && a.subjectId === subjectId
            ? { ...a, teacherId }
            : a
        );
      } else {
        return [
          ...prev,
          {
            id: `temp-${Date.now()}-${Math.random()}`,
            termId,
            sectionId,
            subjectId,
            teacherId,
          },
        ];
      }
    });
  };

  const getMissingCount = (sectionId: string): number => {
    return filteredSubjects.filter((subject) => {
      const allocation = localAllocations.find(
        (a) => a.sectionId === sectionId && a.subjectId === subject.id
      );
      return !allocation || !allocation.teacherId;
    }).length;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const items = localAllocations.map((a) => ({
        sectionId: a.sectionId,
        subjectId: a.subjectId,
        teacherId: a.teacherId,
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

  const handleOpenBulkAction = (gradeId: string, subjectId: string, teacherId: string | null) => {
    if (!teacherId || !selectedGradeId) return;

    const grade = grades.find((g) => g.id === gradeId);
    const subject = subjects.find((s) => s.id === subjectId);
    const teacher = teachers.find((t) => t.id === teacherId);

    if (grade && subject && teacher) {
      setBulkActionGrade(grade);
      setBulkActionSubject(subject);
      setBulkActionTeacher(teacher);
      setBulkActionDialogOpen(true);
    }
  };

  const handleBulkActionSuccess = async () => {
    await onRefresh();
  };

  const getSectionName = (section: Section) => {
    return locale === "ar"
      ? (section.nameAr || section.nameEn || section.name)
      : (section.nameEn || section.nameAr || section.name);
  };

  const getSubjectName = (subject: Subject) => {
    return locale === "ar"
      ? (subject.nameAr || subject.nameEn || subject.name)
      : (subject.nameEn || subject.nameAr || subject.name);
  };

  // Filter sections by missing if enabled
  const displaySections = useMemo(() => {
    if (!showOnlyMissing) return filteredSections;
    return filteredSections.filter((section) => {
      // Calculate missing count inline
      const missingCount = filteredSubjects.filter((subject) => {
        const allocation = localAllocations.find(
          (a) => a.sectionId === section.id && a.subjectId === subject.id
        );
        return !allocation || !allocation.teacherId;
      }).length;
      return missingCount > 0;
    });
  }, [filteredSections, showOnlyMissing, localAllocations, filteredSubjects]);

  const completionPercentage = useMemo(() => {
    const totalCells = displaySections.length * filteredSubjects.length;
    if (totalCells === 0) return 0;

    const filledCells = displaySections.reduce((count, section) => {
      return (
        count +
        filteredSubjects.filter((subject) => {
          const allocation = localAllocations.find(
            (a) => a.sectionId === section.id && a.subjectId === subject.id
          );
          return allocation && allocation.teacherId;
        }).length
      );
    }, 0);

    return Math.round((filledCells / totalCells) * 100);
  }, [displaySections, filteredSubjects, localAllocations]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Filter Bar */}
      <FilterBar
        grades={grades}
        sections={sections}
        subjects={subjects}
        selectedGradeId={selectedGradeId}
        selectedSectionId={selectedSectionId}
        selectedSubjectId={selectedSubjectId}
        showOnlyMissing={showOnlyMissing}
        onGradeChange={setSelectedGradeId}
        onSectionChange={setSelectedSectionId}
        onSubjectChange={setSelectedSubjectId}
        onShowOnlyMissingChange={setShowOnlyMissing}
        onValidate={onValidate}
        onCopyFromTerm={onCopyFromTerm}
        isReadOnly={isReadOnly}
      />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t("matrix.title")}</h2>
              <div className="flex items-center gap-6 text-sm text-gray-600 mt-1">
                <span>
                  {t("matrix.summary.sections")}: <strong>{displaySections.length}</strong>
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
        </div>
      </div>

      {/* Matrix Table */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          {displaySections.length === 0 || filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">
                {displaySections.length === 0
                  ? t("emptyState.noGrades.message")
                  : t("emptyState.noSubjects.message")}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {/* Section Column Header */}
                      <th
                        className={`sticky ${isRTL ? "right-0" : "left-0"} z-20 px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-xs font-bold uppercase tracking-wider bg-gray-50 border-r border-gray-200`}
                        style={{ minWidth: "200px" }}
                      >
                        {t("matrix.section")}
                      </th>

                      {/* Subject Column Headers */}
                      {filteredSubjects.map((subject) => (
                        <th
                          key={subject.id}
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ minWidth: "250px" }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 flex-1">
                              <span className={isRTL ? "text-right" : "text-left"}>{getSubjectName(subject)}</span>
                              {subject.code && (
                                <span className="inline-flex">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                                    {subject.code}
                                  </span>
                                </span>
                              )}
                            </div>
                            {selectedGradeId && !isReadOnly && (
                              <Tooltip title={t("actions.applyToAllSections")} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    // Get first section's teacher for this subject as default
                                    const firstSection = displaySections[0];
                                    if (firstSection) {
                                      const teacherId = getAllocation(firstSection.id, subject.id);
                                      if (teacherId) {
                                        handleOpenBulkAction(selectedGradeId, subject.id, teacherId);
                                      }
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
                        </th>
                      ))}

                      {/* Missing Count Column Header */}
                      <th
                        className={`sticky ${isRTL ? "left-0" : "right-0"} z-20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-amber-50 border-l border-amber-200`}
                        style={{ minWidth: "100px" }}
                      >
                        {t("matrix.missingCount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySections.map((section, index) => {
                      const missingCount = getMissingCount(section.id);
                      const isEvenRow = index % 2 === 0;

                      return (
                        <tr
                          key={section.id}
                          className={`border-b border-gray-200 ${
                            isEvenRow ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors`}
                        >
                          {/* Section Cell */}
                          <td
                            className={`sticky ${
                              isRTL ? "right-0" : "left-0"
                            } z-10 px-4 py-3 text-sm font-semibold text-gray-900 border-r border-gray-200 ${
                              isEvenRow ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            {getSectionName(section)}
                          </td>

                          {/* Teacher Selection Cells */}
                          {filteredSubjects.map((subject) => {
                            const teacherId = getAllocation(section.id, subject.id);

                            return (
                              <td key={subject.id} className="px-4 py-3">
                                <TeacherSelect
                                  teachers={teachers}
                                  value={teacherId}
                                  onChange={(newTeacherId) =>
                                    setAllocation(section.id, subject.id, newTeacherId)
                                  }
                                  disabled={isReadOnly}
                                  teacherLoads={teacherLoads}
                                  size="small"
                                />
                              </td>
                            );
                          })}

                          {/* Missing Count Cell */}
                          <td
                            className={`sticky ${
                              isRTL ? "left-0" : "right-0"
                            } z-10 px-4 py-3 text-center border-l border-amber-200 ${
                              isEvenRow ? "bg-amber-50" : "bg-amber-100"
                            }`}
                          >
                            {missingCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-900">
                                {missingCount}
                              </span>
                            ) : (
                              <span className="text-green-600">✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Dialog */}
      <BulkActionDialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
        termId={termId}
        grade={bulkActionGrade}
        subject={bulkActionSubject}
        teacher={bulkActionTeacher}
        sections={sections}
        onSuccess={handleBulkActionSuccess}
      />
    </div>
  );
}
