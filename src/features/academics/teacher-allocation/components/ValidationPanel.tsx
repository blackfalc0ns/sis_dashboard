"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Drawer } from "@mui/material";
import Button from "@/components/ui/button/Button";
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
  ValidationResult,
  validateTeacherAllocations,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

interface ValidationPanelProps {
  open: boolean;
  onClose: () => void;
  termId: string;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
}

interface MissingAssignment {
  gradeId: string;
  gradeName: string;
  sectionId: string;
  sectionName: string;
  classroomId?: string;
  classroomName?: string;
  subjectId: string;
  subjectName: string;
}

interface OverloadedTeacher {
  teacherId: string;
  teacherName: string;
  currentLoad: number;
  maxLoad: number;
}

export default function ValidationPanel({
  open,
  onClose,
  termId,
  grades,
  sections,
  classrooms,
  subjects,
  subjectAllocations,
  teachers,
  teacherAllocations,
}: ValidationPanelProps) {
  const t = useTranslations("academics.teacherAllocation.validation");
  const locale = useLocale();

  const validationResult = useMemo<ValidationResult>(() => {
    const structureData = { grades, sections, classrooms, subjects };
    return validateTeacherAllocations(
      termId,
      structureData,
      subjectAllocations,
      teachers,
      teacherAllocations
    );
  }, [termId, grades, sections, classrooms, subjects, subjectAllocations, teachers, teacherAllocations]);

  const missingAssignments = useMemo<MissingAssignment[]>(() => {
    const missing: MissingAssignment[] = [];

    validationResult.missingAllocations.forEach((item) => {
      const section = sections.find((currentSection) => currentSection.id === item.sectionId);
      const subject = subjects.find((currentSubject) => currentSubject.id === item.subjectId);
      const classroom = item.classroomId
        ? classrooms.find((currentClassroom) => currentClassroom.id === item.classroomId)
        : undefined;

      if (!section || !subject) return;

      const grade = grades.find((currentGrade) => currentGrade.id === section.gradeId);
      if (!grade) return;

      missing.push({
        gradeId: grade.id,
        gradeName: locale === "ar" ? (grade.nameAr || grade.nameEn) : (grade.nameEn || grade.nameAr),
        sectionId: section.id,
        sectionName: locale === "ar" ? (section.nameAr || section.nameEn) : (section.nameEn || section.nameAr),
        classroomId: classroom?.id,
        classroomName: classroom
          ? locale === "ar"
            ? (classroom.nameAr || classroom.nameEn)
            : (classroom.nameEn || classroom.nameAr)
          : undefined,
        subjectId: subject.id,
        subjectName: locale === "ar" ? (subject.nameAr || subject.nameEn) : (subject.nameEn || subject.nameAr),
      });
    });

    return missing;
  }, [validationResult, sections, subjects, classrooms, grades, locale]);

  const overloadedTeachers = useMemo<OverloadedTeacher[]>(() => {
    return validationResult.overloadedTeachers.map((item) => {
      const teacher = teachers.find((currentTeacher) => currentTeacher.id === item.teacherId);
      return {
        teacherId: item.teacherId,
        teacherName: teacher
          ? locale === "ar"
            ? (teacher.nameAr || teacher.nameEn)
            : (teacher.nameEn || teacher.nameAr)
          : item.teacherId,
        currentLoad: item.currentLoad,
        maxLoad: item.maxLoad,
      };
    });
  }, [validationResult, teachers, locale]);

  const missingByGrade = useMemo(() => {
    const grouped = new Map<string, MissingAssignment[]>();

    missingAssignments.forEach((item) => {
      if (!grouped.has(item.gradeId)) {
        grouped.set(item.gradeId, []);
      }
      grouped.get(item.gradeId)!.push(item);
    });

    return grouped;
  }, [missingAssignments]);

  const hasIssues = validationResult.missingCount > 0 || validationResult.overloadedCount > 0;

  return (
    <Drawer
      anchor={locale === "ar" ? "left" : "right"}
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 480 },
          maxWidth: "100%",
        },
      }}
    >
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div
              className={`rounded-lg border-2 p-4 ${
                validationResult.missingCount > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {validationResult.missingCount > 0 ? (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {t("summary.missingAssignments")}
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      validationResult.missingCount > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {validationResult.missingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 bg-amber-50 border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {t("summary.sectionsWithMissing")}
                  </h3>
                  <p className="text-2xl font-bold text-amber-600">
                    {validationResult.sectionsWithMissing}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg border-2 p-4 ${
                validationResult.overloadedCount > 0
                  ? "bg-orange-50 border-orange-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {validationResult.overloadedCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {t("summary.overloadedTeachers")}
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      validationResult.overloadedCount > 0 ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {validationResult.overloadedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!hasIssues && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-800 font-medium">{t("noIssues")}</p>
            </div>
          )}

          {missingAssignments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-red-900">
                  {t("summary.missingAssignments")} ({missingAssignments.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {Array.from(missingByGrade.entries()).map(([gradeId, items]) => {
                  const firstItem = items[0];
                  return (
                    <div key={gradeId} className="p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {firstItem.gradeName}
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div
                            key={`${item.sectionId}-${item.classroomId || "section"}-${item.subjectId}-${index}`}
                            className="flex items-start gap-2 text-sm"
                          >
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <span className="text-gray-900 font-medium">{item.sectionName}</span>
                              {item.classroomName && (
                                <>
                                  <span className="text-gray-500"> • </span>
                                  <span className="text-gray-700">{item.classroomName}</span>
                                </>
                              )}
                              <span className="text-gray-500"> • </span>
                              <span className="text-gray-700">{item.subjectName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {overloadedTeachers.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-orange-900">
                  {t("summary.overloadedTeachers")} ({overloadedTeachers.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {overloadedTeachers.map((teacher) => (
                  <div key={teacher.teacherId} className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {teacher.teacherName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("issues.overloaded", {
                            teacher: teacher.teacherName,
                            current: teacher.currentLoad,
                            max: teacher.maxLoad,
                          })}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">Load:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-orange-500 h-full"
                                style={{
                                  width: `${Math.min((teacher.currentLoad / teacher.maxLoad) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="font-medium text-orange-600">
                              {teacher.currentLoad}h / {teacher.maxLoad}h
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <Button onClick={onClose} variant="primary" className="w-full">
            {t("close")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
