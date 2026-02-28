"use client";

import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { Grade, Section } from "@/services/academics/structureService";

interface FilterBarProps {
  grades: Grade[];
  sections: Section[];
  selectedGradeId: string;
  selectedSectionId: string;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  locale: string;
}

export default function FilterBar({
  grades,
  sections,
  selectedGradeId,
  selectedSectionId,
  onGradeChange,
  onSectionChange,
  locale,
}: FilterBarProps) {
  const t = useTranslations("academics.timetable.filters");

  const gradeOptions = grades.map((grade) => ({
    value: grade.id,
    label: locale === "ar" ? grade.nameAr || grade.name : grade.nameEn || grade.name,
  }));

  const filteredSections = selectedGradeId
    ? sections.filter((s) => s.gradeId === selectedGradeId)
    : [];

  const sectionOptions = filteredSections.map((section) => ({
    value: section.id,
    label: locale === "ar" ? section.nameAr || section.name : section.nameEn || section.name,
  }));

  const handleGradeChange = (value: string) => {
    onGradeChange(value);
    onSectionChange(""); // Reset section when grade changes
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select
            label={t("selectGrade")}
            value={selectedGradeId}
            onChange={handleGradeChange}
            options={gradeOptions}
            placeholder={t("selectGrade")}
          />
        </div>
        <div className="w-64">
          <Select
            label={t("selectSection")}
            value={selectedSectionId}
            onChange={onSectionChange}
            options={sectionOptions}
            placeholder={t("selectSection")}
            disabled={!selectedGradeId}
          />
        </div>
      </div>
    </div>
  );
}
