// FILE: src/components/students-guardians/profile-tabs/AttendanceTab.tsx

"use client";

import { Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Student } from "@/types/students";
import KPICard from "@/components/ui/common/KPICard";
import DataTable from "@/components/ui/common/DataTable";

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
  // Mock chart data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const attendancePercentages = Array.from({ length: 30 }, () =>
    Math.floor(Math.random() * 20 + 80),
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      present: "bg-green-100 text-green-700",
      absent: "bg-red-100 text-red-700",
      late: "bg-yellow-100 text-yellow-700",
      leave: "bg-blue-100 text-blue-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.present}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => getStatusBadge(value as string),
    },
    {
      key: "minutes",
      label: "Minutes Late",
      render: (value: unknown) =>
        (value as number) > 0 ? `${value} min` : "-",
    },
    {
      key: "reason",
      label: "Reason",
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
        <KPICard
          title="Attendance Rate"
          value={`${student.attendance_percentage}%`}
          icon={TrendingUp}
          numbers="This semester"
          iconBgColor="bg-green-500"
        />
        <KPICard
          title="Present Days"
          value={presentDays}
          icon={Calendar}
          numbers="Last 7 days"
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title="Absent Days"
          value={absentDays}
          icon={AlertCircle}
          numbers="Last 7 days"
          iconBgColor="bg-red-500"
        />
        <KPICard
          title="Late Arrivals"
          value={lateDays}
          icon={Clock}
          numbers="Last 7 days"
          iconBgColor="bg-yellow-500"
        />
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Attendance Trend (Last 30 Days)
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
                label: "Attendance %",
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
            Recent Attendance Records
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            View-only attendance history
          </p>
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
