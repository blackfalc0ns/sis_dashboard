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
import { carryOverSubjectsAndAllocations } from "@/features/academics/subjects/services/subjectsService";

interface CarryOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicYears: AcademicYear[];
  currentYearId: string;
  currentTermId: string;
  isReadOnly: boolean;
}

export default function CarryOverDialog({
  isOpen,
  onClose,
  onSuccess,
  academicYears,
  currentYearId,
  currentTermId,
  isReadOnly,
}: CarryOverDialogProps) {
  const t = useTranslations("academics.subjects.carry_over_dialog");

  const [sourceYearId, setSourceYearId] = useState("");
  const [sourceTermId, setSourceTermId] = useState("");
  const [sourceTerms, setSourceTerms] = useState<Term[]>([]);
  const [copySubjects, setCopySubjects] = useState(true);
  const [copyAllocations, setCopyAllocations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSourceYearId(currentYearId);
      setSourceTermId("");
      setCopySubjects(true);
      setCopyAllocations(true);
    }
  }, [isOpen, currentYearId]);

  useEffect(() => {
    if (sourceYearId) {
      loadSourceTerms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceYearId]);

  const loadSourceTerms = async () => {
    try {
      const terms = await fetchTermsByYear(sourceYearId);
      // Exclude current term
      setSourceTerms(terms.filter((t) => t.id !== currentTermId));
      setSourceTermId("");
    } catch (error) {
      console.error("Failed to load source terms:", error);
    }
  };

  const handleSubmit = async () => {
    if (!sourceYearId || !sourceTermId) return;

    setIsSubmitting(true);
    try {
      await carryOverSubjectsAndAllocations({
        fromYearId: sourceYearId,
        fromTermId: sourceTermId,
        toYearId: currentYearId,
        toTermId: currentTermId,
        options: {
          copySubjects,
          copyAllocations,
        },
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to carry over:", error);
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
          disabled={!sourceYearId}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{t("options")}</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copySubjects}
                onChange={(e) => setCopySubjects(e.target.checked)}
                className="rounded border border-border-300"
              />
              <span className="text-sm text-gray-700">{t("copy_subjects")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copyAllocations}
                onChange={(e) => setCopyAllocations(e.target.checked)}
                className="rounded border border-border-300"
                disabled={!copySubjects}
              />
              <span className="text-sm text-gray-700">{t("copy_allocations")}</span>
            </label>
          </div>
          {!copySubjects && (
            <p className="text-xs text-gray-500">{t("allocations_require_subjects")}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
