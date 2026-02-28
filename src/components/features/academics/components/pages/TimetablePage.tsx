"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, Tab } from "@mui/material";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import ContextBar from "../shared/ContextBar";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  AcademicYear,
  Term,
} from "@/services/academics/structureService";
import TimetableView from "../timetable/TimetableView";
import RoomsView from "../rooms/RoomsView";

export default function TimetablePage() {
  const t = useTranslations("academics.timetable");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("timetable");

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

  // Context data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<"timetable" | "rooms">("timetable");

  const isReadOnly = termStatus === "closed";

  // Initialize from URL
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize context:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContext();
  }, [searchParams, router]);

  const handleAcademicYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);
    
    // Load terms for new year
    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);
    
    // Select first open term or first term
    const selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (selectedTerm) {
      setTermId(selectedTerm.id);
      setTermStatus(selectedTerm.status);
      
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", selectedTerm.id);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const handleTermChange = (newTermId: string) => {
    const term = terms.find((t) => t.id === newTermId);
    if (term) {
      setTermId(newTermId);
      setTermStatus(term.status);
      
      const params = new URLSearchParams();
      params.set("year", academicYearId);
      params.set("term", newTermId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: "timetable" | "rooms") => {
    if (isDirty) {
      const confirmed = window.confirm(t("unsavedChanges.message"));
      if (!confirmed) return;
      clearDirty();
    }
    setActiveTab(newValue);
  };

  const handleDirtyChange = useCallback((dirty: boolean) => {
    if (dirty) markDirty();
    else clearDirty();
  }, [markDirty, clearDirty]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!academicYearId || !termId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">No academic year or term selected</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      {/* Read-only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-sm text-yellow-800">{t("readOnlyBanner")}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              minHeight: "48px",
            },
          }}
        >
          <Tab label={t("tabs.timetable")} value="timetable" />
          <Tab label={t("tabs.rooms")} value="rooms" />
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "timetable" && (
          <TimetableView
            academicYearId={academicYearId}
            termId={termId}
            termStatus={termStatus}
            isReadOnly={isReadOnly}
            onDirtyChange={handleDirtyChange}
          />
        )}
        {activeTab === "rooms" && (
          <RoomsView
            schoolId="school-1" // TODO: Get from context
            isReadOnly={isReadOnly}
          />
        )}
      </div>
    </div>
  );
}
