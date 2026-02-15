// FILE: src/components/admissions/StatusBadge.tsx

import React from "react";
import { useTranslations } from "next-intl";
import {
  ApplicationStatus,
  TestStatus,
  InterviewStatus,
} from "@/types/admissions";

type Status = ApplicationStatus | TestStatus | InterviewStatus;

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const statusColors: Record<Status, string> = {
  // Application statuses
  submitted: "bg-blue-100 text-blue-700",
  documents_pending: "bg-amber-100 text-amber-700",
  under_review: "bg-purple-100 text-purple-700",
  accepted: "bg-emerald-100 text-emerald-700",
  waitlisted: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",

  // Test/Interview statuses
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const statusTranslationKeys: Record<Status, string> = {
  // Application statuses
  submitted: "submitted",
  documents_pending: "documents_pending",
  under_review: "under_review",
  accepted: "accepted",
  waitlisted: "waitlisted",
  rejected: "rejected",

  // Test/Interview statuses
  scheduled: "scheduled",
  completed: "completed",
  failed: "failed",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const t = useTranslations("admissions.status_badge");
  const colorClass = statusColors[status];
  const translationKey = statusTranslationKeys[status];
  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      {t(translationKey)}
    </span>
  );
}
