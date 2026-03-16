"use client";

import { useLocale, useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";

interface GradesFiltersPanelProps {
  grades: Array<{ id: string; nameAr: string; nameEn: string }>;
  sections: Array<{ id: string; nameAr: string; nameEn: string }>;
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>;
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  onGradeChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onClassroomChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  selectedContext?: {
    subjectNameAr: string;
    subjectNameEn: string;
    sectionNameAr: string;
    sectionNameEn: string;
  } | null;
  isReadOnly: boolean;
  onCreateAssessment: () => void;
}

export default function GradesFiltersPanel({
  grades,
  sections,
  classrooms,
  subjects,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  selectedSubjectId,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  onSubjectChange,
  selectedContext,
  isReadOnly,
  onCreateAssessment,
}: GradesFiltersPanelProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select
          label={t("filters.grade")}
          value={selectedGradeId}
          onChange={onGradeChange}
          options={grades.map((grade) => ({ value: grade.id, label: locale === "ar" ? grade.nameAr : grade.nameEn }))}
          placeholder={t("filters.selectGrade")}
        />
        <Select
          label={t("filters.section")}
          value={selectedSectionId}
          onChange={onSectionChange}
          options={sections.map((section) => ({ value: section.id, label: locale === "ar" ? section.nameAr : section.nameEn }))}
          placeholder={t("filters.selectSection")}
        />
        <Select
          label={t("filters.classroom")}
          value={selectedClassroomId}
          onChange={onClassroomChange}
          options={[
            { value: "", label: t("filters.allClassrooms") },
            ...classrooms.map((classroom) => ({
              value: classroom.id,
              label: locale === "ar" ? classroom.nameAr : classroom.nameEn,
            })),
          ]}
        />
        <Select
          label={t("filters.subject")}
          value={selectedSubjectId}
          onChange={onSubjectChange}
          options={subjects.map((subject) => ({ value: subject.id, label: locale === "ar" ? subject.nameAr : subject.nameEn }))}
          placeholder={t("filters.selectSubject")}
        />
      </div>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {selectedContext
            ? t("filters.activeContext", {
                subject: locale === "ar" ? selectedContext.subjectNameAr : selectedContext.subjectNameEn,
                section: locale === "ar" ? selectedContext.sectionNameAr : selectedContext.sectionNameEn,
              })
            : t("emptyState.selectFilters")}
        </div>
        <Button
          variant="primary"
          onClick={onCreateAssessment}
          disabled={!selectedSectionId || !selectedSubjectId || isReadOnly}
          leftIcon={<ClipboardCheck className="h-4 w-4" />}
        >
          {t("actions.createAssessment")}
        </Button>
      </div>
    </div>
  );
}
