"use client";

import AdmissionsYearTermContextBar from "@/features/admissions/shared/components/AdmissionsYearTermContextBar";
import {
  AdmissionsYearTermProvider,
  useAdmissionsYearTermContext,
} from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";

function AdmissionsLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    academicYears,
    terms,
    yearId,
    termId,
    termStatus,
    isLoading,
    setYearId,
    setTermId,
  } = useAdmissionsYearTermContext();

  return (
    <div className="min-w-0">
      <AdmissionsYearTermContextBar
        academicYearId={yearId}
        termId={termId}
        termStatus={termStatus}
        academicYears={academicYears}
        terms={terms}
        isLoading={isLoading}
        onAcademicYearChange={setYearId}
        onTermChange={setTermId}
      />
      {children}
    </div>
  );
}

export default function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdmissionsYearTermProvider>
      <AdmissionsLayoutContent>{children}</AdmissionsLayoutContent>
    </AdmissionsYearTermProvider>
  );
}
