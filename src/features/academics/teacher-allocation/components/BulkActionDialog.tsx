"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Users, X, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import Button from "@/components/ui/button/Button";
import {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  Teacher,
  applyTeacherToGrade,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

interface BulkActionDialogProps {
  open: boolean;
  onClose: () => void;
  termId: string;
  grade: Grade | null;
  subject: Subject | null;
  teacher: Teacher | null;
  sections: Section[];
  classrooms: Classroom[];
  onSuccess: () => void;
}

export default function BulkActionDialog({
  open,
  onClose,
  termId,
  grade,
  subject,
  teacher,
  sections,
  classrooms,
  onSuccess,
}: BulkActionDialogProps) {
  const t = useTranslations("academics.teacherAllocation.bulkAction");
  const locale = useLocale();

  const [isApplying, setIsApplying] = useState(false);

  // Get sections for the grade
  const gradeSections = sections.filter((s) => s.gradeId === grade?.id);
  const classroomsBySection = gradeSections.reduce<Record<string, string[]>>((accumulator, section) => {
    const classroomIds = classrooms
      .filter((classroom) => classroom.sectionId === section.id)
      .map((classroom) => classroom.id);
    if (classroomIds.length > 0) {
      accumulator[section.id] = classroomIds;
    }
    return accumulator;
  }, {});
  const affectedCount = gradeSections.length;

  const getGradeName = () => {
    if (!grade) return "";
    return locale === "ar"
      ? (grade.nameAr || grade.nameEn)
      : (grade.nameEn || grade.nameAr);
  };

  const getSubjectName = () => {
    if (!subject) return "";
    return locale === "ar"
      ? (subject.nameAr || subject.nameEn)
      : (subject.nameEn || subject.nameAr);
  };

  const getTeacherName = () => {
    if (!teacher) return "";
    return locale === "ar"
      ? (teacher.nameAr || teacher.nameEn)
      : (teacher.nameEn || teacher.nameAr);
  };

  const handleApply = async () => {
    if (!grade || !subject || !teacher) return;

    setIsApplying(true);
    try {
      const sectionIds = gradeSections.map((s) => s.id);
      
      await applyTeacherToGrade(
        termId,
        grade.id,
        subject.id,
        teacher.id,
        sectionIds,
        classroomsBySection
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to apply teacher:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    if (!isApplying) {
      onClose();
    }
  };

  if (!grade || !subject || !teacher) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Users className="w-5 h-5 text-primary" />
        <span className="flex-1 font-semibold">{t("title")}</span>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isApplying}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-6">
          {/* Confirmation Message */}
          <div>
            <p className="text-gray-700 mb-4">
              {t("message", {
                teacher: getTeacherName(),
                subject: getSubjectName(),
                grade: getGradeName(),
              })}
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                Teacher:
              </div>
              <div className="flex-1 text-gray-900 font-medium">
                {getTeacherName()}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                Subject:
              </div>
              <div className="flex-1 text-gray-900">
                {getSubjectName()}
                {subject.code && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                    {subject.code}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                Grade:
              </div>
              <div className="flex-1 text-gray-900">
                {getGradeName()}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                Sections:
              </div>
              <div className="flex-1 text-gray-900 font-semibold">
                {affectedCount}
              </div>
            </div>
          </div>

          {/* Impact Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  {t("impact", { count: affectedCount })}
                </p>
                <p className="text-sm text-amber-700">
                  This will replace any existing teacher assignments for this subject in all sections of this grade.
                </p>
              </div>
            </div>
          </div>

          {/* Affected Sections List */}
          {gradeSections.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Affected Sections:
              </h4>
              <div className="flex flex-wrap gap-2">
                {gradeSections.map((section) => (
                  <span
                    key={section.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {locale === "ar"
                      ? (section.nameAr || section.nameEn)
                      : (section.nameEn || section.nameAr)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
        <Button
          onClick={handleClose}
          variant="secondary"
          disabled={isApplying}
        >
          {t("cancel")}
        </Button>
        <Button
          onClick={handleApply}
          variant="primary"
          leftIcon={<Users className="w-4 h-4" />}
          disabled={isApplying}
        >
          {isApplying ? "Applying..." : t("confirm")}
        </Button>
      </div>
    </Dialog>
  );
}
