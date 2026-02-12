// FILE: src/components/students-guardians/profile-tabs/OverviewTab.tsx

"use client";

import { AlertTriangle, TrendingUp, Award, AlertCircle } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { RadarChart } from "@mui/x-charts";
import { Student } from "@/types/students";
import KPICard from "@/components/ui/common/KPICard";

interface OverviewTabProps {
  student: Student;
}

export default function OverviewTab({ student }: OverviewTabProps) {
  // Mock data for charts
  const attendanceData = [92, 88, 95, 90, 87, 93, 89, 91, 94, 90];
  const days = [
    "Day 1",
    "Day 2",
    "Day 3",
    "Day 4",
    "Day 5",
    "Day 6",
    "Day 7",
    "Day 8",
    "Day 9",
    "Day 10",
  ];

  const subjectPerformance = [
    { subject: "Math", score: 85 },
    { subject: "Science", score: 90 },
    { subject: "English", score: 88 },
    { subject: "Arabic", score: 92 },
    { subject: "History", score: 87 },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Flags Alert */}
      {student.risk_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Attention Required
              </h3>
              <p className="text-sm text-red-700">
                This student has {student.risk_flags.length} risk flag
                {student.risk_flags.length > 1 ? "s" : ""}:{" "}
                {student.risk_flags.join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Attendance"
          value={`${student.attendance_percentage}%`}
          icon={TrendingUp}
          numbers={
            student.attendance_percentage >= 90
              ? "Excellent"
              : "Needs Attention"
          }
          iconBgColor={
            student.attendance_percentage >= 90
              ? "bg-green-500"
              : "bg-orange-500"
          }
        />
        <KPICard
          title="Current Average"
          value={`${student.current_average}%`}
          icon={Award}
          numbers={student.current_average >= 85 ? "Good Standing" : "At Risk"}
          iconBgColor={
            student.current_average >= 85 ? "bg-blue-500" : "bg-red-500"
          }
        />
        <KPICard
          title="Behavior Points"
          value="245"
          icon={Award}
          numbers="+15 this week"
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title="Incidents"
          value="2"
          icon={AlertCircle}
          numbers="This semester"
          iconBgColor="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Attendance Trend (Last 10 Days)
          </h3>
          <div className="h-64">
            <LineChart
              xAxis={[{ scaleType: "point", data: days }]}
              series={[
                {
                  data: attendanceData,
                  label: "Attendance %",
                  color: "#036b80",
                  curve: "linear",
                },
              ]}
              height={240}
              margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
            />
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Subject Performance
          </h3>
          <div className="space-y-3">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {subject.subject}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {subject.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#036b80] h-2 rounded-full transition-all"
                    style={{ width: `${subject.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Student Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Student ID</span>
              <span className="text-sm font-medium text-gray-900">
                {student.student_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Grade</span>
              <span className="text-sm font-medium text-gray-900">
                {student.grade}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Section</span>
              <span className="text-sm font-medium text-gray-900">
                {student.section}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Enrollment Year</span>
              <span className="text-sm font-medium text-gray-900">
                {student.enrollment_year}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Date of Birth</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(student.date_of_birth).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Submitted Math Assignment
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Attended Science Lab
                </p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Received Positive Behavior Point
                </p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
