// FILE: src/components/students-guardians/profile-tabs/TimelineTab.tsx

"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  MessageSquare,
  GraduationCap,
  Filter,
} from "lucide-react";
import { Student } from "@/types/students";
import { getStudentTimeline } from "@/services/studentsService";
import { useTranslations } from "next-intl";

interface TimelineTabProps {
  student: Student;
}

export default function TimelineTab({ student }: TimelineTabProps) {
  const t = useTranslations("students_guardians.profile.timeline");
  const events = getStudentTimeline(student.student_id || "");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = events.filter((event) => {
    if (typeFilter === "all") return true;
    return event.type === typeFilter;
  });

  const getColorClasses = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      application_submitted: { bg: "bg-blue-100", text: "text-blue-700" },
      document_uploaded: { bg: "bg-green-100", text: "text-green-700" },
      test_scheduled: { bg: "bg-purple-100", text: "text-purple-700" },
      test_completed: { bg: "bg-purple-100", text: "text-purple-700" },
      interview_scheduled: { bg: "bg-orange-100", text: "text-orange-700" },
      interview_completed: { bg: "bg-orange-100", text: "text-orange-700" },
      decision_made: { bg: "bg-red-100", text: "text-red-700" },
      grade: { bg: "bg-blue-100", text: "text-blue-700" },
      reinforcement: { bg: "bg-green-100", text: "text-green-700" },
      absence: { bg: "bg-red-100", text: "text-red-700" },
      late: { bg: "bg-yellow-100", text: "text-yellow-700" },
      note: { bg: "bg-purple-100", text: "text-purple-700" },
      incident: { bg: "bg-orange-100", text: "text-orange-700" },
    };

    return colors[type] || { bg: "bg-gray-100", text: "text-gray-700" };
  };

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      application_submitted: <GraduationCap className="w-6 h-6" />,
      document_uploaded: <GraduationCap className="w-6 h-6" />,
      test_scheduled: <GraduationCap className="w-6 h-6" />,
      test_completed: <GraduationCap className="w-6 h-6" />,
      interview_scheduled: <MessageSquare className="w-6 h-6" />,
      interview_completed: <MessageSquare className="w-6 h-6" />,
      decision_made: <Award className="w-6 h-6" />,
      grade: <GraduationCap className="w-6 h-6" />,
      reinforcement: <Award className="w-6 h-6" />,
      absence: <Calendar className="w-6 h-6" />,
      late: <Clock className="w-6 h-6" />,
      note: <MessageSquare className="w-6 h-6" />,
      incident: <AlertTriangle className="w-6 h-6" />,
    };

    return icons[type] || <Calendar className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showFilters
              ? "bg-[#036b80] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Filter className="w-4 h-4" />
          {t("filters")}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("event_type")}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          >
            <option value="all">{t("all_events")}</option>
            <option value="application_submitted">{t("application")}</option>
            <option value="document_uploaded">{t("documents")}</option>
            <option value="test_completed">{t("tests")}</option>
            <option value="interview_completed">{t("interviews")}</option>
            <option value="decision_made">{t("decisions")}</option>
          </select>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("no_match")}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event) => {
                const colors = getColorClasses(event.type);
                const icon = getIcon(event.type);

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white ${colors.bg} shrink-0`}
                    >
                      <div className={colors.text}>{icon}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {event.title}
                          </h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
