"use client";

import { useTranslations } from "next-intl";
import type { TeacherStatus } from "@/features/teachers/types";

interface TeacherStatusChipProps {
  status: TeacherStatus;
}

export default function TeacherStatusChip({
  status,
}: TeacherStatusChipProps) {
  const t = useTranslations("teachers");

  const styles =
    status === "ACTIVE"
      ? "border border-green-200 bg-green-50 text-green-700"
      : "border border-gray-200 bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status === "ACTIVE" ? t("status.active") : t("status.inactive")}
    </span>
  );
}
