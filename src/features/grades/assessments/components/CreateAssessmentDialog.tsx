"use client";

import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { DatePicker, Input, Select } from "@/components/ui/input";
import type { Assessment, AssessmentType, CreateAssessmentPayload } from "../types";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface CreateAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAssessmentPayload) => Promise<void>;
  termId: string;
  sectionId: string;
  classroomId?: string;
  subjectId: string;
  isSubmitting: boolean;
  mode?: "create" | "edit";
  initialAssessment?: Assessment | null;
}

export default function CreateAssessmentDialog({
  isOpen,
  onClose,
  onSubmit,
  termId,
  sectionId,
  classroomId,
  subjectId,
  isSubmitting,
  mode = "create",
  initialAssessment = null,
}: CreateAssessmentDialogProps) {
  const t = useTranslations(`academics.grades.dialogs.${mode === "edit" ? "editAssessment" : "createAssessment"}`);
  const isMetadataLocked =
    mode === "edit" &&
    (initialAssessment?.approvalStatus === "approved" || initialAssessment?.approvalStatus === "published");
  const [type, setType] = useState<AssessmentType>(initialAssessment?.type || "QUIZ");
  const [title, setTitle] = useState(initialAssessment?.title || "");
  const [titleAr, setTitleAr] = useState(initialAssessment?.titleAr || "");
  const [date, setDate] = useState<Date | null>(initialAssessment?.date ? new Date(initialAssessment.date) : new Date());
  const [weight, setWeight] = useState(initialAssessment ? String(initialAssessment.weight) : "15");
  const [maxScore, setMaxScore] = useState(initialAssessment ? String(initialAssessment.maxScore) : "20");

  const typeOptions = useMemo(
    () => [
      { value: "QUIZ", label: t("types.quiz") },
      { value: "ASSIGNMENT", label: t("types.assignment") },
      { value: "MIDTERM", label: t("types.midterm") },
      { value: "FINAL", label: t("types.final") },
      { value: "PRACTICAL", label: t("types.practical") },
    ],
    [t],
  );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!date) return;
    await onSubmit({
      termId: initialAssessment?.termId || termId,
      sectionId: initialAssessment?.sectionId || sectionId,
      classroomId: initialAssessment?.classroomId ?? classroomId,
      subjectId: initialAssessment?.subjectId || subjectId,
      type,
      title,
      titleAr,
      date: date.toISOString().slice(0, 10),
      weight: Number(weight),
      maxScore: Number(maxScore),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      description={t("description")}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label={t("titleEn")} value={title} onChange={(event) => setTitle(event.target.value)} required />
        <Input label={t("titleAr")} value={titleAr} onChange={(event) => setTitleAr(event.target.value)} required />
        <Select
          label={t("type")}
          value={type}
          onChange={(value) => setType(value as AssessmentType)}
          options={typeOptions}
          disabled={isMetadataLocked}
        />
        <DatePicker label={t("date")} value={date} onChange={setDate} disabled={isMetadataLocked} />
        <Input
          label={t("weight")}
          type="number"
          min="1"
          max="100"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          required
          disabled={isMetadataLocked}
        />
        <Input
          label={t("maxScore")}
          type="number"
          min="1"
          value={maxScore}
          onChange={(event) => setMaxScore(event.target.value)}
          required
          disabled={isMetadataLocked}
        />
      </div>
    </Modal>
  );
}
