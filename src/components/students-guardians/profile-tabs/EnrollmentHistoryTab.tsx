// FILE: src/components/students-guardians/profile-tabs/EnrollmentHistoryTab.tsx

"use client";

import { useMemo } from "react";
import {
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Student, StudentEnrollment } from "@/types/students";
import { getEnrollmentByStudentId } from "@/data/mockEnrollments";
import { useTranslations } from "next-intl";

interface EnrollmentHistoryTabProps {
  student: Student;
}

export default function EnrollmentHistoryTab({
  student,
}: EnrollmentHistoryTabProps) {
  const t = useTranslations("students_guardians.profile.enrollment_history");
  const enrollment = useMemo(() => {
    return getEnrollmentByStudentId(student.id);
  }, [student.id]);

  const enrollmentHistory = enrollment ? [enrollment] : [];

  const getStatusIcon = (status: StudentEnrollment["status"]) => {
    switch (status) {
      case "active":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "withdrawn":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: StudentEnrollment["status"]) => {
    const statusConfig = {
      active: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      withdrawn: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (enrollmentHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{t("no_history")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("summary")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {t("total_years")}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {enrollmentHistory.length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {t("completed")}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {enrollmentHistory.filter((e) => e.status === "completed").length}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                {t("current_grade")}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {enrollment?.grade || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t("timeline")}
        </h3>
        <div className="space-y-6">
          {enrollmentHistory.map((enrollment, index) => (
            <div key={enrollment.enrollmentId} className="relative">
              {/* Timeline Line */}
              {index < enrollmentHistory.length - 1 && (
                <div className="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Enrollment Card */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getStatusIcon(enrollment.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-gray-900">
                            {enrollment.academicYear}
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {t("current")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {t("enrollment_id")}: {enrollment.enrollmentId}
                        </p>
                      </div>
                      {getStatusBadge(enrollment.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("grade")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.grade}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("section")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.section}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("enrollment_date")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(enrollment.enrollmentDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progression Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("grade_progression")}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {enrollmentHistory.map((enrollment, index) => (
            <div key={enrollment.enrollmentId} className="flex items-center">
              <div className="px-4 py-2 rounded-lg font-medium text-sm bg-[#036b80] text-white">
                {enrollment.grade}
                <span className="text-xs ml-1 opacity-75">
                  ({enrollment.academicYear.split("-")[0]})
                </span>
              </div>
              {index < enrollmentHistory.length - 1 && (
                <div className="mx-2 text-gray-400">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
