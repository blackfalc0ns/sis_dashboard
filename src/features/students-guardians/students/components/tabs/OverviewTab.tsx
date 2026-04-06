// FILE: src/components/students-guardians/profile-tabs/OverviewTab.tsx

"use client";

import { AlertTriangle, TrendingUp, Award, AlertCircle } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTranslations } from "next-intl";
import { Student, RiskFlag } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getRiskFlagColor } from "@/features/students-guardians/students/utils/studentUtils";
import { generateWeeklyTimestamps, generateMonthlyTimestamps } from "@/utils/formatters/chartDataHelpers";
import { getStudentXpSummary } from "@/features/students-guardians/students/services/studentsService";

interface OverviewTabProps {
  student: Student;
}

export default function OverviewTab({ student }: OverviewTabProps) {
  const t = useTranslations("students_guardians.profile.overview");
  const xpSummary = getStudentXpSummary(student.id);
  
  // Generate timestamps for chart data
  const weeklyTimestamps = generateWeeklyTimestamps(4);
  const monthlyTimestamps = generateMonthlyTimestamps(4);

  const getRiskLabel = (flag: string) => {
    switch (flag) {
      case "attendance":
        return t("risk_flags.low_attendance");
      case "grades":
        return t("risk_flags.low_grades");
      case "behavior":
        return t("risk_flags.behavior_issues");
      default:
        return flag;
    }
  };

  // Mock data for charts
  const attendanceData = [92, 88, 95, 90, 87, 93, 89, 91, 94, 90];
  const days = Array.from({ length: 10 }, (_, i) =>
    t("day_label", { day: i + 1 }),
  );

  const subjectPerformance = [
    { subject: t("subjects.math"), score: 85 },
    { subject: t("subjects.science"), score: 90 },
    { subject: t("subjects.english"), score: 88 },
    { subject: t("subjects.arabic"), score: 92 },
    { subject: t("subjects.history"), score: 87 },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Flags Alert */}
      {student.risk_flags && student.risk_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                {t("risk_flags_alert")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.risk_flags.map((flag: RiskFlag, index: number) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskFlagColor(
                      flag,
                    )}`}
                  >
                    {getRiskLabel(flag)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("attendance")}
          value={`${student.attendance_percentage ?? 92}%`}
          subtitle={
            (student.attendance_percentage ?? 92) >= 90
              ? t("excellent")
              : t("needs_attention")
          }
          icon={TrendingUp}
          iconColor={
            (student.attendance_percentage ?? 92) >= 90 ? "#10b981" : "#f59e0b"
          }
          iconBgColor={
            (student.attendance_percentage ?? 92) >= 90 ? "#d1fae5" : "#fef3c7"
          }
          chartData={[
            { label: "W1", value: 90, ts: weeklyTimestamps[0] },
            { label: "W2", value: 91, ts: weeklyTimestamps[1] },
            { label: "W3", value: 91, ts: weeklyTimestamps[2] },
            { label: "W4", value: student.attendance_percentage ?? 92, ts: weeklyTimestamps[3] },
          ]}
          chartColor={
            (student.attendance_percentage ?? 92) >= 90 ? "#10b981" : "#f59e0b"
          }
        />
        <KPICardV2
          title={t("current_average")}
          value={`${student.current_average ?? 85}%`}
          subtitle={
            (student.current_average ?? 85) >= 85
              ? t("good_standing")
              : t("at_risk")
          }
          icon={Award}
          iconColor={
            (student.current_average ?? 85) >= 85 ? "#3b82f6" : "#ef4444"
          }
          iconBgColor={
            (student.current_average ?? 85) >= 85 ? "#dbeafe" : "#fee2e2"
          }
          chartData={[
            { label: "M1", value: 82, ts: monthlyTimestamps[0] },
            { label: "M2", value: 84, ts: monthlyTimestamps[1] },
            { label: "M3", value: 84, ts: monthlyTimestamps[2] },
            { label: "M4", value: student.current_average ?? 85, ts: monthlyTimestamps[3] },
          ]}
          chartColor={
            (student.current_average ?? 85) >= 85 ? "#3b82f6" : "#ef4444"
          }
        />
        <KPICardV2
          title={t("behavior_points")}
          value={xpSummary.totalXp}
          subtitle={t("xp_this_week", { count: xpSummary.weeklyXpDelta })}
          icon={Award}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: Math.max(xpSummary.totalXp - 15, 0), ts: weeklyTimestamps[0] },
            { label: "W2", value: Math.max(xpSummary.totalXp - 10, 0), ts: weeklyTimestamps[1] },
            { label: "W3", value: Math.max(xpSummary.totalXp - 5, 0), ts: weeklyTimestamps[2] },
            { label: "W4", value: xpSummary.totalXp, ts: weeklyTimestamps[3] },
          ]}
          chartColor="#8b5cf6"
        />
        <KPICardV2
          title={t("incidents")}
          value={xpSummary.negativeNotesCount}
          subtitle={t("this_semester")}
          icon={AlertCircle}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "M1", value: 1, ts: monthlyTimestamps[0] },
            { label: "M2", value: 3, ts: monthlyTimestamps[1] },
            { label: "M3", value: 2, ts: monthlyTimestamps[2] },
            { label: "M4", value: 2, ts: monthlyTimestamps[3] },
          ]}
          chartColor="#f59e0b"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("attendance_trend")}
          </h3>
          <LineChart
            xAxis={[{ scaleType: "point", data: days }]}
            series={[
              {
                data: attendanceData,
                color: "#3b82f6",
                label: t("attendance_percentage"),
              },
            ]}
            height={300}
          />
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("subject_performance")}
          </h3>
          <div className="space-y-4">
            {subjectPerformance.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.subject}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
