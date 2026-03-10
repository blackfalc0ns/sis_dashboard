"use client";

import { useTranslations } from "next-intl";
import type { AttendanceStatus } from "../types";

interface AttendanceStatusPillProps {
  status: AttendanceStatus | null;
  size?: "sm" | "md";
}

export default function AttendanceStatusPill({ status, size = "md" }: AttendanceStatusPillProps) {
  const t = useTranslations("attendance.rollCall.status");

  if (!status) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded ${
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        } font-medium bg-gray-100 text-gray-600`}
      >
        —
      </span>
    );
  }

  const styles: Record<AttendanceStatus, string> = {
    PRESENT: "bg-green-100 text-green-800",
    ABSENT: "bg-red-100 text-red-800",
    LATE: "bg-orange-100 text-orange-800",
    EXCUSED: "bg-blue-100 text-blue-800",
    EARLY_LEAVE: "bg-purple-100 text-purple-800",
    UNMARKED: "bg-gray-100 text-gray-600",
  };

  const labels: Record<AttendanceStatus, string> = {
    PRESENT: t("present"),
    ABSENT: t("absent"),
    LATE: t("late"),
    EXCUSED: t("excused"),
    EARLY_LEAVE: t("earlyLeave"),
    UNMARKED: t("unmarked"),
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
