// FILE: src/components/students-guardians/StudentsGuardiansDashboard.tsx

"use client";

import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import KPICard from "@/components/ui/common/KPICard";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { mockStudents } from "@/data/mockStudents";
import { Student } from "@/types/students";
import { useMemo } from "react";

export default function StudentsGuardiansDashboard() {
  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = mockStudents.length;
    const active = mockStudents.filter(
      (s: Student) => s.status === "active",
    ).length;
    const withdrawn = mockStudents.filter(
      (s: Student) => s.status === "withdrawn",
    ).length;
    const atRisk = mockStudents.filter(
      (s: Student) => s.risk_flags.length > 0,
    ).length;
    const avgAttendance = Math.round(
      mockStudents.reduce(
        (sum: number, s: Student) => sum + s.attendance_percentage,
        0,
      ) / total,
    );
    const avgGrade = Math.round(
      mockStudents.reduce(
        (sum: number, s: Student) => sum + s.current_average,
        0,
      ) / total,
    );

    return { total, active, withdrawn, atRisk, avgAttendance, avgGrade };
  }, []);

  // Students by status
  const statusData = useMemo(() => {
    return [
      {
        status: "Active",
        count: mockStudents.filter((s: Student) => s.status === "active")
          .length,
      },
      {
        status: "Withdrawn",
        count: mockStudents.filter((s: Student) => s.status === "withdrawn")
          .length,
      },
      {
        status: "Suspended",
        count: mockStudents.filter((s: Student) => s.status === "suspended")
          .length,
      },
    ];
  }, []);

  // Students by grade
  const gradeData = useMemo(() => {
    const grades = mockStudents.reduce(
      (acc: Record<string, number>, student: Student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(grades).map(([grade, count]) => ({
      id: grade,
      label: grade,
      value: count as number,
    }));
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Students & Guardians Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of students, guardians, and academic performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total Students"
          value={kpis.total}
          icon={Users}
          numbers={`${kpis.active} active`}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title="Active Students"
          value={kpis.active}
          icon={UserCheck}
          numbers="Currently enrolled"
          iconBgColor="bg-green-500"
        />
        <KPICard
          title="At-Risk Students"
          value={kpis.atRisk}
          icon={AlertTriangle}
          numbers="Need attention"
          iconBgColor="bg-red-500"
        />
        <KPICard
          title="Avg Attendance"
          value={`${kpis.avgAttendance}%`}
          icon={TrendingUp}
          numbers={kpis.avgAttendance >= 90 ? "+Good" : "-Below Target"}
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title="Avg Grade"
          value={`${kpis.avgGrade}%`}
          icon={GraduationCap}
          numbers="Overall performance"
          iconBgColor="bg-indigo-500"
        />
        <KPICard
          title="Withdrawn"
          value={kpis.withdrawn}
          icon={UserX}
          numbers="This year"
          iconBgColor="bg-gray-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Students by Status
          </h3>
          <div className="h-80">
            <BarChart
              dataset={statusData}
              xAxis={[{ scaleType: "band", dataKey: "status" }]}
              series={[
                {
                  dataKey: "count",
                  label: "Students",
                  color: "#036b80",
                },
              ]}
              height={300}
              margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
            />
          </div>
        </div>

        {/* Students by Grade */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Students by Grade
          </h3>
          <div className="h-80 flex items-center justify-center">
            <PieChart
              series={[
                {
                  data: gradeData,
                  highlightScope: { fade: "global", highlight: "item" },
                },
              ]}
              height={300}
              width={400}
              margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">
                  Attendance Risk
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {
                    mockStudents.filter((s: Student) =>
                      s.risk_flags.includes("attendance"),
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Low Grades
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {
                    mockStudents.filter((s: Student) =>
                      s.risk_flags.includes("grades"),
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">
                  Behavior Issues
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {
                    mockStudents.filter((s: Student) =>
                      s.risk_flags.includes("behavior"),
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
