"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import {
  Subject,
  createSubject,
  updateSubject,
} from "@/services/academics/subjectsService";

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

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (subject) {
        setName(subject.name);
        setCode(subject.code || "");
        setStage(subject.stage || "");
        setIsActive(subject.isActive);
      } else {
        setName("");
        setCode("");
        setStage("");
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, subject]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("validation.name_required");
    } else {
      // Check for duplicate name (case-insensitive, excluding current subject)
      const duplicate = existingSubjects.find(
        (s) =>
          s.id !== subject?.id &&
          s.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        newErrors.name = t("validation.name_duplicate");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
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
          <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : subject ? t("save") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t("fields.name")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder={t("fields.name_placeholder")}
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
