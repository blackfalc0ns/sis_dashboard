"use client";

import { CheckCircle2, Clock3, PackageCheck, TimerReset } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {gates.map((gate) => (
        <section
          key={gate.gate}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t(`gates.${gate.gate}`)}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("gates.active_requests", { count: gate.activeRequests })}
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
                {gate.waitingCount}
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
                {gate.preparingCount}
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
                {gate.readyCount}
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
                {gate.completedToday}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              {t("gates.avg_handling_time")}
            </p>
            <p className="mt-2 text-base font-semibold text-gray-900">
              {formatNedaaMinutes(gate.avgHandlingTimeMinutes, locale)}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
