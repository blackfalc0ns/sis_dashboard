"use client";

import { ShieldAlert } from "lucide-react";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { MessageReport } from "@/features/communication/types/safety.types";

export interface ReportDetailsPanelLabels {
  title: string;
  status: string;
  reason: string;
  details: string;
  reporter: string;
  messageId: string;
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
  open: string;
  inReview: string;
  resolved: string;
  unknown: string;
}

export interface ReportDetailsPanelProps {
  report?: MessageReport | null;
  labels: ReportDetailsPanelLabels;
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

function statusLabel(status: string | undefined, labels: ReportDetailsPanelLabels) {
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

export default function ReportDetailsPanel({
  labels,
  report,
}: ReportDetailsPanelProps) {
  if (!report) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      </div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">{labels.status}</dt>
          <dd className="mt-1">
            <CommunicationStatusChip
              label={statusLabel(report.status, labels)}
              tone={statusTone(report.status)}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.reporter}</dt>
          <dd className="font-medium text-slate-800">
            {reporterName(report, labels.unknown)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.messageId}</dt>
          <dd className="break-all font-medium text-slate-800">
            {report.messageId ?? labels.unknown}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.reason}</dt>
          <dd className="font-medium text-slate-800">
            {report.reason || labels.unknown}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-slate-500">{labels.details}</dt>
          <dd className="whitespace-pre-wrap text-slate-800">
            {report.details || labels.unknown}
          </dd>
        </div>
        {report.resolutionNote ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">{labels.resolutionNote}</dt>
            <dd className="whitespace-pre-wrap text-slate-800">
              {report.resolutionNote}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-slate-500">{labels.createdAt}</dt>
          <dd className="font-medium text-slate-800">
            {formatDate(report.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.updatedAt}</dt>
          <dd className="font-medium text-slate-800">
            {formatDate(report.updatedAt)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
