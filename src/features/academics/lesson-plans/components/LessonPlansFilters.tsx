"use client";

import { useTranslations, useLocale } from "next-intl";
import Select from "@/components/ui/input/Select";
import {
  Classroom,
  Grade,
  Section,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { Subject } from "@/features/academics/subjects/services/subjectsService";
import { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

interface LessonPlansFiltersProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  teachers: Teacher[];
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  assignedTeacherId: string;
  onStageChange: (stageId: string) => void;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onClassroomChange: (classroomId: string) => void;
  onSubjectChange: (subjectId: string) => void;
}

export default function LessonPlansFilters({
  stages,
  grades,
  sections,
  classrooms,
  subjects,
  teachers,
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  selectedSubjectId,
  assignedTeacherId,
  onStageChange,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  onSubjectChange,
}: LessonPlansFiltersProps) {
  const t = useTranslations("academics.lessonPlans.filters");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const classroomLabel = isRTL ? "\u0627\u0644\u0641\u0635\u0644" : "Classroom";
  const selectClassroomLabel = isRTL
    ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0635\u0644"
    : "Select Classroom";

  const assignedTeacher = teachers.find((t) => t.id === assignedTeacherId);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Stage */}
        <div className="w-48">
          <Select
            label={t("stage")}
            value={selectedStageId}
            onChange={onStageChange}
            options={[
              { value: "", label: t("stage") },
              ...stages.map((stage) => ({
                value: stage.id,
                label: isRTL ? stage.nameAr : stage.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Grade */}
        <div className="w-48">
          <Select
            label={t("grade")}
            value={selectedGradeId}
            onChange={onGradeChange}
            disabled={!selectedStageId}
            options={[
              { value: "", label: t("grade") },
              ...grades.map((grade) => ({
                value: grade.id,
                label: isRTL ? grade.nameAr : grade.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Section */}
        <div className="w-48">
          <Select
            label={t("section")}
            value={selectedSectionId}
            onChange={onSectionChange}
            disabled={!selectedGradeId}
            options={[
              { value: "", label: t("section") },
              ...sections.map((section) => ({
                value: section.id,
                label: isRTL ? section.nameAr : section.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Subject */}
        <div className="w-48">
          <Select
            label={t("subject")}
            value={selectedSubjectId}
            onChange={onSubjectChange}
            options={[
              { value: "", label: t("subject") },
              ...subjects.map((subject) => ({
                value: subject.id,
                label: isRTL ? subject.nameAr : subject.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Classroom */}
        {classrooms.length > 0 && (
          <div className="w-48">
            <Select
              label={classroomLabel}
              value={selectedClassroomId}
              onChange={onClassroomChange}
              disabled={!selectedSectionId}
              options={[
                { value: "", label: selectClassroomLabel },
                ...classrooms.map((classroom) => ({
                  value: classroom.id,
                  label: isRTL ? classroom.nameAr : classroom.nameEn,
                })),
              ]}
              selectSize="sm"
            />
          </div>
        )}

        {/* Assigned Teacher (display only) */}
        {assignedTeacher && (
          <div className="flex items-center gap-2 mt-6">
            <span className="text-sm text-gray-600">{t("teacher")}:</span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20">
              {isRTL ? assignedTeacher.nameAr : assignedTeacher.nameEn}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
