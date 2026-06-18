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
  academicYearId: string;
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
  academicYearId,
  termId,
  gradeId,
  subjectId,
  gradeName,
  subjectName,
}: CreateCurriculumDialogProps) {
  const t = useTranslations("academics.curriculum.create_dialog");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultTitle = `${gradeName} - ${subjectName}`;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createCurriculum({
        academicYearId,
        termId,
        gradeId,
        subjectId,
        title: title.trim() || defaultTitle,
        description: description.trim() || null,
      });
      onSuccess();
      setTitle("");
      setDescription("");
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={defaultTitle}
          helperText={t("name_helper")}
        />
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
