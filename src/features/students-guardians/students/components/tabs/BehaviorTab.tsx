"use client";

import { useMemo, useState } from "react";
import { Award, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable } from "@/components/ui/data-table";
import { useTranslations } from "next-intl";
import {
  getStudentXpEvents,
  getStudentXpSummary,
} from "@/features/students-guardians/students/services/studentsService";

interface BehaviorTabProps {
  student: Student;
}

export default function BehaviorTab({ student }: BehaviorTabProps) {
  const t = useTranslations("students_guardians.profile.behavior");
  const [activeView, setActiveView] = useState<"reinforcement" | "incidents">(
    "reinforcement",
  );

  const xpEvents = useMemo(() => getStudentXpEvents(student.id), [student.id]);
  const xpSummary = useMemo(() => getStudentXpSummary(student.id), [student.id]);

  const reinforcementEvents = xpEvents.filter((event) => event.points > 0);
  const incidents = xpEvents
    .filter((event) => event.points < 0)
    .map((event) => ({
      id: event.id,
      date: event.date,
      severity:
        Math.abs(event.points) >= 35
          ? "high"
          : Math.abs(event.points) >= 15
            ? "medium"
            : "low",
      description: event.note,
      action_taken: t("xp_deduction", { count: Math.abs(event.points) }),
      status: "resolved",
      created_by: event.created_by,
    }));

  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const monthlyChart = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthFormatter.format(date),
        positive: 0,
        negative: 0,
      };
    });

    xpEvents.forEach((event) => {
      const eventDate = new Date(event.date);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      const bucket = buckets.find((entry) => entry.key === key);
      if (!bucket) return;

      if (event.points > 0) {
        bucket.positive += event.points;
      } else {
        bucket.negative += Math.abs(event.points);
      }
    });

    return buckets;
  }, [xpEvents, monthFormatter]);

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-yellow-100 text-yellow-700",
      medium: "bg-orange-100 text-orange-700",
      high: "bg-red-100 text-red-700",
    };

    const severityKey = severity as "low" | "medium" | "high";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[severity]}`}
      >
        {t(severityKey)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
    };

    const statusKey = status as "open" | "resolved";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[status]}`}
      >
        {t(statusKey)}
      </span>
    );
  };

  const reinforcementColumns = [
    {
      key: "date",
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "category",
      label: t("category"),
    },
    {
      key: "points",
      label: t("points"),
      render: (value: unknown) => (
        <span className="font-semibold text-green-600">+{value as number}</span>
      ),
    },
    {
      key: "note",
      label: t("note"),
    },
    {
      key: "created_by",
      label: t("recorded_by"),
    },
  ];

  const incidentColumns = [
    {
      key: "date",
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "severity",
      label: t("severity"),
      render: (value: unknown) => getSeverityBadge(value as string),
    },
    {
      key: "description",
      label: t("description"),
    },
    {
      key: "action_taken",
      label: t("action_taken"),
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => getStatusBadge(value as string),
    },
  ];

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((incident) => incident.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardV2
          title={t("total_points")}
          value={xpSummary.totalXp}
          subtitle={t("net_change", { count: xpSummary.weeklyXpDelta })}
          icon={Award}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={monthlyChart.map((entry) => ({
            label: entry.label,
            value: entry.positive - entry.negative,
          }))}
          chartColor="#8b5cf6"
        />
        <KPICardV2
          title={t("recent_points")}
          value={xpSummary.recentXp}
          subtitle={t("last_7_days")}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={monthlyChart.map((entry) => ({
            label: entry.label,
            value: entry.positive,
          }))}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("total_incidents")}
          value={totalIncidents}
          subtitle={t("this_semester")}
          icon={AlertTriangle}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={monthlyChart.map((entry) => ({
            label: entry.label,
            value: entry.negative,
          }))}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("open_incidents")}
          value={openIncidents}
          subtitle={t("needs_attention")}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={monthlyChart.map((entry) => ({
            label: entry.label,
            value: entry.negative,
          }))}
          chartColor="#ef4444"
        />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          {t("behavior_trend")}
        </h3>
        <div className="h-80">
          <BarChart
            xAxis={[{ scaleType: "band", data: monthlyChart.map((entry) => entry.label) }]}
            series={[
              {
                data: monthlyChart.map((entry) => entry.positive),
                label: t("positive_points"),
                color: "#10b981",
                stack: "total",
              },
              {
                data: monthlyChart.map((entry) => entry.negative),
                label: t("incidents"),
                color: "#ef4444",
                stack: "total",
              },
            ]}
            height={300}
            margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView("reinforcement")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === "reinforcement"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("positive_reinforcement")}
              </button>
              <button
                onClick={() => setActiveView("incidents")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === "incidents"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("incidents")}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeView === "reinforcement" ? (
            reinforcementEvents.length > 0 ? (
              <DataTable
                columns={reinforcementColumns}
                data={reinforcementEvents as unknown as Record<string, unknown>[]}
                showPagination={false}
              />
            ) : (
              <div className="py-10 text-center text-sm text-gray-500">
                {t("no_reinforcement")}
              </div>
            )
          ) : incidents.length > 0 ? (
            <DataTable
              columns={incidentColumns}
              data={incidents as unknown as Record<string, unknown>[]}
              showPagination={false}
            />
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              {t("no_incidents")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
