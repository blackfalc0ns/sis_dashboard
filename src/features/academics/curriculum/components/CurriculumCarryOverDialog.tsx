"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import {
  AcademicYear,
  Term,
  fetchTermsByYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  carryOverCurriculum,
  fetchCurriculum,
} from "@/features/academics/curriculum/services/curriculumService";

interface CurriculumCarryOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicYears: AcademicYear[];
  currentYearId: string;
  currentTermId: string;
  gradeId: string;
  subjectId: string;
  isReadOnly: boolean;
}

export default function CurriculumCarryOverDialog({
  isOpen,
  onClose,
  onSuccess,
  academicYears,
  currentYearId,
  currentTermId,
  gradeId,
  subjectId,
  isReadOnly,
}: CurriculumCarryOverDialogProps) {
  const t = useTranslations("academics.curriculum.carry_over_dialog");

  const [sourceYearId, setSourceYearId] = useState("");
  const [sourceTermId, setSourceTermId] = useState("");
  const [sourceTerms, setSourceTerms] = useState<Term[]>([]);
  const [copyOutline, setCopyOutline] = useState(true);
  const [copySchedule, setCopySchedule] = useState(true);
  const [sourceValidationMessage, setSourceValidationMessage] = useState("");
  const [isLoadingSourceTerms, setIsLoadingSourceTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSourceYearId(currentYearId);
      setSourceTermId("");
      setSourceTerms([]);
      setCopyOutline(true);
      setCopySchedule(true);
      setSourceValidationMessage("");
    }
  }, [isOpen, currentYearId]);

  useEffect(() => {
    if (sourceYearId) {
      loadSourceTerms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceYearId]);

  const loadSourceTerms = async () => {
    setIsLoadingSourceTerms(true);
    setSourceValidationMessage("");
    try {
      const terms = await fetchTermsByYear(sourceYearId);
      const candidateTerms = terms.filter((term) => term.id !== currentTermId);
      const matchingTerms = await Promise.all(
        candidateTerms.map(async (term) => ({
          term,
          curriculum: await fetchCurriculum(term.id, gradeId, subjectId),
        }))
      );
      const availableTerms = matchingTerms
        .filter((entry) => entry.curriculum)
        .map((entry) => entry.term);

      setSourceTerms(availableTerms);
      setSourceTermId("");

      if (availableTerms.length === 0) {
        setSourceValidationMessage(t("no_source_curriculum"));
      }
    } catch (error) {
      console.error("Failed to load source terms:", error);
      setSourceTerms([]);
      setSourceTermId("");
      setSourceValidationMessage(t("load_error"));
    } finally {
      setIsLoadingSourceTerms(false);
    }
  };

  const handleSubmit = async () => {
    if (!sourceYearId || !sourceTermId) return;

    setIsSubmitting(true);
    setSourceValidationMessage("");
    try {
      await carryOverCurriculum({
        fromYearId: sourceYearId,
        fromTermId: sourceTermId,
        toYearId: currentYearId,
        toTermId: currentTermId,
        gradeId,
        subjectId,
        options: {
          copyOutline,
          copySchedule,
        },
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to carry over:", error);
      setSourceValidationMessage(
        error instanceof Error && error.message === "Source curriculum not found"
          ? t("no_source_curriculum")
          : t("submit_error")
      );
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
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={!sourceYearId || !sourceTermId || isSubmitting || isReadOnly}
          >
            {isSubmitting ? t("copying") : t("copy")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t("description")}</p>

        {isReadOnly && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{t("readonly_warning")}</p>
          </div>
        )}

        <Select
          label={t("source_year")}
          required
          value={sourceYearId}
          onChange={setSourceYearId}
          options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
          selectSize="md"
        />

        <Select
          label={t("source_term")}
          required
          value={sourceTermId}
          onChange={setSourceTermId}
          options={sourceTerms.map((t) => ({ value: t.id, label: t.name }))}
          selectSize="md"
          disabled={!sourceYearId || isLoadingSourceTerms}
        />

        {sourceValidationMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">{sourceValidationMessage}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{t("options")}</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copyOutline}
                onChange={(e) => setCopyOutline(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-gray-700">{t("copy_outline")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copySchedule}
                onChange={(e) => setCopySchedule(e.target.checked)}
                className="rounded border-border"
                disabled={!copyOutline}
              />
              <span className="text-sm text-gray-700">{t("copy_schedule")}</span>
            </label>
          </div>
          {!copyOutline && (
            <p className="text-xs text-gray-500">{t("schedule_requires_outline")}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
