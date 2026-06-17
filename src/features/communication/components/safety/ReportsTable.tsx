"use client";

import { Eye, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { MessageReport } from "@/features/communication/types/safety.types";

export interface ReportsTableLabels {
  emptyTitle: string;
  emptyDescription: string;
  report: string;
  reporter: string;
  reason: string;
  status: string;
  createdAt: string;
  open: string;
  inReview: string;
  resolved: string;
  view: string;
  unknown: string;
}

export interface ReportsTableProps {
  reports: MessageReport[];
  locale: string;
  labels: ReportsTableLabels;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  if (status === "resolved") return "success" as const;
  if (status === "in_review") return "warning" as const;
  return "error" as const;
}

function statusLabel(status: string | undefined, labels: ReportsTableLabels) {
  if (status === "resolved") return labels.resolved;
  if (status === "in_review") return labels.inReview;
  return labels.open;
}

function reporterName(report: MessageReport, fallback: string) {
  return (
    report.reporter?.name ||
    report.reporter?.nameEn ||
    report.reporter?.nameAr ||
    report.reporterId ||
    fallback
  );
}

export default function ReportsTable({
  labels,
  locale,
  reports,
}: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <CommunicationEmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.report}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.reporter}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.reason}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.status}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.createdAt}
            </th>
            <th className="px-4 py-3 text-end font-semibold">
              {labels.view}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-slate-50">
              <td className="max-w-52 truncate px-4 py-3 text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden />
                  {report.id}
                </span>
              </td>
              <td className="max-w-52 truncate px-4 py-3 text-slate-700">
                {reporterName(report, labels.unknown)}
              </td>
              <td className="max-w-64 truncate px-4 py-3 text-slate-700">
                {report.reason || labels.unknown}
              </td>
              <td className="px-4 py-3">
                <CommunicationStatusChip
                  label={statusLabel(report.status, labels)}
                  tone={statusTone(report.status)}
                />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(report.createdAt)}
              </td>
              <td className="px-4 py-3 text-end">
                <Link href={`/${locale}/communication/moderation/${report.id}`}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<Eye className="h-4 w-4" aria-hidden="true" />}
                  >
                    {labels.view}
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
