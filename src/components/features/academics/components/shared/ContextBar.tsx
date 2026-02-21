"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Plus, Edit2 } from "lucide-react";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  AcademicYear,
  Term,
} from "@/services/academics/structureService";
import { YearDialog, TermDialog } from "../dialogs/YearTermDialogs";

interface ContextBarProps {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  onAcademicYearChange: (yearId: string) => void;
  onTermChange: (termId: string) => void;
  onPromoteCarryOver: () => void;
  isReadOnly: boolean;
}

export default function ContextBar({
  academicYearId,
  termId,
  termStatus,
  onAcademicYearChange,
  onTermChange,
  onPromoteCarryOver,
  isReadOnly,
}: ContextBarProps) {
  const t = useTranslations("academics.structure.context_bar");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

  // Dialog states
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [showTermDialog, setShowTermDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  // Load academic years on mount
  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    setIsLoadingYears(true);
    try {
      const years = await fetchAcademicYears();
      setAcademicYears(years);
    } catch (error) {
      console.error("Failed to load academic years:", error);
    } finally {
      setIsLoadingYears(false);
    }
  };

  // Load terms when academic year changes
  useEffect(() => {
    if (!academicYearId) return;
    loadTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearId]);

  const loadTerms = async () => {
    if (!academicYearId) return;
    setIsLoadingTerms(true);
    try {
      const fetchedTerms = await fetchTermsByYear(academicYearId);
      setTerms(fetchedTerms);
    } catch (error) {
      console.error("Failed to load terms:", error);
    } finally {
      setIsLoadingTerms(false);
    }
  };

  const handleYearSuccess = async () => {
    await loadYears();
  };

  const handleTermSuccess = async () => {
    await loadTerms();
  };

  const handleEditYear = () => {
    const year = academicYears.find((y) => y.id === academicYearId);
    if (year) {
      setEditingYear(year);
      setShowYearDialog(true);
    }
  };

  const handleEditTerm = () => {
    const term = terms.find((t) => t.id === termId);
    if (term) {
      setEditingTerm(term);
      setShowTermDialog(true);
    }
  };

  const handleCreateYear = () => {
    setEditingYear(null);
    setShowYearDialog(true);
  };

  const handleCreateTerm = () => {
    setEditingTerm(null);
    setShowTermDialog(true);
  };

  const academicYearOptions = academicYears.map((year) => ({
    value: year.id,
    label: year.name,
  }));

  const termOptions = terms.map((term) => ({
    value: term.id,
    label: term.name,
  }));

  const selectedYear = academicYears.find((y) => y.id === academicYearId);

  return (
    <>
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Academic Year */}
            <div className="flex-1 min-w-[200px] flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label={t("academic_year")}
                  required
                  value={academicYearId}
                  onChange={onAcademicYearChange}
                  options={academicYearOptions}
                  selectSize="md"
                  disabled={isLoadingYears}
                />
              </div>
              {academicYearId && (
                <button
                  onClick={handleEditYear}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors mb-0.5"
                  title={t("edit_year")}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Term */}
            <div className="flex-1 min-w-[200px] flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label={t("term")}
                  required
                  value={termId}
                  onChange={onTermChange}
                  options={termOptions}
                  selectSize="md"
                  disabled={isLoadingTerms || !academicYearId}
                />
              </div>
              {termId && (
                <button
                  onClick={handleEditTerm}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors mb-0.5"
                  title={t("edit_term")}
                  disabled={isReadOnly}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Term Status */}
            <div className="flex items-end">
              <span
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  termStatus === "open"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {termStatus === "open" ? t("status_open") : t("status_closed")}
              </span>
            </div>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleCreateYear}
            >
              {t("create_year")}
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleCreateTerm}
              disabled={!academicYearId}
            >
              {t("create_term")}
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowRight className="w-4 h-4" />}
              onClick={onPromoteCarryOver}
              disabled={isReadOnly}
              title={isReadOnly ? t("status_closed") : ""}
            >
              {t("promote_carry_over")}
            </Button>
          </div>

          {/* Actions - Mobile */}
          <div className="lg:hidden flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreateYear}
              >
                {t("create_year")}
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreateTerm}
                disabled={!academicYearId}
              >
                {t("create_term")}
              </Button>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onPromoteCarryOver}
              disabled={isReadOnly}
            >
              {t("promote_carry_over")}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <YearDialog
        isOpen={showYearDialog}
        onClose={() => {
          setShowYearDialog(false);
          setEditingYear(null);
        }}
        onSuccess={handleYearSuccess}
        existingYears={academicYears}
        editYear={editingYear}
      />

      {selectedYear && (
        <TermDialog
          isOpen={showTermDialog}
          onClose={() => {
            setShowTermDialog(false);
            setEditingTerm(null);
          }}
          onSuccess={handleTermSuccess}
          academicYear={selectedYear}
          existingTerms={terms}
          editTerm={editingTerm}
          isReadOnly={isReadOnly && !!editingTerm}
        />
      )}
    </>
  );
}
