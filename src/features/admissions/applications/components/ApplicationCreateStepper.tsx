"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Select from "@/components/ui/input/Select";
import { fetchAdmissionsDocumentRequirements } from "@/features/settings/services/settingsService";
import {
  fetchAcademicStructureTree,
  type AcademicStructureGrade as Grade,
} from "@/features/academics/services/academicStructureApiService";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import type { AdmissionsRequiredDocumentConfig } from "@/features/settings/types";
import type { Lead } from "@/features/admissions/leads/types/lead";
import {
  mapLeadChannelToApplicationSource,
  type ApplicationCreationPayload,
} from "@/features/admissions/applications/services/applicationCreationService";

interface ApplicationCreateStepperProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationCreationPayload) => void;
}

interface IntakeFormState {
  studentName: string;
  gradeId: string;
  documents: Record<string, File | null>;
}

export default function ApplicationCreateStepper({
  lead,
  isOpen,
  onClose,
  onSubmit,
}: ApplicationCreateStepperProps) {
  const t = useTranslations("admissions.create_application");
  const { yearId, termId } = useAdmissionsYearTermContext();
  const [form, setForm] = useState<IntakeFormState>({
    studentName: lead?.studentName || "",
    gradeId: "",
    documents: {},
  });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<
    AdmissionsRequiredDocumentConfig[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDocumentRequirements = useMemo(
    () =>
      documentRequirements
        .filter((requirement) => requirement.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [documentRequirements],
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        setIsLoading(true);
        const [requirements, structure] = await Promise.all([
          fetchAdmissionsDocumentRequirements(),
          yearId && termId
            ? fetchAcademicStructureTree({ yearId, termId })
            : Promise.resolve({ grades: [] }),
        ]);
        return { requirements, grades: structure.grades };
      })
      .then(({ requirements, grades: nextGrades }) => {
        if (cancelled) return;
        setDocumentRequirements(requirements);
        setGrades(nextGrades);
        setForm((current) => ({
          ...current,
          studentName: current.studentName || lead?.studentName || "",
          gradeId: current.gradeId || findLeadGradeId(nextGrades, lead?.gradeInterest),
        }));
      })
      .catch((loadError) => {
        if (!cancelled) {
          console.error("Failed to load application intake data:", loadError);
          setError("Failed to load application form data.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, lead?.gradeInterest, lead?.studentName, termId, yearId]);

  if (!isOpen) return null;

  const submit = () => {
    const studentName = form.studentName.trim();
    if (!studentName) {
      setError(t("errors.full_name_en_required"));
      return;
    }
    if (studentName.length > 200) {
      setError(t("errors.student_name_max_length"));
      return;
    }
    if (!form.gradeId) {
      setError(t("errors.grade_required"));
      return;
    }

    onSubmit({
      leadId: lead?.id,
      source: mapLeadChannelToApplicationSource(lead?.channel),
      requestedAcademicYearId: yearId || undefined,
      student: createStudentPayload(studentName, form.gradeId),
      guardians: [],
      documents: activeDocumentRequirements.map((requirement) => {
        const file = form.documents[requirement.id];
        return {
          configId: requirement.id,
          labelEn: requirement.nameEn,
          labelAr: requirement.nameAr,
          required: requirement.required,
          uploaded: Boolean(file),
          fileName: file?.name,
          file: file || undefined,
        };
      }),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="lg"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">{t("intake_note")}</p>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <TextField
          label={t("student.full_name_en")}
          value={form.studentName}
          onChange={(studentName) => setForm((current) => ({ ...current, studentName }))}
        />
        <Select
          label={t("student.grade_requested")}
          required
          value={form.gradeId}
          options={grades.map(namedOption)}
          onChange={(gradeId) => setForm((current) => ({ ...current, gradeId }))}
        />
        <DocumentInputs
          requirements={activeDocumentRequirements}
          documents={form.documents}
          isLoading={isLoading}
          setDocument={(requirementId, file) =>
            setForm((current) => ({
              ...current,
              documents: { ...current.documents, [requirementId]: file },
            }))
          }
        />
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("buttons.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-hover disabled:opacity-60"
          >
            {t("buttons.submit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DocumentInputs({
  requirements,
  documents,
  isLoading,
  setDocument,
}: {
  requirements: AdmissionsRequiredDocumentConfig[];
  documents: Record<string, File | null>;
  isLoading: boolean;
  setDocument: (requirementId: string, file: File | null) => void;
}) {
  const t = useTranslations("admissions.create_application.documents");
  if (isLoading) {
    return <p className="text-sm text-gray-500">{t("loading")}</p>;
  }
  if (requirements.length === 0) {
    return <p className="text-sm text-gray-500">{t("configured_empty")}</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
      {requirements.map((requirement) => (
        <label
          key={requirement.id}
          className="block rounded-lg border border-gray-200 p-3 text-sm"
        >
          <span className="mb-2 block font-medium text-gray-800">
            {requirement.nameEn}
            {requirement.required && <span className="text-red-500"> *</span>}
          </span>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={(event) =>
              setDocument(requirement.id, event.target.files?.[0] ?? null)
            }
          />
          {documents[requirement.id] && (
            <button
              type="button"
              onClick={() => setDocument(requirement.id, null)}
              className="ms-3 text-sm font-medium text-red-600"
            >
              {t("remove")}
            </button>
          )}
        </label>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}<span className="text-red-500"> *</span>
      <input
        type="text"
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function createStudentPayload(studentName: string, gradeId: string) {
  return {
    first_name_ar: "",
    father_name_ar: "",
    grandfather_name_ar: "",
    family_name_ar: "",
    first_name_en: studentName,
    father_name_en: "",
    grandfather_name_en: "",
    family_name_en: "",
    full_name_ar: "",
    full_name_en: studentName,
    gender: "",
    date_of_birth: "",
    nationality: "",
    stage: "",
    grade_requested: gradeId,
    section: "",
    address_line: "",
    city: "",
    district: "",
    status: "pending",
    join_date: new Date().toISOString().slice(0, 10),
    notes: "",
    previous_school: "",
    medical_conditions: "",
  };
}

function findLeadGradeId(grades: Grade[], gradeInterest?: string): string {
  if (!gradeInterest) return "";
  const normalizedGradeInterest = gradeInterest.toLowerCase();
  return (
    grades.find((grade) =>
      [grade.id, grade.name, grade.nameEn, grade.nameAr]
        .filter(Boolean)
        .some((label) => String(label).toLowerCase() === normalizedGradeInterest),
    )?.id ?? ""
  );
}

function namedOption(namedEntity: { id: string; nameEn?: string; nameAr?: string; name: string }) {
  return { value: namedEntity.id, label: namedEntity.nameEn || namedEntity.nameAr || namedEntity.name };
}
