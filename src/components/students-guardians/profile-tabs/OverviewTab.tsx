// FILE: src/components/students-guardians/profile-tabs/OverviewTab.tsx

"use client";

import { AlertTriangle, TrendingUp, Award, AlertCircle } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { RadarChart } from "@mui/x-charts";
import { useTranslations, useLocale } from "next-intl";
import { Student, RiskFlag } from "@/types/students";
import KPICard from "@/components/ui/common/KPICard";
import { getRiskFlagColor } from "@/utils/studentUtils";

interface OverviewTabProps {
  student: Student;
}

export default function OverviewTab({ student }: OverviewTabProps) {
  const t = useTranslations("students_guardians.profile.overview");
  const locale = useLocale();

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
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">
                {t("risk_flags_detected")}
              </h3>
              <div className="flex gap-2 flex-wrap mb-2">
                {student.risk_flags.map((flag: RiskFlag) => (
                  <span
                    key={flag}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskFlagColor(flag)}`}
                  >
                    {getRiskLabel(flag)}
                  </span>
                ))}
              </div>
              <p className="text-sm text-orange-700">
                {t("requires_attention")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("attendance")}
          value={`${student.attendance_percentage ?? 92}%`}
          icon={TrendingUp}
          numbers={
            (student.attendance_percentage ?? 92) >= 90
              ? t("excellent")
              : t("needs_attention")
          }
          iconBgColor={
            (student.attendance_percentage ?? 92) >= 90
              ? "bg-green-500"
              : "bg-orange-500"
          }
        />
        <KPICard
          title={t("current_average")}
          value={`${student.current_average ?? 85}%`}
          icon={Award}
          numbers={
            (student.current_average ?? 85) >= 85
              ? t("good_standing")
              : t("at_risk")
          }
          iconBgColor={
            (student.current_average ?? 85) >= 85 ? "bg-blue-500" : "bg-red-500"
          }
        />
        <KPICard
          title={t("behavior_points")}
          value="245"
          icon={Award}
          numbers={t("this_week", { count: 15 })}
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title={t("incidents")}
          value="2"
          icon={AlertCircle}
          numbers={t("this_semester")}
          iconBgColor="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("attendance_trend")}
          </h3>
          <div className="h-64">
            <LineChart
              xAxis={[{ scaleType: "point", data: days }]}
              series={[
                {
                  data: attendanceData,
                  label: t("attendance_percent"),
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
            {t("subject_performance")}
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
            {t("student_information")}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("student_id")}</span>
              <span className="text-sm font-medium text-gray-900">
                {student.student_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("grade")}</span>
              <span className="text-sm font-medium text-gray-900">
                {locale === "ar" && student.grade?.startsWith("Grade ")
                  ? `الصف ${student.grade.replace("Grade ", "")}`
                  : student.grade}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("section")}</span>
              <span className="text-sm font-medium text-gray-900">
                {student.section}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                {t("enrollment_year")}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {student.enrollment_year}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                {t("date_of_birth")}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(
                  student.date_of_birth ?? student.dateOfBirth,
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("recent_activity")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t("submitted_assignment")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("hours_ago", { count: 2 })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t("attended_lab")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("days_ago", { count: 1 })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t("received_behavior_point")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("days_ago", { count: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
