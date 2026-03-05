"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { createCurriculum } from "@/features/academics/curriculum/services/curriculumService";

interface CreateCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  termId: string;
  gradeId: string;
  subjectId: string;
  gradeName: string;
  subjectName: string;
}

export default function CreateCurriculumDialog({
  isOpen,
  onClose,
  onSuccess,
  termId,
  gradeId,
  subjectId,
  gradeName,
  subjectName,
}: CreateCurriculumDialogProps) {
  const t = useTranslations("academics.curriculum.create_dialog");

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultName = `${gradeName} - ${subjectName}`;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createCurriculum(termId, gradeId, subjectId, name.trim() || defaultName);
      onSuccess();
      setName("");
    } catch (error) {
      console.error("Failed to create curriculum:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
            {isSubmitting ? t("creating") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t("description")}</p>

        <Input
          label={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultName}
          helperText={t("name_helper")}
        />
      </div>
    </Modal>
  );
}
