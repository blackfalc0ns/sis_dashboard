// Container component for School Dashboard
// Handles data fetching, state management, and business logic

"use client";

import { useEffect, useMemo, useState } from "react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { mockStudents } from "@/data/mockStudents";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { getReinforcementSummaryCard } from "@/features/reinforcement/services/reinforcementService";
import {
  buildDashboardSnapshot,
} from "@/features/dashboard/utils/dashboardStatsCalculator";
import SchoolDashboardView from "../views/SchoolDashboardView";

export default function SchoolDashboardContainer() {
  const { 
    academicYearId,
    termId,
    isInitializing,
    selectedAcademicYear,
    selectedTerm,
  } = useAcademicYearTermLayoutContext();
  const [reinforcementSummary, setReinforcementSummary] = useState<{
    inProgress: number;
    notCompleted: number;
    completionRate: number;
  } | null>(null);

  const dashboardSnapshot = useMemo(
    () =>
      buildDashboardSnapshot({
        students: mockStudents,
        academicYear: selectedAcademicYear,
        term: selectedTerm,
      }),
    [selectedAcademicYear, selectedTerm]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadReinforcementSummary = async () => {
      const summary = await getReinforcementSummaryCard();
      if (!isCancelled) {
        setReinforcementSummary(summary);
      }
    };

    loadReinforcementSummary();

    return () => {
      isCancelled = true;
    };
  }, [academicYearId, termId]);

  if (isInitializing || !selectedAcademicYear || !selectedTerm) {
    return <MainLoader />;
  }

  return (
    <SchoolDashboardView
      dashboardSnapshot={dashboardSnapshot}
      reinforcementSummary={reinforcementSummary}
    />
  );
}
