"use client";

import { useTranslations } from "next-intl";
import { Input, Select, DatePicker, TextArea } from "@/components/ui/input";

interface StudentInfoStepProps {
  formData: {
    full_name_ar: string;
    full_name_en: string;
    gender: string;
    date_of_birth: string;
    nationality: string;
    stage: string;
    address_line: string;
    city: string;
    district: string;
    student_phone: string;
    student_email: string;
    grade_requested: string;
    previous_school: string;
    medical_conditions: string;
    notes: string;
  };
  errors: Record<string, string>;
  updateFormData: (field: string, value: unknown) => void;
}

export default function StudentInfoStep({
  formData,
  errors,
  updateFormData,
}: StudentInfoStepProps) {
  const t = useTranslations("admissions.create_application");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 mb-4">{t("student.title")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t("student.full_name_ar")}
          value={formData.full_name_ar}
          onChange={(e) => updateFormData("full_name_ar", e.target.value)}
          error={errors.full_name_ar}
          placeholder={t("student.full_name_ar_placeholder")}
          required
          dir="rtl"
        />
        <Input
          label={t("student.full_name_en")}
          value={formData.full_name_en}
          onChange={(e) => updateFormData("full_name_en", e.target.value)}
          error={errors.full_name_en}
          placeholder={t("student.full_name_en_placeholder")}
          required
        />
        <DatePicker
          label={t("student.date_of_birth")}
          value={
            formData.date_of_birth ? new Date(formData.date_of_birth) : null
          }
          onChange={(date) =>
            updateFormData(
              "date_of_birth",
              date ? date.toISOString().split("T")[0] : "",
            )
          }
          error={errors.date_of_birth}
          disableFuture
          required
        />
        <Select
          label={t("student.gender")}
          value={formData.gender}
          onChange={(value) => updateFormData("gender", value)}
          error={errors.gender}
          placeholder={t("student.grade_placeholder")}
          options={[
            { value: "male", label: t("student.male") },
            { value: "female", label: t("student.female") },
          ]}
          required
        />
        <Input
          label={t("student.nationality")}
          value={formData.nationality}
          onChange={(e) => updateFormData("nationality", e.target.value)}
          error={errors.nationality}
          placeholder={t("student.nationality_placeholder")}
          required
        />
        <Select
          label={t("student.stage")}
          value={formData.stage}
          onChange={(value) => updateFormData("stage", value)}
          placeholder={t("student.stage_placeholder")}
          options={[
            { value: "Primary", label: t("student.primary") },
            { value: "Preparatory", label: t("student.preparatory") },
            { value: "Secondary", label: t("student.secondary") },
          ]}
        />
        <Select
          label={t("student.grade_requested")}
          value={formData.grade_requested}
          onChange={(value) => updateFormData("grade_requested", value)}
          error={errors.grade_requested}
          placeholder={t("student.grade_placeholder")}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => ({
            value: grade.toString(),
            label: `Grade ${grade}`,
          }))}
          required
        />
        <Input
          label={t("student.address_line")}
          value={formData.address_line}
          onChange={(e) => updateFormData("address_line", e.target.value)}
          placeholder={t("student.address_placeholder")}
        />
        <Input
          label={t("student.city")}
          value={formData.city}
          onChange={(e) => updateFormData("city", e.target.value)}
          placeholder={t("student.city_placeholder")}
        />
        <Input
          label={t("student.district")}
          value={formData.district}
          onChange={(e) => updateFormData("district", e.target.value)}
          placeholder={t("student.district_placeholder")}
        />
        <Input
          label={t("student.student_phone")}
          type="tel"
          value={formData.student_phone}
          onChange={(e) => updateFormData("student_phone", e.target.value)}
          error={errors.student_phone}
          placeholder={t("guardian.phone_primary_placeholder")}
        />
        <Input
          label={t("student.student_email")}
          type="email"
          value={formData.student_email}
          onChange={(e) => updateFormData("student_email", e.target.value)}
          error={errors.student_email}
          placeholder={t("guardian.email_placeholder")}
        />
        <Input
          label={t("student.previous_school")}
          value={formData.previous_school}
          onChange={(e) => updateFormData("previous_school", e.target.value)}
          placeholder={t("student.previous_school_placeholder")}
        />
        <Input
          label={t("student.medical_conditions")}
          value={formData.medical_conditions}
          onChange={(e) => updateFormData("medical_conditions", e.target.value)}
          placeholder={t("student.medical_placeholder")}
        />
        <div className="md:col-span-2">
          <TextArea
            label={t("student.notes")}
            value={formData.notes}
            onChange={(e) => updateFormData("notes", e.target.value)}
            rows={3}
            placeholder={t("student.notes_placeholder")}
          />
        </div>
      </div>
    </div>
  );
}
