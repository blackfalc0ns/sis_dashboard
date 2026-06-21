"use client";

import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/data-table";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { GradebookStudentRow } from "../types";

type GradebookTableRow = GradebookStudentRow & Record<string, unknown>;

interface GradesGradebookSectionProps {
  isLoading: boolean;
  hasAssessments: boolean;
  rows: GradebookTableRow[];
  columns: Column<GradebookTableRow>[];
}

export default function GradesGradebookSection({
  isLoading,
  hasAssessments,
  rows,
  columns,
}: GradesGradebookSectionProps) {
  const t = useTranslations("academics.grades");
  const emptyStateMessage = hasAssessments ? t("emptyState.noStudents") : t("emptyState.noAssessments");

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div className="mb-4">
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("gradebook.title")}</div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("gradebook.subtitle")}</div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <PartialLoader />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
          {emptyStateMessage}
        </div>
      ) : (
        <DataTable columns={columns} data={rows} showPagination />
      )}
    </div>
  );
}
