"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { XpLedgerEntry } from "../types";

interface XpLedgerTableProps {
  entries: XpLedgerEntry[];
  loading?: boolean;
  getStudentProgressHref?: (entry: XpLedgerEntry) => string | undefined;
}

export default function XpLedgerTable({
  entries,
  loading = false,
  getStudentProgressHref,
}: XpLedgerTableProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement");

  if (loading && entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
        {t("common.loading")}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        {t("emptyStates.xpLedger")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {["student", "amount", "reason", "source", "createdAt"].map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                >
                  {t(`xp.ledger.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const progressHref = getStudentProgressHref?.(entry);
              // Resolve student name from nested object if available
              const student = entry.student as Record<string, unknown> | undefined;
              const studentName = student
                ? locale === "ar"
                  ? (student.nameAr as string) || (student.full_name_ar as string) || (student.name as string) || (student.nameEn as string) || entry.studentId
                  : (student.nameEn as string) || (student.full_name_en as string) || (student.name as string) || (student.nameAr as string) || entry.studentId
                : entry.studentId;

              // Resolve source label — prefer sourceType translated label, fall back to source name
              const source = entry.source as Record<string, unknown> | undefined;
              const sourceType = (entry.sourceType as string) || (entry.type as string);
              const sourceLabel = source
                ? locale === "ar"
                  ? (source.titleAr as string) || (source.titleEn as string) || (source.name as string) || sourceType || "-"
                  : (source.titleEn as string) || (source.titleAr as string) || (source.name as string) || sourceType || "-"
                : sourceType || entry.sourceId || "-";

              return (
                <tr
                  key={entry.id}
                  className={progressHref ? "cursor-pointer hover:bg-gray-50" : undefined}
                  role={progressHref ? "link" : undefined}
                  tabIndex={progressHref ? 0 : undefined}
                  onClick={() => {
                    if (progressHref) {
                      router.push(progressHref);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!progressHref) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(progressHref);
                    }
                  }}
                >
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {studentName}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-primary">
                    {entry.amount}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {locale === "ar"
                      ? entry.reasonAr || entry.reason
                      : entry.reason || entry.reasonAr}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {sourceLabel}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {entry.createdAt
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(entry.createdAt))
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
