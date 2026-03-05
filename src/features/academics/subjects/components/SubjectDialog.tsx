"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import {
  Subject,
  createSubject,
  updateSubject,
} from "@/features/academics/subjects/services/subjectsService";

interface SubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  termId: string;
  subject?: Subject | null;
  existingSubjects: Subject[];
}

export default function SubjectDialog({
  isOpen,
  onClose,
  onSuccess,
  termId,
  subject,
  existingSubjects,
}: SubjectDialogProps) {
  const t = useTranslations("academics.subjects.subject_dialog");
  const tValidation = useTranslations("validation");

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bilingualErrors, setBilingualErrors] = useState<{ ar?: string; en?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track original values for dirty checking
  const [originalValues, setOriginalValues] = useState({
    nameAr: "",
    nameEn: "",
    code: "",
    stage: "",
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      const initialValues = {
        nameAr: subject?.nameAr || "",
        nameEn: subject?.nameEn || "",
        code: subject?.code || "",
        stage: subject?.stage || "",
        isActive: subject?.isActive ?? true,
      };

      setNameAr(initialValues.nameAr);
      setNameEn(initialValues.nameEn);
      setCode(initialValues.code);
      setStage(initialValues.stage);
      setIsActive(initialValues.isActive);
      setOriginalValues(initialValues);
      setIsDirty(false);
      setErrors({});
      setBilingualErrors({});
    }
  }, [isOpen, subject]);

  // Track dirty state
  useEffect(() => {
    const currentValues = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      code: code.trim(),
      stage: stage.trim(),
      isActive,
    };

    const dirty =
      currentValues.nameAr !== originalValues.nameAr.trim() ||
      currentValues.nameEn !== originalValues.nameEn.trim() ||
      currentValues.code !== originalValues.code.trim() ||
      currentValues.stage !== originalValues.stage.trim() ||
      currentValues.isActive !== originalValues.isActive;

    setIsDirty(dirty);
  }, [nameAr, nameEn, code, stage, isActive, originalValues]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newBilingualErrors: { ar?: string; en?: string } = {};

    // Required validation
    if (!nameAr.trim()) {
      newBilingualErrors.ar = tValidation("required_ar");
    }
    if (!nameEn.trim()) {
      newBilingualErrors.en = tValidation("required_en");
    }

    // AR != EN validation
    if (nameAr.trim() && nameEn.trim()) {
      const arEnErrors = validateArEnDifferent(nameAr, nameEn);
      if (arEnErrors.arError) {
        newBilingualErrors.ar = tValidation("arEnMustDiffer");
      }
      if (arEnErrors.enError) {
        newBilingualErrors.en = tValidation("arEnMustDiffer");
      }
    }

    // Check for duplicate names (case-insensitive, excluding current subject)
    // Only check if AR != EN validation passed
    if (nameAr.trim() && nameEn.trim() && !newBilingualErrors.ar && !newBilingualErrors.en) {
      const duplicateAr = existingSubjects.find(
        (s) =>
          s.id !== subject?.id &&
          s.nameAr.toLowerCase().trim() === nameAr.trim().toLowerCase()
      );
      if (duplicateAr) {
        newBilingualErrors.ar = t("validation.name_duplicate");
      }

      const duplicateEn = existingSubjects.find(
        (s) =>
          s.id !== subject?.id &&
          s.nameEn.toLowerCase().trim() === nameEn.trim().toLowerCase()
      );
      if (duplicateEn) {
        newBilingualErrors.en = t("validation.name_duplicate");
      }
    }

    setErrors(newErrors);
    setBilingualErrors(newBilingualErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newBilingualErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        name: nameEn.trim() || nameAr.trim(), // Fallback display name
        code: code.trim() || undefined,
        stage: stage.trim() || undefined,
        isActive,
      };

      if (subject) {
        await updateSubject(termId, subject.id, payload);
      } else {
        await createSubject(termId, payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save subject:", error);
      setErrors({ submit: t("validation.save_failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageOptions = [
    { value: "", label: t("fields.stage_none") },
    { value: "Primary", label: t("fields.stage_primary") },
    { value: "Middle", label: t("fields.stage_middle") },
    { value: "High", label: t("fields.stage_high") },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subject ? t("edit_title") : t("create_title")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="primary" 
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? t("saving") : subject ? t("save") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <BilingualTextField
          label={t("fields.name")}
          value={{ ar: nameAr, en: nameEn }}
          onChange={(value) => {
            setNameAr(value.ar);
            setNameEn(value.en);
            setBilingualErrors({});
          }}
          requiredAr
          requiredEn
          errors={bilingualErrors}
          placeholder={{
            ar: "مثال: الرياضيات",
            en: "e.g., Mathematics",
          }}
        />

        <Input
          label={t("fields.code")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
          placeholder={t("fields.code_placeholder")}
        />

        <Select
          label={t("fields.stage")}
          value={stage}
          onChange={setStage}
          options={stageOptions}
          selectSize="md"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-border-300"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            {t("fields.is_active")}
          </label>
        </div>

        {errors.submit && (
          <div className="text-sm text-red-600">{errors.submit}</div>
        )}
      </div>
    </Modal>
  );
}
