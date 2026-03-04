"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { Subject } from "@/services/academics/subjectsService";
import { Teacher } from "@/services/academics/teacherAllocationService";

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stages: { id: string; nameAr: string; nameEn: string }[];
  grades: { id: string; nameAr: string; nameEn: string; stageId: string }[];
  sections: { id: string; nameAr: string; nameEn: string; gradeId: string }[];
  subjects: Subject[];
  teachers: Teacher[];
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedSubjectId: string;
  assignedTeacherId: string;
  onApply: (filters: {
    stageId: string;
    gradeId: string;
    sectionId: string;
    subjectId: string;
  }) => void;
}

export default function FiltersDrawer({
  isOpen,
  onClose,
  stages,
  grades,
  sections,
  subjects,
  teachers,
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedSubjectId,
  assignedTeacherId,
  onApply,
}: FiltersDrawerProps) {
  const t = useTranslations("academics.lessonPlans");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Local state for filters
  const [localStageId, setLocalStageId] = useState(selectedStageId);
  const [localGradeId, setLocalGradeId] = useState(selectedGradeId);
  const [localSectionId, setLocalSectionId] = useState(selectedSectionId);
  const [localSubjectId, setLocalSubjectId] = useState(selectedSubjectId);

  // Reset local state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalStageId(selectedStageId);
      setLocalGradeId(selectedGradeId);
      setLocalSectionId(selectedSectionId);
      setLocalSubjectId(selectedSubjectId);
    }
  }, [isOpen, selectedStageId, selectedGradeId, selectedSectionId, selectedSubjectId]);

  const handleStageChange = (stageId: string) => {
    setLocalStageId(stageId);
    setLocalGradeId("");
    setLocalSectionId("");
  };

  const handleGradeChange = (gradeId: string) => {
    setLocalGradeId(gradeId);
    setLocalSectionId("");
  };

  const handleApply = () => {
    onApply({
      stageId: localStageId,
      gradeId: localGradeId,
      sectionId: localSectionId,
      subjectId: localSubjectId,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalStageId("");
    setLocalGradeId("");
    setLocalSectionId("");
    setLocalSubjectId("");
  };

  const assignedTeacher = teachers.find((t) => t.id === assignedTeacherId);

  return (
    <Drawer
      anchor={isRTL ? "right" : "left"}
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: "85%", maxWidth: 400 },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("filters.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stage */}
          <Select
            label={t("filters.stage")}
            value={localStageId}
            onChange={handleStageChange}
            options={[
              { value: "", label: t("filters.selectStage") },
              ...stages.map((stage) => ({
                value: stage.id,
                label: isRTL ? stage.nameAr : stage.nameEn,
              })),
            ]}
          />

          {/* Grade */}
          <Select
            label={t("filters.grade")}
            value={localGradeId}
            onChange={handleGradeChange}
            options={[
              { value: "", label: t("filters.selectGrade") },
              ...grades.map((grade) => ({
                value: grade.id,
                label: isRTL ? grade.nameAr : grade.nameEn,
              })),
            ]}
            disabled={!localStageId}
          />

          {/* Section */}
          <Select
            label={t("filters.section")}
            value={localSectionId}
            onChange={setLocalSectionId}
            options={[
              { value: "", label: t("filters.selectSection") },
              ...sections.map((section) => ({
                value: section.id,
                label: isRTL ? section.nameAr : section.nameEn,
              })),
            ]}
            disabled={!localGradeId}
          />

          {/* Subject */}
          <Select
            label={t("filters.subject")}
            value={localSubjectId}
            onChange={setLocalSubjectId}
            options={[
              { value: "", label: t("filters.selectSubject") },
              ...subjects.map((subject) => ({
                value: subject.id,
                label: isRTL ? subject.nameAr : subject.nameEn,
              })),
            ]}
          />

          {/* Assigned Teacher (Read-only) */}
          {assignedTeacher && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("filters.assignedTeacher")}
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">
                  {isRTL ? assignedTeacher.nameAr : assignedTeacher.nameEn}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={handleApply}
            variant="primary"
            fullWidth
            disabled={!localSectionId || !localSubjectId}
          >
            {t("filters.apply")}
          </Button>
          <Button onClick={handleClear} variant="secondary" fullWidth>
            {t("filters.clear")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
