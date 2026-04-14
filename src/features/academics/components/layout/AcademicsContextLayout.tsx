"use client";

import { useMemo } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import { AcademicYearTermLayoutProvider } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import type { UseAcademicYearTermContextOptions } from "@/features/academics/hooks/useAcademicYearTermContext";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";

function AcademicsContextLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    academicYearId,
    termId,
    termStatus,
    requestAcademicYearChange,
    requestTermChange,
    contextBarActions,
  } = useAcademicYearTermLayoutContext();

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gray-50">
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={(yearId) => {
          void requestAcademicYearChange(yearId);
        }}
        onTermChange={requestTermChange}
        isReadOnly={termStatus === "closed"}
        onPromoteCarryOver={contextBarActions?.onPromoteCarryOver}
        showPromoteCarryOver={contextBarActions?.showPromoteCarryOver ?? false}
        disablePromoteCarryOver={
          contextBarActions?.disablePromoteCarryOver ?? false
        }
      />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export default function AcademicsContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const options = useMemo<UseAcademicYearTermContextOptions>(
    () =>
      segment === null
        ? {
            yearParamKey: "yearId",
            termParamKey: "termId",
            termStatusParamKey: "termStatus",
          }
        : {},
    [segment]
  );
  const providerKey = `${options.yearParamKey ?? "year"}:${options.termParamKey ?? "term"}:${
    options.termStatusParamKey ?? "status"
  }`;

  return (
    <AcademicYearTermLayoutProvider key={providerKey} options={options}>
      <AcademicsContextLayoutContent>{children}</AcademicsContextLayoutContent>
    </AcademicYearTermLayoutProvider>
  );
}
