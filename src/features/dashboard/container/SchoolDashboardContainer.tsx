// Container component for School Dashboard
// Handles data fetching, state management, and business logic

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { mockStudents } from "@/data/mockStudents";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { getReinforcementSummaryCard } from "@/features/reinforcement/services/reinforcementService";
import {
  buildDashboardSnapshot,
} from "@/features/dashboard/utils/dashboardStatsCalculator";
import SchoolDashboardView from "../views/SchoolDashboardView";

export default function SchoolDashboardContainer() {
  const tCommon = useTranslations("common");
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
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-gray-50 p-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-medium text-gray-600 shadow-sm">
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  return (
    <SchoolDashboardView
      dashboardSnapshot={dashboardSnapshot}
      reinforcementSummary={reinforcementSummary}
    />
  );
}
