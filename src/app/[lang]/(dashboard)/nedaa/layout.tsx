"use client";

import StudentsGuardiansYearTermContextBar from "@/features/students-guardians/shared/components/StudentsGuardiansYearTermContextBar";
import {
  StudentsGuardiansYearTermProvider,
  useStudentsGuardiansYearTermContext,
} from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

function NedaaLayoutContent({
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
  } = useStudentsGuardiansYearTermContext();

  return (
    <div className="min-w-0">
      <StudentsGuardiansYearTermContextBar
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

export default function NedaaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentsGuardiansYearTermProvider>
      <NedaaLayoutContent>{children}</NedaaLayoutContent>
    </StudentsGuardiansYearTermProvider>
  );
}
