"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BilingualTextField,
  Button,
  Input,
  Modal,
  Select,
  TextArea,
} from "@/components/ui";
import {
  isTeacherCodeUnique,
  isTeacherEmailUnique,
} from "@/features/teachers/services/teacherService";
import type {
  Teacher,
  TeacherFormData,
  TeacherFormErrors,
  TeacherReferenceData,
  TeacherWorkDay,
} from "@/features/teachers/types";
import {
  getLocalizedReferenceLabel,
  mapTeacherToFormData,
} from "@/features/teachers/utils/teacherMappers";
import {
  normalizeOptionalPhone,
  normalizeTeacherCode,
  validateTeacherForm,
} from "@/features/teachers/utils/teacherValidation";

interface TeacherFormDialogProps {
  isOpen: boolean;
  teacher: Teacher | null;
  referenceData: TeacherReferenceData;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherFormData) => Promise<void> | void;
}

interface SelectionChecklistProps {
  label: string;
  required?: boolean;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  error?: string;
  emptyLabel: string;
  disabled?: boolean;
  onToggle: (id: string) => void;
}

function createEmptyTeacherFormData(): TeacherFormData {
  return {
    code: "",
    firstNameAr: "",
    firstNameEn: "",
    lastNameAr: "",
    lastNameEn: "",
    email: "",
    phone: "",
    gender: "",
    status: "ACTIVE",
    subjectIds: [],
    stageIds: [],
    gradeIds: [],
    sectionIds: [],
    classroomIds: [],
    experienceYears: "",
    workDayFrom: "",
    workDayTo: "",
    workStartTime: "",
    workEndTime: "",
    hireDate: "",
    notesAr: "",
    notesEn: "",
  };
}

