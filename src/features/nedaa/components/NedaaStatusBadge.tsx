"use client";

import { useTranslations } from "next-intl";
import type { NedaaStatus } from "@/features/nedaa/types/nedaa";

const statusStyles: Record<NedaaStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  acknowledged: "bg-blue-100 text-blue-700 border border-blue-200",
  preparing: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  ready: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  completed: "bg-green-100 text-green-700 border border-green-200",
  cancelled: "bg-rose-100 text-rose-700 border border-rose-200",
};

export default function NedaaStatusBadge({
  status,
}: {
  status: NedaaStatus;
}) {
  const t = useTranslations("nedaa.status");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {t(status)}
    </span>
  );
}
