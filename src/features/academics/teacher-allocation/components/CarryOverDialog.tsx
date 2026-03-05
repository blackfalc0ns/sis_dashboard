"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Copy, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import Button from "@/components/ui/button/Button";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  carryOverTeacherAllocations,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

interface CarryOverDialogProps {
  open: boolean;
  onClose: () => void;
  currentYearId: string;
  currentTermId: string;
  onSuccess: () => void;
}

export default function CarryOverDialog({
  open,
  onClose,
  currentYearId,
  currentTermId,
  onSuccess,
}: CarryOverDialogProps) {
  const t = useTranslations("academics.teacherAllocation.carryOver");

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sourceYearId, setSourceYearId] = useState("");
  const [sourceTerms, setSourceTerms] = useState<Term[]>([]);
  const [sourceTermId, setSourceTermId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Load academic years
  useEffect(() => {
    if (!open) return;

    const loadYears = async () => {
      setIsLoading(true);
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);

        // Default to current year
        if (years.length > 0) {
          const currentYear = years.find((y) => y.id === currentYearId) || years[0];
          setSourceYearId(currentYear.id);
        }
      } catch (error) {
        console.error("Failed to load years:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadYears();
  }, [open, currentYearId]);

  // Load terms when year changes
  useEffect(() => {
    if (!sourceYearId) return;

    const loadTerms = async () => {
      try {
        const terms = await fetchTermsByYear(sourceYearId);
        // Filter out the current term
        const availableTerms = terms.filter((t) => t.id !== currentTermId);
        setSourceTerms(availableTerms);

        // Default to first available term
        if (availableTerms.length > 0) {
          setSourceTermId(availableTerms[0].id);
        } else {
          setSourceTermId("");
        }
      } catch (error) {
        console.error("Failed to load terms:", error);
      }
    };

    loadTerms();
  }, [sourceYearId, currentTermId]);

  const handleCopy = async () => {
    if (!sourceYearId || !sourceTermId) return;

    setIsCopying(true);
    try {
      await carryOverTeacherAllocations({
        fromYearId: sourceYearId,
        fromTermId: sourceTermId,
        toYearId: currentYearId,
        toTermId: currentTermId,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to copy allocations:", error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleClose = () => {
    if (!isCopying) {
      onClose();
    }
  };

  const canCopy = sourceYearId && sourceTermId && !isCopying;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Copy className="w-5 h-5 text-primary" />
        <span className="flex-1 font-semibold">{t("title")}</span>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isCopying}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-6">
          {/* Source Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("sourceYear")}
            </label>
            <select
              value={sourceYearId}
              onChange={(e) => setSourceYearId(e.target.value)}
              disabled={isLoading || isCopying}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.nameEn || year.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Source Term Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("sourceTerm")}
            </label>
            {sourceTerms.length === 0 ? (
              <div className="text-sm text-gray-500 italic py-2">
                No other terms available in this year
              </div>
            ) : (
              <select
                value={sourceTermId}
                onChange={(e) => setSourceTermId(e.target.value)}
                disabled={isLoading || isCopying}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {sourceTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.nameEn || term.nameAr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  This will replace all existing teacher allocations in the current term.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
        <Button
          onClick={handleClose}
          variant="secondary"
          disabled={isCopying}
        >
          {t("cancel")}
        </Button>
        <Button
          onClick={handleCopy}
          variant="primary"
          leftIcon={<Copy className="w-4 h-4" />}
          disabled={!canCopy}
        >
          {isCopying ? "Copying..." : t("confirm")}
        </Button>
      </div>
    </Dialog>
  );
}
