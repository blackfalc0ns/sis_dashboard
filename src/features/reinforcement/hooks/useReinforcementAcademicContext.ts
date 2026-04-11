"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface ReinforcementAcademicContextResult {
  selectedAcademicYear: AcademicYear | null;
  selectedTerm: Term | null;
}

export function useReinforcementAcademicContext(): ReinforcementAcademicContextResult {
  const searchParams = useSearchParams();
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYear | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadContext = async () => {
      const requestedYearId = searchParams.get("year");
      const requestedTermId = searchParams.get("term");
      const years = await fetchAcademicYears();
      if (isCancelled) return;

      const nextYear =
        years.find((year) => year.id === requestedYearId) || years[0] || null;
      setSelectedAcademicYear(nextYear);

      if (!nextYear) {
        setSelectedTerm(null);
        return;
      }

      const terms = await fetchTermsByYear(nextYear.id);
      if (isCancelled) return;

      const nextTerm =
        terms.find((term) => term.id === requestedTermId) ||
        terms.find((term) => term.status === "open") ||
        terms[0] ||
        null;
      setSelectedTerm(nextTerm);
    };

    void loadContext();

    return () => {
      isCancelled = true;
    };
  }, [searchParams]);

  return {
    selectedAcademicYear,
    selectedTerm,
  };
}
