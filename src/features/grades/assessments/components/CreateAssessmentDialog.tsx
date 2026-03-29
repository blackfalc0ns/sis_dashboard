"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { DatePicker, Input, Select } from "@/components/ui/input";
import type { Assessment, AssessmentType, CreateAssessmentPayload, ExamScopeType } from "../types";

interface ScopeEntityOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface SubjectOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface CreateAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAssessmentPayload) => Promise<void>;
  termId: string;
  scopeTypes: ExamScopeType[];
  scopeEntitiesByType: Record<ExamScopeType, ScopeEntityOption[]>;
  subjects: SubjectOption[];
  selectedScopeType: ExamScopeType;
  selectedScopeId: string;
  selectedSubjectId: string;
  isSubmitting: boolean;
  mode?: "create" | "edit";
  initialAssessment?: Assessment | null;
}

export default function CreateAssessmentDialog({
  isOpen,
  onClose,
  onSubmit,
  termId,
  scopeTypes,
  scopeEntitiesByType,
  subjects,
  selectedScopeType,
  selectedScopeId,
  selectedSubjectId,
  isSubmitting,
  mode = "create",
  initialAssessment = null,
}: CreateAssessmentDialogProps) {
  const t = useTranslations(`academics.grades.dialogs.${mode === "edit" ? "editAssessment" : "createAssessment"}`);
  const locale = useLocale();
  const isMetadataLocked =
    mode === "edit" &&
    (initialAssessment?.approvalStatus === "approved" || initialAssessment?.approvalStatus === "published");

  const [scopeType, setScopeType] = useState<ExamScopeType>(initialAssessment?.scopeType || selectedScopeType);
  const [scopeId, setScopeId] = useState(initialAssessment?.scopeId || selectedScopeId);
  const [subjectId, setSubjectId] = useState(initialAssessment?.subjectId || selectedSubjectId);
  const [type, setType] = useState<AssessmentType>((initialAssessment?.type as AssessmentType) || "QUIZ");
  const [title, setTitle] = useState(initialAssessment?.title || "");
  const [titleAr, setTitleAr] = useState(initialAssessment?.titleAr || "");
  const [date, setDate] = useState<Date | null>(initialAssessment?.date ? new Date(initialAssessment.date) : new Date());
  const [weight, setWeight] = useState(initialAssessment ? String(initialAssessment.weight) : "15");
  const [maxScore, setMaxScore] = useState(initialAssessment ? String(initialAssessment.maxScore) : "20");

  const scopeOptions = useMemo(
    () =>
      scopeTypes.map((value) => ({
        value,
        label: t(`types.scopeTypes.${value}`),
      })),
    [scopeTypes, t],
  );

  const currentScopeEntities = useMemo(() => scopeEntitiesByType[scopeType] || [], [scopeEntitiesByType, scopeType]);

  const typeOptions = useMemo(
    () => [
      { value: "QUIZ", label: t("types.quiz") },
      { value: "MONTH_EXAM", label: t("types.monthExam") },
      { value: "MIDTERM", label: t("types.midterm") },
      { value: "TERM_EXAM", label: t("types.termExam") },
    ],
    [t],
  );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleScopeTypeChange = (value: string) => {
    const nextScopeType = value as ExamScopeType;
    setScopeType(nextScopeType);
    const nextScopeId = scopeEntitiesByType[nextScopeType]?.[0]?.id || "";
    setScopeId(nextScopeId);
  };

  const handleSubmit = async () => {
    if (!date) return;
    await onSubmit({
      termId: initialAssessment?.termId || termId,
      scopeType,
      scopeId,
      subjectId,
      type,
      deliveryMode: initialAssessment?.deliveryMode || "QUESTION_BASED",
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
        <Select
          label={t("scopeType")}
          value={scopeType}
          onChange={handleScopeTypeChange}
          options={scopeOptions}
          disabled={isMetadataLocked}
        />
        <Select
          label={t("scope")}
          value={scopeId}
          onChange={setScopeId}
          options={currentScopeEntities.map((entity) => ({
            value: entity.id,
            label: locale === "ar" ? entity.nameAr : entity.nameEn,
          }))}
          disabled={isMetadataLocked}
        />
        <Select
          label={t("subject")}
          value={subjectId}
          onChange={setSubjectId}
          options={subjects.map((subject) => ({
            value: subject.id,
            label: locale === "ar" ? subject.nameAr : subject.nameEn,
          }))}
          disabled={isMetadataLocked}
        />
        <Select
          label={t("type")}
          value={type}
          onChange={(value) => setType(value as AssessmentType)}
          options={typeOptions}
          disabled={isMetadataLocked}
        />
        <Input label={t("titleEn")} value={title} onChange={(event) => setTitle(event.target.value)} required />
        <Input label={t("titleAr")} value={titleAr} onChange={(event) => setTitleAr(event.target.value)} required />
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
