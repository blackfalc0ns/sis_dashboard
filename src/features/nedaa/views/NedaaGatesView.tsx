"use client";

import { CheckCircle2, Download, RadioTower, TimerReset } from "lucide-react";
import { useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import NedaaGateBoard from "@/features/nedaa/components/NedaaGateBoard";
import NedaaRequestsTable from "@/features/nedaa/components/NedaaRequestsTable";
import type {
  NedaaGate,
  NedaaGateStats,
  NedaaRequest,
} from "@/features/nedaa/types/nedaa";

export default function NedaaGatesView({
  gates,
  activeRequests,
  requestGates,
  isReadOnly = false,
  onOpenExport,
}: {
  gates: NedaaGateStats[];
  activeRequests: NedaaRequest[];
  requestGates: NedaaGate[];
  isReadOnly?: boolean;
  onOpenExport: () => void;
}) {
  const t = useTranslations("nedaa");
  const totals = {
    activeGates: gates.length,
    waiting: gates.reduce((sum, gate) => sum + gate.waitingCount, 0),
    ready: gates.reduce((sum, gate) => sum + gate.readyCount, 0),
    completedToday: gates.reduce((sum, gate) => sum + gate.completedToday, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("gates_page.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("gates_page.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Download className="h-4 w-4" />
          {t("export.button")}
        </button>
      </div>

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("read_only_notice")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2
          title={t("gates_page.active_gates")}
          value={totals.activeGates}
          subtitle={t("gates_page.active_gates_subtitle")}
          icon={RadioTower}
          iconColor="#2563eb"
          iconBgColor="#dbeafe"
          showChart={false}
        />
        <KPICardV2
          title={t("gates.waiting")}
          value={totals.waiting}
          subtitle={t("gates_page.waiting_subtitle")}
          icon={TimerReset}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          showChart={false}
        />
        <KPICardV2
          title={t("gates.ready")}
          value={totals.ready}
          subtitle={t("gates_page.ready_subtitle")}
          icon={CheckCircle2}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          showChart={false}
        />
        <KPICardV2
          title={t("gates.completed_today")}
          value={totals.completedToday}
          subtitle={t("gates_page.completed_today_subtitle")}
          icon={CheckCircle2}
          iconColor="#16a34a"
          iconBgColor="#dcfce7"
          showChart={false}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("gates_page.board")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("gates_page.board_subtitle")}
          </p>
        </div>
        <NedaaGateBoard gates={gates} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("gates_page.live_queue")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("gates_page.live_queue_subtitle")}
          </p>
        </div>
        <NedaaRequestsTable
          requests={activeRequests}
          gates={requestGates}
          mode="latest"
          showPagination={false}
        />
      </section>
    </div>
  );
}
