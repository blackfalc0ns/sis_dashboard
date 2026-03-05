// FILE: src/components/students-guardians/profile-tabs/AttendanceTab.tsx

"use client";

import { Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable } from "@/components/ui/data-table";
import { useTranslations } from "next-intl";

interface AttendanceTabProps {
  student: Student;
}

// Mock attendance records
const mockAttendanceRecords = [
  {
    id: "1",
    date: "2024-02-10",
    status: "present",
    minutes: 0,
    reason: "",
  },
  {
    id: "2",
    date: "2024-02-09",
    status: "present",
    minutes: 0,
    reason: "",
  },
  {
    id: "3",
    date: "2024-02-08",
    status: "late",
    minutes: 15,
    reason: "Traffic",
  },
  {
    id: "4",
    date: "2024-02-07",
    status: "present",
    minutes: 0,
    reason: "",
  },
  {
    id: "5",
    date: "2024-02-06",
    status: "absent",
    minutes: 0,
    reason: "Sick",
  },
  {
    id: "6",
    date: "2024-02-05",
    status: "present",
    minutes: 0,
    reason: "",
  },
  {
    id: "7",
    date: "2024-02-04",
    status: "present",
    minutes: 0,
    reason: "",
  },
];

export default function AttendanceTab({ student }: AttendanceTabProps) {
  const t = useTranslations("students_guardians.profile.attendance");
  // Mock chart data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  // Generate deterministic attendance percentages based on student ID
  const attendancePercentages = Array.from({ length: 30 }, (_, i) => {
    const seed = student.id.charCodeAt(0) + i;
    return Math.floor((seed % 20) + 80);
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      present: "bg-green-100 text-green-700",
      absent: "bg-red-100 text-red-700",
      late: "bg-yellow-100 text-yellow-700",
      leave: "bg-blue-100 text-blue-700",
    };

    const statusKey = status as "present" | "absent" | "late" | "leave";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.present}`}
      >
        {t(statusKey)}
      </span>
    );
  };

  const columns = [
    {
      key: "date",
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) =>
        getStatusBadge(value as "present" | "absent" | "late" | "leave"),
    },
    {
      key: "minutes",
      label: t("minutes_late"),
      render: (value: unknown) =>
        (value as number) > 0 ? `${value} ${t("min")}` : "-",
    },
    {
      key: "reason",
      label: t("reason"),
      render: (value: unknown) => (value as string) || "-",
    },
  ];

  const presentDays = mockAttendanceRecords.filter(
    (r) => r.status === "present",
  ).length;
  const absentDays = mockAttendanceRecords.filter(
    (r) => r.status === "absent",
  ).length;
  const lateDays = mockAttendanceRecords.filter(
    (r) => r.status === "late",
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("attendance_rate")}
          value={`${student.attendance_percentage}%`}
          subtitle={t("this_semester")}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "M1", value: 90 },
            { label: "M2", value: 91 },
            { label: "M3", value: 91 },
            { label: "M4", value: student.attendance_percentage ?? 92 },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("present_days")}
          value={presentDays}
          subtitle={t("last_7_days")}
          icon={Calendar}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 5 },
            { label: "W3", value: 4 },
            { label: "W4", value: presentDays },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("absent_days")}
          value={absentDays}
          subtitle={t("last_7_days")}
          icon={AlertCircle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "W1", value: 0 },
            { label: "W2", value: 0 },
            { label: "W3", value: 1 },
            { label: "W4", value: absentDays },
          ]}
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("late_arrivals")}
          value={lateDays}
          subtitle={t("last_7_days")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 0 },
            { label: "W2", value: 1 },
            { label: "W3", value: 0 },
            { label: "W4", value: lateDays },
          ]}
          chartColor="#f59e0b"
        />
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t("attendance_trend")}
        </h3>
        <div className="h-80">
          <LineChart
            xAxis={[
              {
                scaleType: "point",
                data: last30Days,
              },
            ]}
            series={[
              {
                data: attendancePercentages,
                label: t("attendance_percent"),
                color: "#036b80",
                curve: "linear",
              },
            ]}
            height={300}
            margin={{ top: 20, bottom: 60, left: 50, right: 20 }}
          />
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {t("recent_records")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{t("view_only")}</p>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={mockAttendanceRecords}
            showPagination={false}
          />
        </div>
      </div>
    </div>
  );
}
