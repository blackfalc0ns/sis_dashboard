"use client";

import { CheckCircle2, Clock3, MapPin, PackageCheck, TimerReset } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { NedaaGateStats } from "@/features/nedaa/types/nedaa";
import { formatNedaaMinutes } from "@/features/nedaa/utils/nedaaPresentation";

export default function NedaaGateBoard({
  gates,
}: {
  gates: NedaaGateStats[];
}) {
  const locale = useLocale();
  const t = useTranslations("nedaa");

  if (gates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
        {t("gates.empty_state")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {gates.map((gateStats) => (
        <section
          key={gateStats.gate.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {locale === "ar" ? gateStats.gate.nameAr : gateStats.gate.nameEn}
                </h3>
                {gateStats.gate.isStaffOnly ? (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {t("settings.gate_status.staff_only")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {gateStats.gate.locationHint ||
                  t("gates.active_requests", { count: gateStats.activeRequests })}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <PackageCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("gates.waiting")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {gateStats.waitingCount}
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <TimerReset className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("gates.preparing")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {gateStats.preparingCount}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <PackageCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("gates.ready")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {gateStats.readyCount}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("gates.completed_today")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {gateStats.completedToday}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                {t("gates.avg_handling_time")}
              </p>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {formatNedaaMinutes(gateStats.avgHandlingTimeMinutes, locale)}
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {t("gates.active_requests_label")}
                </p>
              </div>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {t("gates.active_requests", { count: gateStats.activeRequests })}
              </p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}