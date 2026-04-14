"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface UseAcademicYearTermContextOptions {
  preserveParams?: boolean;
  preferOpenTerm?: boolean;
  yearParamKey?: string;
  termParamKey?: string;
  termStatusParamKey?: string;
}

export interface UseAcademicYearTermContextResult {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  academicYears: AcademicYear[];
  terms: Term[];
  isInitializing: boolean;
  selectedAcademicYear: AcademicYear | null;
  selectedTerm: Term | null;
  changeAcademicYear: (yearId: string) => Promise<Term | null>;
  changeTerm: (termId: string) => Term | null;
  refreshTerms: (yearId?: string) => Promise<Term[]>;
}

export function useAcademicYearTermContext(
  options: UseAcademicYearTermContextOptions = {}
): UseAcademicYearTermContextResult {
  const {
    preserveParams = true,
    preferOpenTerm = true,
    yearParamKey = "year",
    termParamKey = "term",
    termStatusParamKey,
  } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParamsRef = useRef(searchParams.toString());
  const initialYearIdRef = useRef(searchParams.get(yearParamKey));
  const initialTermIdRef = useRef(searchParams.get(termParamKey));
  const yearChangeRequestIdRef = useRef(0);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [isInitializing, setIsInitializing] = useState(true);

  const buildSelectedTerm = useCallback(
    (availableTerms: Term[], requestedTermId: string | null): Term | null => {
      if (requestedTermId) {
        const matchingTerm = availableTerms.find((term) => term.id === requestedTermId);
        if (matchingTerm) {
          return matchingTerm;
        }
      }

      if (preferOpenTerm) {
        return availableTerms.find((term) => term.status === "open") || availableTerms[0] || null;
      }

      return availableTerms[0] || null;
    },
    [preferOpenTerm]
  );

  const syncUrl = useCallback(
    (yearId: string, selectedTermId: string, selectedTermStatus?: "open" | "closed") => {
      const params = preserveParams
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();
      params.set(yearParamKey, yearId);
      params.set(termParamKey, selectedTermId);
      if (termStatusParamKey && selectedTermStatus) {
        params.set(termStatusParamKey, selectedTermStatus);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [preserveParams, router, searchParams, termParamKey, termStatusParamKey, yearParamKey]
  );

  const refreshTerms = useCallback(
    async (yearId = academicYearId) => {
      if (!yearId) {
        setTerms([]);
        return [];
      }

      const fetchedTerms = await fetchTermsByYear(yearId);
      setTerms(fetchedTerms);
      return fetchedTerms;
    },
    [academicYearId]
  );

  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      setIsInitializing(true);

      try {
        const years = await fetchAcademicYears();
        if (isCancelled) {
          return;
        }

        setAcademicYears(years);

        const requestedYearId = initialYearIdRef.current;
        const requestedTermId = initialTermIdRef.current;
        const selectedYear =
          years.find((year) => year.id === requestedYearId) || years[0] || null;

        if (!selectedYear) {
          setAcademicYearId("");
          setTermId("");
          setTerms([]);
          return;
        }

        const fetchedTerms = await fetchTermsByYear(selectedYear.id);
        if (isCancelled) {
          return;
        }

        setTerms(fetchedTerms);

        const selectedTerm = buildSelectedTerm(fetchedTerms, requestedTermId);

        setAcademicYearId(selectedYear.id);
        setTermId(selectedTerm?.id || "");
        setTermStatus(selectedTerm?.status || "open");

        if (
          selectedTerm &&
          (requestedYearId !== selectedYear.id || requestedTermId !== selectedTerm.id)
        ) {
          const params = preserveParams
            ? new URLSearchParams(initialParamsRef.current)
            : new URLSearchParams();
          params.set(yearParamKey, selectedYear.id);
          params.set(termParamKey, selectedTerm.id);
          if (termStatusParamKey) {
            params.set(termStatusParamKey, selectedTerm.status);
          }
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isCancelled = true;
    };
  }, [buildSelectedTerm, preserveParams, router, termParamKey, termStatusParamKey, yearParamKey]);

  const changeAcademicYear = useCallback(
    async (yearId: string) => {
      const requestId = yearChangeRequestIdRef.current + 1;
      yearChangeRequestIdRef.current = requestId;

      setAcademicYearId(yearId);
      setTermId("");
      setTermStatus("open");
      setTerms([]);

      const fetchedTerms = await fetchTermsByYear(yearId);
      if (yearChangeRequestIdRef.current !== requestId) {
        return null;
      }
      setTerms(fetchedTerms);

      const nextTerm = buildSelectedTerm(fetchedTerms, null);
      setTermId(nextTerm?.id || "");
      setTermStatus(nextTerm?.status || "open");

      if (nextTerm) {
        syncUrl(yearId, nextTerm.id, nextTerm.status);
      }

      return nextTerm;
    },
    [buildSelectedTerm, syncUrl]
  );

  const changeTerm = useCallback(
    (nextTermId: string) => {
      const nextTerm = terms.find((term) => term.id === nextTermId) || null;
      if (!nextTerm) {
        return null;
      }

      setTermId(nextTermId);
      setTermStatus(nextTerm.status);
      syncUrl(academicYearId, nextTermId, nextTerm.status);
      return nextTerm;
    },
    [academicYearId, syncUrl, terms]
  );

  const selectedAcademicYear = useMemo(
    () => academicYears.find((year) => year.id === academicYearId) || null,
    [academicYearId, academicYears]
  );

  const selectedTerm = useMemo(
    () => terms.find((term) => term.id === termId) || null,
    [termId, terms]
  );

  return {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
    isInitializing,
    selectedAcademicYear,
    selectedTerm,
    changeAcademicYear,
    changeTerm,
    refreshTerms,
  };
}
