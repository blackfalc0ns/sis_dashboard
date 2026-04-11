"use client";

import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  RadioTower,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import NedaaGateBoard from "@/features/nedaa/components/NedaaGateBoard";
import NedaaRequestsTable from "@/features/nedaa/components/NedaaRequestsTable";
import type { NedaaGate, NedaaOverviewData } from "@/features/nedaa/types/nedaa";
import { formatNedaaMinutes } from "@/features/nedaa/utils/nedaaPresentation";

export default function NedaaOverviewView({
  overview,
  gates,
  isReadOnly = false,
  onOpenExport,
}: {
  overview: NedaaOverviewData;
  gates: NedaaGate[];
  isReadOnly?: boolean;
  onOpenExport: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("nedaa");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("overview.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("overview.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" />
            {t("export.button")}
          </button>
          <Link
            href={`/${locale}/nedaa/requests`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
          >
            {t("actions.open_requests")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/nedaa/gates`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-hover px-4 py-2.5 text-sm font-medium text-white"
          >
            {t("actions.open_gates")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("read_only_notice")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KPICardV2
          title={t("kpis.active_requests")}
          value={overview.stats.activeRequests}
          subtitle={t("overview.active_requests_subtitle")}
          icon={RadioTower}
          iconColor="#2563eb"
          iconBgColor="#dbeafe"
          showChart={false}
        />
        <KPICardV2
          title={t("kpis.avg_pickup_time")}
          value={formatNedaaMinutes(overview.stats.avgPickupTimeMinutes, locale)}
          subtitle={t("overview.avg_pickup_subtitle")}
          icon={Clock3}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          showChart={false}
        />
        <KPICardV2
          title={t("kpis.completed_today")}
          value={overview.stats.completedToday}
          subtitle={t("overview.completed_today_subtitle")}
          icon={CheckCircle2}
          iconColor="#16a34a"
          iconBgColor="#dcfce7"
          showChart={false}
        />
        <KPICardV2
          title={t("kpis.cancelled_today")}
          value={overview.stats.cancelledToday}
          subtitle={t("overview.cancelled_today_subtitle")}
          icon={Ban}
          iconColor="#e11d48"
          iconBgColor="#ffe4e6"
          showChart={false}
        />
        <KPICardV2
          title={t("kpis.blocked_attempts")}
          value={overview.stats.blockedAttempts}
          subtitle={t("overview.blocked_attempts_subtitle")}
          icon={MapPin}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          showChart={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr,1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("overview.latest_requests")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("overview.latest_requests_subtitle")}
            </p>
          </div>
          <NedaaRequestsTable
            requests={overview.latestRequests}
            gates={gates}
            mode="latest"
            showPagination={false}
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("overview.quick_actions")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("overview.quick_actions_subtitle")}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/${locale}/nedaa/requests`}
              className="block rounded-xl border border-gray-200 px-4 py-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <p className="font-medium text-gray-900">{t("actions.open_requests")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("overview.open_requests_description")}
              </p>
            </Link>
            <Link
              href={`/${locale}/nedaa/gates`}
              className="block rounded-xl border border-gray-200 px-4 py-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <p className="font-medium text-gray-900">{t("actions.open_gates")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("overview.open_gates_description")}
              </p>
            </Link>
            <Link
              href={`/${locale}/nedaa/history`}
              className="block rounded-xl border border-gray-200 px-4 py-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <p className="font-medium text-gray-900">{t("actions.open_history")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("overview.open_history_description")}
              </p>
            </Link>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("overview.gate_summary")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("overview.gate_summary_subtitle")}
          </p>
        </div>
        <NedaaGateBoard gates={overview.gates} />
      </section>
    </div>
  );
}
