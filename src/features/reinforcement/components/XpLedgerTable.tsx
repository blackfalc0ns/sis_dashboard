"use client";

import { useLocale, useTranslations } from "next-intl";
import type { XpLedgerEntry } from "../types";

interface XpLedgerTableProps {
  entries: XpLedgerEntry[];
  loading?: boolean;
}

export default function XpLedgerTable({
  entries,
  loading = false,
}: XpLedgerTableProps) {
  const locale = useLocale();
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
              {["student", "amount", "reason", "sourceId", "createdAt"].map((key) => (
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
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {entry.studentId}
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
                  {entry.sourceId || "-"}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
