// FILE: src/components/admissions/StatusBadge.tsx

import React from "react";
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

const statusConfig: Record<Status, { label: string; className: string }> = {
  // Application statuses
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  documents_pending: {
    label: "Documents Pending",
    className: "bg-amber-100 text-amber-700",
  },
  under_review: {
    label: "Under Review",
    className: "bg-purple-100 text-purple-700",
  },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
  waitlisted: { label: "Waitlisted", className: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },

  // Test/Interview statuses
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
