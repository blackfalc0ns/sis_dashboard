"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Application } from "@/features/admissions/types/admissions";
import {
  fetchAcademicStructureTree,
  type AcademicStructureGrade,
  type AcademicStructureSection,
  type AcademicStructureClassroom,
} from "@/features/academics/services/academicStructureApiService";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import { Modal } from "@/components/ui/modal";
import Select from "@/components/ui/input/Select";
import { Button } from "@/components/ui/button";

export interface EnrollmentFormData {
  academicYear: string;
  grade: string;
  section: string;
  classroom: string;
  startDate: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

interface EnrollmentFormProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnrollmentFormData) => void | Promise<void>;
}

export default function EnrollmentForm({
  application,
  isOpen,
  onClose,
  onSubmit,
}: EnrollmentFormProps) {
  const t = useTranslations("admissions.enrollment_form");
  const locale = useLocale();
  const { academicYears, yearId, termId, isReadOnly } = useAdmissionsYearTermContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [grades, setGrades] = useState<AcademicStructureGrade[]>([]);
  const [sections, setSections] = useState<AcademicStructureSection[]>([]);
  const [classrooms, setClassrooms] = useState<AcademicStructureClassroom[]>([]);

  const [formData, setFormData] = useState<EnrollmentFormData>({
    academicYear: "",
    grade: "",
    section: "",
    classroom: "",
    startDate: new Date().toISOString().split("T")[0],
    gradeId: undefined,
    sectionId: undefined,
    classroomId: undefined,
  });

  // Fetch academic structure from API
  useEffect(() => {
    if (!isOpen || !yearId || !termId) return;

    let cancelled = false;
    void fetchAcademicStructureTree({ yearId, termId })
      .then((tree) => {
        if (cancelled) return;
        setGrades(tree.grades);
        setSections(tree.sections);
        setClassrooms(tree.classrooms);
      })
      .catch((err) => {
        console.error("Failed to load academic structure:", err);
      });

    return () => { cancelled = true; };
  }, [isOpen, yearId, termId]);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const yearName = academicYears.find((y) => y.id === yearId)?.name || "";
    setFormData({
      academicYear: yearName,
      grade: "",
      section: "",
      classroom: "",
      startDate: new Date().toISOString().split("T")[0],
      gradeId: undefined,
      sectionId: undefined,
      classroomId: undefined,
    });
  }, [isOpen, academicYears, yearId]);

  const gradeOptions = useMemo(
    () => grades.map((g) => ({ value: g.id, label: g.nameEn || g.nameAr || g.name })),
    [grades],
  );

  const sectionOptions = useMemo(() => {
    if (!formData.gradeId) return [];
    return sections
      .filter((s) => s.gradeId === formData.gradeId)
      .map((s) => ({ value: s.id, label: s.nameEn || s.nameAr || s.name }));
  }, [sections, formData.gradeId]);

  const classroomOptions = useMemo(() => {
    if (!formData.sectionId) return [];
    return classrooms
      .filter((c) => c.sectionId === formData.sectionId)
      .map((c) => ({ value: c.id, label: c.nameEn || c.nameAr || c.name }));
  }, [classrooms, formData.sectionId]);

  const studentName =
    locale === "ar"
      ? application.full_name_ar || application.studentName
      : application.full_name_en || application.studentName;

  const canSubmit =
    !isReadOnly &&
    !isSubmitting &&
    !!formData.gradeId &&
    !!formData.sectionId &&
    !!formData.classroomId &&
    !!formData.startDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={`${studentName} - ${application.id}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? t("enrolling") : t("confirm_enrollment")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Accepted banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <p className="text-sm font-semibold text-emerald-900">
              {t("application_accepted")}
            </p>
          </div>
          <p className="text-sm text-emerald-700">
            {t("ready_for_enrollment")}
          </p>
        </div>

        {/* Academic Year (read-only) */}
        <Select
          label={t("academic_year")}
          required
          disabled
          value={yearId || ""}
          options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
        />

        {/* Grade */}
        <Select
          label={t("grade")}
          required
          placeholder={t("select_grade")}
          value={formData.gradeId || ""}
          options={gradeOptions}
          disabled={isReadOnly}
          onChange={(val) => {
            const selected = grades.find((g) => g.id === val);
            setFormData((prev) => ({
              ...prev,
              gradeId: val,
              grade: selected?.nameEn || selected?.name || "",
              sectionId: undefined,
              section: "",
              classroomId: undefined,
              classroom: "",
            }));
          }}
        />

        {/* Section */}
        <Select
          label={t("section")}
          required
          placeholder={t("select_section")}
          value={formData.sectionId || ""}
          options={sectionOptions}
          disabled={isReadOnly || !formData.gradeId}
          onChange={(val) => {
            const selected = sections.find((s) => s.id === val);
            setFormData((prev) => ({
              ...prev,
              sectionId: val,
              section: selected?.nameEn || selected?.name || "",
              classroomId: undefined,
              classroom: "",
            }));
          }}
        />

        {/* Classroom */}
        <Select
          label={t("classroom")}
          required
          placeholder={t("select_classroom")}
          value={formData.classroomId || ""}
          options={classroomOptions}
          disabled={isReadOnly || !formData.sectionId}
          onChange={(val) => {
            const selected = classrooms.find((c) => c.id === val);
            setFormData((prev) => ({
              ...prev,
              classroomId: val,
              classroom: selected?.nameEn || selected?.name || "",
            }));
          }}
        />

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("start_date")} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            required
            disabled={isReadOnly}
          />
        </div>
      </form>
    </Modal>
  );
}
