"use client";

import { MessageSquareWarning } from "lucide-react";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { Message } from "@/features/communication/types/message.types";

export interface ReportedMessagePreviewLabels {
  title: string;
  noMessage: string;
  deleted: string;
  sender: string;
  conversation: string;
  createdAt: string;
  unknown: string;
}

export interface ReportedMessagePreviewProps {
  message?: Message | null;
  labels: ReportedMessagePreviewLabels;
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

function senderName(message: Message, fallback: string) {
  return (
    message.sender?.name ||
    message.sender?.nameEn ||
    message.sender?.nameAr ||
    message.senderId ||
    fallback
  );
}

export default function ReportedMessagePreview({
  labels,
  message,
}: ReportedMessagePreviewProps) {
  const isDeleted = message?.status === "deleted" || Boolean(message?.deletedAt);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquareWarning className="h-5 w-5 text-red-600" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      </div>
      {!message ? (
        <p className="text-sm text-slate-500">{labels.noMessage}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4">
            {isDeleted ? (
              <div className="mb-2">
                <CommunicationStatusChip label={labels.deleted} tone="error" />
              </div>
            ) : null}
            <p
              className={`whitespace-pre-wrap text-sm leading-6 text-slate-800 ${
                isDeleted ? "italic opacity-70" : ""
              }`}
            >
              {isDeleted ? labels.deleted : message.body || labels.noMessage}
            </p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">{labels.sender}</dt>
              <dd className="font-medium text-slate-800">
                {senderName(message, labels.unknown)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{labels.conversation}</dt>
              <dd className="font-medium text-slate-800">
                {message.conversationId ?? labels.unknown}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{labels.createdAt}</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(message.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
