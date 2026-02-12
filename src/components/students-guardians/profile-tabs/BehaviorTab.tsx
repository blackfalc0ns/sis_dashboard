// FILE: src/components/students-guardians/profile-tabs/BehaviorTab.tsx

"use client";

import { useState } from "react";
import { Award, AlertTriangle, Plus, TrendingUp } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Student } from "@/types/students";
import KPICard from "@/components/ui/common/KPICard";
import DataTable from "@/components/ui/common/DataTable";

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
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const reinforcementColumns = [
    {
      key: "date",
      label: "Date",
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "points",
      label: "Points",
      render: (value: unknown) => (
        <span className="font-semibold text-green-600">+{value as number}</span>
      ),
    },
    {
      key: "note",
      label: "Note",
    },
    {
      key: "created_by",
      label: "Recorded By",
    },
  ];

  const incidentColumns = [
    {
      key: "date",
      label: "Date",
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "severity",
      label: "Severity",
      render: (value: unknown) => getSeverityBadge(value as string),
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "action_taken",
      label: "Action Taken",
    },
    {
      key: "status",
      label: "Status",
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
          title="Total Points"
          value={245}
          icon={Award}
          numbers="+18 this week"
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title="Recent Points"
          value={totalPoints}
          icon={TrendingUp}
          numbers="Last 7 days"
          iconBgColor="bg-green-500"
        />
        <KPICard
          title="Total Incidents"
          value={totalIncidents}
          icon={AlertTriangle}
          numbers="This semester"
          iconBgColor="bg-orange-500"
        />
        <KPICard
          title="Open Incidents"
          value={openIncidents}
          icon={AlertTriangle}
          numbers="Needs attention"
          iconBgColor="bg-red-500"
        />
      </div>

      {/* Behavior Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Behavior Trend (Monthly)
        </h3>
        <div className="h-80">
          <BarChart
            xAxis={[{ scaleType: "band", data: months }]}
            series={[
              {
                data: positivePoints,
                label: "Positive Points",
                color: "#10b981",
                stack: "total",
              },
              {
                data: negativePoints,
                label: "Incidents",
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
                Positive Reinforcement
              </button>
              <button
                onClick={() => setActiveView("incidents")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "incidents"
                    ? "bg-[#036b80] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Incidents
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              Add {activeView === "reinforcement" ? "Points" : "Incident"}
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
