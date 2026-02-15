// FILE: src/components/students-guardians/StudentProfilePage.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  Users,
  Calendar,
  GraduationCap,
  Heart,
  FileText,
  Activity,
  MessageSquare,
  Clock,
  Award,
} from "lucide-react";
import * as studentsService from "@/services/studentsService";
import {
  getStudentDisplayName,
  getStudentDisplayId,
  getStudentGrade,
} from "@/utils/studentUtils";
import OverviewTab from "./profile-tabs/OverviewTab";
import PersonalInfoTab from "./profile-tabs/PersonalInfoTab";
import GuardiansTab from "./profile-tabs/GuardiansTab";
import AttendanceTab from "./profile-tabs/AttendanceTab";
import GradesTab from "./profile-tabs/GradesTab";
import BehaviorTab from "./profile-tabs/BehaviorTab";
import DocumentsTab from "./profile-tabs/DocumentsTab";
import MedicalTab from "./profile-tabs/MedicalTab";
import NotesTab from "./profile-tabs/NotesTab";
import TimelineTab from "./profile-tabs/TimelineTab";
import EnrollmentHistoryTab from "./profile-tabs/EnrollmentHistoryTab";

interface StudentProfilePageProps {
  studentId: string;
}

type TabKey =
  | "overview"
  | "personal"
  | "guardians"
  | "enrollment"
  | "attendance"
  | "grades"
  | "behavior"
  | "documents"
  | "medical"
  | "notes"
  | "timeline";

const tabs = [
  { key: "overview" as TabKey, labelKey: "tabs.overview", icon: Activity },
  { key: "personal" as TabKey, labelKey: "tabs.personal_info", icon: User },
  { key: "guardians" as TabKey, labelKey: "tabs.guardians", icon: Users },
  {
    key: "enrollment" as TabKey,
    labelKey: "tabs.enrollment_history",
    icon: GraduationCap,
  },
  { key: "attendance" as TabKey, labelKey: "tabs.attendance", icon: Calendar },
  { key: "grades" as TabKey, labelKey: "tabs.grades", icon: GraduationCap },
  { key: "behavior" as TabKey, labelKey: "tabs.behavior", icon: Award },
  { key: "documents" as TabKey, labelKey: "tabs.documents", icon: FileText },
  { key: "medical" as TabKey, labelKey: "tabs.medical", icon: Heart },
  { key: "notes" as TabKey, labelKey: "tabs.notes", icon: MessageSquare },
  { key: "timeline" as TabKey, labelKey: "tabs.timeline", icon: Clock },
];

export default function StudentProfilePage({
  studentId,
}: StudentProfilePageProps) {
  const t = useTranslations("students_guardians.profile");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const student = useMemo(() => {
    return studentsService.getStudentById(studentId);
  }, [studentId]);
  console.log(student);
  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">{t("student_not_found")}</p>
          <button
            onClick={() => router.push(`/${lang}/students-guardians/students`)}
            className="text-[#036b80] hover:text-[#024d5c] font-medium"
          >
            {t("back_to_students")}
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "withdrawn":
        return "bg-gray-100 text-gray-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = status.toLowerCase() as
      | "active"
      | "withdrawn"
      | "suspended";
    return t(`status.${statusKey}`);
  };

  const studentName =
    locale === "ar"
      ? (student as any).full_name_ar ||
        (student as any).studentNameArabic ||
        (student as any).full_name_en ||
        (student as any).studentName ||
        getStudentDisplayName(student)
      : (student as any).full_name_en ||
        (student as any).studentName ||
        (student as any).full_name_ar ||
        getStudentDisplayName(student);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 sm:p-6">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/${lang}/students-guardians/students`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("back_to_students")}</span>
          </button>

          {/* Student Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#036b80] to-[#024d5c] flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {studentName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {studentName}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}
                >
                  {getStatusLabel(student.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("student_id")}:</span>{" "}
                  {getStudentDisplayId(student)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("grade")}:</span>{" "}
                  {locale === "ar" &&
                  getStudentGrade(student).startsWith("Grade ")
                    ? `الصف ${getStudentGrade(student).replace("Grade ", "")}`
                    : getStudentGrade(student)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("section")}:</span>{" "}
                  {student.section ?? t("na")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-[#036b80] text-[#036b80]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === "overview" && <OverviewTab student={student} />}
        {activeTab === "personal" && <PersonalInfoTab student={student} />}
        {activeTab === "guardians" && <GuardiansTab student={student} />}
        {activeTab === "enrollment" && (
          <EnrollmentHistoryTab student={student} />
        )}
        {activeTab === "attendance" && <AttendanceTab student={student} />}
        {activeTab === "grades" && <GradesTab student={student} />}
        {activeTab === "behavior" && <BehaviorTab student={student} />}
        {activeTab === "documents" && <DocumentsTab student={student} />}
        {activeTab === "medical" && <MedicalTab student={student} />}
        {activeTab === "notes" && <NotesTab student={student} />}
        {activeTab === "timeline" && <TimelineTab student={student} />}
      </div>
    </div>
  );
}