function SelectionChecklist({
  label,
  required = false,
  options,
  selectedIds,
  error,
  emptyLabel,
  disabled = false,
  onToggle,
}: SelectionChecklistProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </div>
      <div
        className={`max-h-44 space-y-2 overflow-y-auto rounded-xl border p-3 ${
          error ? "border-red-500" : "border-gray-200"
        } ${disabled ? "bg-gray-50 opacity-70" : "bg-white"}`}
      >
        {options.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyLabel}</p>
        ) : (
          options.map((option) => {
            const checked = selectedIds.includes(option.id);

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
                  disabled ? "cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(option.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-800">{option.label}</span>
              </label>
            );
          })
        )}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export default function TeacherFormDialog({
  isOpen,
  teacher,
  referenceData,
  isSubmitting = false,
  onClose,
  onSubmit,
}: TeacherFormDialogProps) {
  const t = useTranslations("teachers");
  const locale = useLocale();
  const displayLocale = locale === "ar" ? "ar" : "en";

  const [formData, setFormData] = useState<TeacherFormData>(
    createEmptyTeacherFormData(),
  );
  const [errors, setErrors] = useState<TeacherFormErrors>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(teacher ? mapTeacherToFormData(teacher) : createEmptyTeacherFormData());
    setErrors({});
  }, [isOpen, teacher]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const availableGrades = useMemo(
    () =>
      referenceData.grades.filter((grade) =>
        formData.stageIds.includes(grade.stageId),
      ),
    [formData.stageIds, referenceData.grades],
  );

  const availableSections = useMemo(
    () =>
      referenceData.sections.filter((section) =>
        formData.gradeIds.includes(section.gradeId),
      ),
    [formData.gradeIds, referenceData.sections],
  );

  const availableClassrooms = useMemo(
    () =>
      referenceData.classrooms.filter((classroom) =>
        formData.sectionIds.includes(classroom.sectionId),
      ),
    [formData.sectionIds, referenceData.classrooms],
  );

  const resolveError = (field: keyof TeacherFormErrors) =>
    errors[field] ? t(errors[field] as string) : undefined;

  const clearError = (field: keyof TeacherFormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const updateFormData = (
    updates: Partial<TeacherFormData>,
    fieldToClear?: keyof TeacherFormErrors,
  ) => {
    setFormData((current) => ({
      ...current,
      ...updates,
    }));

    if (fieldToClear) {
      clearError(fieldToClear);
    }
  };

  const updateStageSelection = (stageId: string) => {
    const nextStageIds = formData.stageIds.includes(stageId)
      ? formData.stageIds.filter((currentId) => currentId !== stageId)
      : [...formData.stageIds, stageId];

    const nextGradeIds = formData.gradeIds.filter((gradeId) =>
      referenceData.grades.some(
        (grade) =>
          grade.id === gradeId && nextStageIds.includes(grade.stageId),
      ),
    );

    const nextSectionIds = formData.sectionIds.filter((sectionId) =>
      referenceData.sections.some(
        (section) =>
          section.id === sectionId && nextGradeIds.includes(section.gradeId),
      ),
    );

    const nextClassroomIds = formData.classroomIds.filter((classroomId) =>
      referenceData.classrooms.some(
        (classroom) =>
          classroom.id === classroomId &&
          nextSectionIds.includes(classroom.sectionId),
      ),
    );

    setFormData((current) => ({
      ...current,
      stageIds: nextStageIds,
      gradeIds: nextGradeIds,
      sectionIds: nextSectionIds,
      classroomIds: nextClassroomIds,
    }));

    clearError("stageIds");
    clearError("classroomIds");
  };

  const updateGradeSelection = (gradeId: string) => {
    const nextGradeIds = formData.gradeIds.includes(gradeId)
      ? formData.gradeIds.filter((currentId) => currentId !== gradeId)
      : [...formData.gradeIds, gradeId];

    const nextSectionIds = formData.sectionIds.filter((sectionId) =>
      referenceData.sections.some(
        (section) =>
          section.id === sectionId && nextGradeIds.includes(section.gradeId),
      ),
    );

    const nextClassroomIds = formData.classroomIds.filter((classroomId) =>
      referenceData.classrooms.some(
        (classroom) =>
          classroom.id === classroomId &&
          nextSectionIds.includes(classroom.sectionId),
      ),
    );

    setFormData((current) => ({
      ...current,
      gradeIds: nextGradeIds,
      sectionIds: nextSectionIds,
      classroomIds: nextClassroomIds,
    }));

    clearError("gradeIds");
    clearError("classroomIds");
  };

  const updateSectionSelection = (sectionId: string) => {
    const nextSectionIds = formData.sectionIds.includes(sectionId)
      ? formData.sectionIds.filter((currentId) => currentId !== sectionId)
      : [...formData.sectionIds, sectionId];

    const nextClassroomIds = formData.classroomIds.filter((classroomId) =>
      referenceData.classrooms.some(
        (classroom) =>
          classroom.id === classroomId &&
          nextSectionIds.includes(classroom.sectionId),
      ),
    );

    setFormData((current) => ({
      ...current,
      sectionIds: nextSectionIds,
      classroomIds: nextClassroomIds,
    }));

    clearError("sectionIds");
    clearError("classroomIds");
  };

  const updateClassroomSelection = (classroomId: string) => {
    const nextClassroomIds = formData.classroomIds.includes(classroomId)
      ? formData.classroomIds.filter((currentId) => currentId !== classroomId)
      : [...formData.classroomIds, classroomId];

    setFormData((current) => ({
      ...current,
      classroomIds: nextClassroomIds,
    }));

    clearError("classroomIds");
  };

  const updateSubjectSelection = (subjectId: string) => {
    const nextSubjectIds = formData.subjectIds.includes(subjectId)
      ? formData.subjectIds.filter((currentId) => currentId !== subjectId)
      : [...formData.subjectIds, subjectId];

    setFormData((current) => ({
      ...current,
      subjectIds: nextSubjectIds,
    }));

    clearError("subjectIds");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await validateTeacherForm(formData, {
      excludeId: teacher?.id,
      isCodeUnique: (code, excludeId) => isTeacherCodeUnique(code, excludeId),
      isEmailUnique: (email, excludeId) =>
        isTeacherEmailUnique(email, excludeId),
    });

    setErrors(result.errors);

    if (!result.isValid) {
      return;
    }

    await onSubmit(result.normalizedData);
  };

  const genderOptions = [
    { value: "", label: t("fields.select_gender") },
    { value: "MALE", label: t("gender.male") },
    { value: "FEMALE", label: t("gender.female") },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: t("status.active") },
    { value: "INACTIVE", label: t("status.inactive") },
  ];

  const workDayOptions = [
    { value: "", label: t("fields.select_work_day") },
    { value: "SUNDAY", label: t("work_days.sunday") },
    { value: "MONDAY", label: t("work_days.monday") },
    { value: "TUESDAY", label: t("work_days.tuesday") },
    { value: "WEDNESDAY", label: t("work_days.wednesday") },
    { value: "THURSDAY", label: t("work_days.thursday") },
    { value: "FRIDAY", label: t("work_days.friday") },
    { value: "SATURDAY", label: t("work_days.saturday") },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teacher ? t("dialog.edit_title") : t("dialog.create_title")}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="submit"
            form="teacher-form"
            loading={isSubmitting}
          >
            {teacher ? t("dialog.save_action") : t("dialog.create_action")}
          </Button>
        </>
      }
    >
      <form id="teacher-form" className="space-y-6 pb-2" onSubmit={handleSubmit}>
        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t("form.general_section")}
            </h3>
            <p className="text-sm text-gray-500">{t("form.general_help")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label={t("fields.code")}
              value={formData.code}
              onChange={(event) =>
                updateFormData({ code: event.target.value }, "code")
              }
              onBlur={() =>
                updateFormData(
                  { code: normalizeTeacherCode(formData.code) },
                  "code",
                )
              }
              error={resolveError("code")}
              required
            />
            <Input
              label={t("fields.email")}
              type="email"
              value={formData.email}
              onChange={(event) =>
                updateFormData({ email: event.target.value }, "email")
              }
              error={resolveError("email")}
              required
            />
            <Input
              label={t("fields.phone")}
              value={formData.phone}
              onChange={(event) =>
                updateFormData({ phone: event.target.value }, "phone")
              }
              onBlur={() =>
                updateFormData(
                  { phone: normalizeOptionalPhone(formData.phone) },
                  "phone",
                )
              }
              error={resolveError("phone")}
            />
            <Input
              label={t("fields.experience_years")}
              type="number"
              min="0"
              max="60"
              value={formData.experienceYears}
              onChange={(event) =>
                updateFormData(
                  { experienceYears: event.target.value },
                  "experienceYears",
                )
              }
              error={resolveError("experienceYears")}
            />
            <Select
              label={t("fields.work_day_from")}
              value={formData.workDayFrom}
              onChange={(value) =>
                updateFormData(
                  { workDayFrom: value as TeacherWorkDay | "" },
                  "workDayFrom",
                )
              }
              options={workDayOptions}
              error={resolveError("workDayFrom")}
            />
            <Select
              label={t("fields.work_day_to")}
              value={formData.workDayTo}
              onChange={(value) =>
                updateFormData(
                  { workDayTo: value as TeacherWorkDay | "" },
                  "workDayTo",
                )
              }
              options={workDayOptions}
              error={resolveError("workDayTo")}
            />
            <Input
              label={t("fields.work_start_time")}
              type="time"
              value={formData.workStartTime}
              onChange={(event) =>
                updateFormData(
                  { workStartTime: event.target.value },
                  "workStartTime",
                )
              }
              error={resolveError("workStartTime")}
            />
            <Input
              label={t("fields.work_end_time")}
              type="time"
              value={formData.workEndTime}
              onChange={(event) =>
                updateFormData(
                  { workEndTime: event.target.value },
                  "workEndTime",
                )
              }
              error={resolveError("workEndTime")}
            />
            <Input
              label={t("fields.hire_date")}
              type="date"
              value={formData.hireDate}
              onChange={(event) =>
                updateFormData({ hireDate: event.target.value })
              }
            />
            <Select
              label={t("fields.gender")}
              value={formData.gender}
              onChange={(value) =>
                updateFormData({
                  gender: value as TeacherFormData["gender"],
                })
              }
              options={genderOptions}
            />
            <Select
              label={t("fields.status")}
              value={formData.status}
              onChange={(value) =>
                updateFormData({
                  status: value as TeacherFormData["status"],
                })
              }
              options={statusOptions}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BilingualTextField
              label={t("fields.first_name")}
              value={{
                ar: formData.firstNameAr,
                en: formData.firstNameEn,
              }}
              onChange={(value) => {
                setFormData((current) => ({
                  ...current,
                  firstNameAr: value.ar,
                  firstNameEn: value.en,
                }));
                clearError("firstNameAr");
                clearError("firstNameEn");
              }}
              errors={{
                ar: resolveError("firstNameAr"),
                en: resolveError("firstNameEn"),
              }}
            />
            <BilingualTextField
              label={t("fields.last_name")}
              value={{
                ar: formData.lastNameAr,
                en: formData.lastNameEn,
              }}
              onChange={(value) => {
                setFormData((current) => ({
                  ...current,
                  lastNameAr: value.ar,
                  lastNameEn: value.en,
                }));
                clearError("lastNameAr");
                clearError("lastNameEn");
              }}
              errors={{
                ar: resolveError("lastNameAr"),
                en: resolveError("lastNameEn"),
              }}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t("form.assignment_section")}
            </h3>
            <p className="text-sm text-gray-500">{t("dialog.assignment_help")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SelectionChecklist
              label={t("fields.subjects")}
              required
              options={referenceData.subjects.map((subject) => ({
                id: subject.id,
                label: getLocalizedReferenceLabel(subject, displayLocale),
              }))}
              selectedIds={formData.subjectIds}
              error={resolveError("subjectIds")}
              emptyLabel={t("form.no_subjects")}
              onToggle={updateSubjectSelection}
            />
            <SelectionChecklist
              label={t("fields.stages")}
              required
              options={referenceData.stages.map((stage) => ({
                id: stage.id,
                label: getLocalizedReferenceLabel(stage, displayLocale),
              }))}
              selectedIds={formData.stageIds}
              error={resolveError("stageIds")}
              emptyLabel={t("form.no_stages")}
              onToggle={updateStageSelection}
            />
            <SelectionChecklist
              label={t("fields.grades")}
              required
              options={availableGrades.map((grade) => ({
                id: grade.id,
                label: getLocalizedReferenceLabel(grade, displayLocale),
              }))}
              selectedIds={formData.gradeIds}
              error={resolveError("gradeIds")}
              emptyLabel={t("form.select_stage_first")}
              disabled={formData.stageIds.length === 0}
              onToggle={updateGradeSelection}
            />
            <SelectionChecklist
              label={t("fields.sections")}
              required
              options={availableSections.map((section) => ({
                id: section.id,
                label: getLocalizedReferenceLabel(section, displayLocale),
              }))}
              selectedIds={formData.sectionIds}
              error={resolveError("sectionIds")}
              emptyLabel={t("form.select_grade_first")}
              disabled={formData.gradeIds.length === 0}
              onToggle={updateSectionSelection}
            />
            <SelectionChecklist
              label={t("fields.classrooms")}
              required
              options={availableClassrooms.map((classroom) => ({
                id: classroom.id,
                label: getLocalizedReferenceLabel(classroom, displayLocale),
              }))}
              selectedIds={formData.classroomIds}
              error={resolveError("classroomIds")}
              emptyLabel={t("form.select_section_first")}
              disabled={formData.sectionIds.length === 0}
              onToggle={updateClassroomSelection}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t("form.notes_section")}
            </h3>
            <p className="text-sm text-gray-500">{t("form.notes_help")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TextArea
              label={t("fields.notes_ar")}
              dir="rtl"
              rows={4}
              value={formData.notesAr}
              onChange={(event) =>
                updateFormData({ notesAr: event.target.value }, "notesAr")
              }
              error={resolveError("notesAr")}
            />
            <TextArea
              label={t("fields.notes_en")}
              dir="ltr"
              rows={4}
              value={formData.notesEn}
              onChange={(event) =>
                updateFormData({ notesEn: event.target.value }, "notesEn")
              }
              error={resolveError("notesEn")}
            />
          </div>
        </section>
      </form>
    </Modal>
  );
}
