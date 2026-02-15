// FILE: src/components/students-guardians/profile-tabs/BehaviorTab.tsx

"use client";

import { useState } from "react";
import { Award, AlertTriangle, Plus, TrendingUp } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Student } from "@/types/students";
import KPICard from "@/components/ui/common/KPICard";
import DataTable from "@/components/ui/common/DataTable";
import { useTranslations } from "next-intl";

interface BehaviorTabProps {
  student: Student;
}

// Mock behavior data
const mockReinforcementEvents = [
  {
    id: "1",
    date: "2024-02-10",
    category: "Academic Excellence",
    points: 10,
    note: "Excellent performance in Math quiz",
    created_by: "Mr. Ahmed",
  },
  {
    id: "2",
    date: "2024-02-08",
    category: "Helping Others",
    points: 5,
    note: "Helped classmate with homework",
    created_by: "Ms. Fatima",
  },
  {
    id: "3",
    date: "2024-02-05",
    category: "Participation",
    points: 3,
    note: "Active participation in class discussion",
    created_by: "Mr. Hassan",
  },
];

const mockIncidents = [
  {
    id: "1",
    date: "2024-02-06",
    severity: "low",
    description: "Late to class",
    action_taken: "Verbal warning",
    status: "resolved",
    created_by: "Mr. Ahmed",
  },
  {
    id: "2",
    date: "2024-01-28",
    severity: "medium",
    description: "Disrupting class",
    action_taken: "Parent meeting scheduled",
    status: "resolved",
    created_by: "Ms. Fatima",
  },
];

export default function BehaviorTab({ student }: BehaviorTabProps) {
  const t = useTranslations("students_guardians.profile.behavior");
  const [activeView, setActiveView] = useState<"reinforcement" | "incidents">(
    "reinforcement",
  );

  // Mock chart data
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const positivePoints = [45, 52, 48, 55, 50, 58];
  const negativePoints = [5, 3, 8, 4, 6, 2];

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-yellow-100 text-yellow-700",
      medium: "bg-orange-100 text-orange-700",
      high: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[severity]}`}
      >
        {t(severity as any)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {t(status as any)}
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

  const totalPoints = mockReinforcementEvents.reduce(
    (sum, e) => sum + e.points,
    0,
  );
  const totalIncidents = mockIncidents.length;
  const openIncidents = mockIncidents.filter((i) => i.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("total_points")}
          value={245}
          icon={Award}
          numbers={t("this_week", { count: 18 })}
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title={t("recent_points")}
          value={totalPoints}
          icon={TrendingUp}
          numbers={t("last_7_days")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("total_incidents")}
          value={totalIncidents}
          icon={AlertTriangle}
          numbers={t("this_semester")}
          iconBgColor="bg-orange-500"
        />
        <KPICard
          title={t("open_incidents")}
          value={openIncidents}
          icon={AlertTriangle}
          numbers={t("needs_attention")}
          iconBgColor="bg-red-500"
        />
      </div>

      {/* Behavior Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t("behavior_trend")}
        </h3>
        <div className="h-80">
          <BarChart
            xAxis={[{ scaleType: "band", data: months }]}
            series={[
              {
                data: positivePoints,
                label: t("positive_points"),
                color: "#10b981",
                stack: "total",
              },
              {
                data: negativePoints,
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView("reinforcement")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "reinforcement"
                    ? "bg-[#036b80] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("positive_reinforcement")}
              </button>
              <button
                onClick={() => setActiveView("incidents")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "incidents"
                    ? "bg-[#036b80] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("incidents")}
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              {activeView === "reinforcement"
                ? t("add_points")
                : t("add_incident")}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeView === "reinforcement" ? (
            <DataTable
              columns={reinforcementColumns}
              data={mockReinforcementEvents}
              showPagination={false}
            />
          ) : (
            <DataTable
              columns={incidentColumns}
              data={mockIncidents}
              showPagination={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
