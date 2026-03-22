// FILE: src/components/students-guardians/StudentProfilePage.tsx

"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  ArrowRight,
  ArrowLeftRight,
  LogOut,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { Student } from "@/features/students-guardians/students/types";
import {
  StudentAttendanceTab,
  StudentBehaviorTab,
  StudentDocumentsTab,
  StudentEnrollmentHistoryTab,
  StudentGradesTab,
  StudentGuardiansTab,
  StudentMedicalTab,
  StudentNotesTab,
  StudentOverviewTab,
  StudentPersonalInfoTab,
  StudentTimelineTab,
  StudentTransfersTab,
  StudentWithdrawalTab,
} from "@/features/students-guardians/students/components/tabs";
import {
  getStudentDisplayName,
  getStudentDisplayId,
  getStudentGrade,
  getStudentClassroom,
} from "@/features/students-guardians/students/utils/studentUtils";
import MainLoader from "@/components/ui/loaders/MainLoader";

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
  | "timeline"
  | "transfers"
  | "withdrawal";

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
  {
    key: "transfers" as TabKey,
    labelKey: "tabs.transfers",
    icon: ArrowLeftRight,
  },
  { key: "withdrawal" as TabKey, labelKey: "tabs.withdrawal", icon: LogOut },
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
  const [studentRevision, setStudentRevision] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [enrichedStudent, setEnrichedStudent] =
    useState<studentsService.StudentWithEnrollmentContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const studentData = await studentsService.fetchStudentById(studentId);

        if (isCancelled) {
          return;
        }

        setStudent(studentData ?? null);

        if (!studentData) {
          setEnrichedStudent(null);
          return;
        }

        try {
          const enrichedStudents = await studentsService.fetchStudentsWithEnrollment();
          if (isCancelled) {
            return;
          }
          setEnrichedStudent(
            enrichedStudents.find((item) => item.id === studentId) ?? null,
          );
        } catch {
          if (!isCancelled) {
            setEnrichedStudent(null);
          }
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setStudent(null);
        setEnrichedStudent(null);
        setLoadError(
          error instanceof Error ? error.message : t("student_not_found"),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [studentId, studentRevision, t]);

  if (isLoading) {
    return <MainLoader />;
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">
            {loadError || t("student_not_found")}
          </p>
          <button
            onClick={() => router.push(`/${lang}/students-guardians/students`)}
            className="text-primary hover:text-hover font-medium"
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

  const studentWithNames = student as Student & {
    full_name_ar?: string;
    studentNameArabic?: string;
    full_name_en?: string;
    studentName?: string;
  };

  const studentName =
    locale === "ar"
      ? studentWithNames.full_name_ar ||
        studentWithNames.studentNameArabic ||
        studentWithNames.full_name_en ||
        studentWithNames.studentName ||
        getStudentDisplayName(student)
      : studentWithNames.full_name_en ||
        studentWithNames.studentName ||
        studentWithNames.full_name_ar ||
        getStudentDisplayName(student);

  const profileStudent = enrichedStudent ?? student;

  const tabContent: Record<TabKey, ReactNode> = {
    overview: <StudentOverviewTab student={profileStudent} />,
    personal: (
      <StudentPersonalInfoTab
        student={profileStudent}
        onStudentUpdated={() => setStudentRevision((current) => current + 1)}
      />
    ),
    guardians: <StudentGuardiansTab student={profileStudent} />,
    enrollment: <StudentEnrollmentHistoryTab student={profileStudent} />,
    attendance: <StudentAttendanceTab student={profileStudent} />,
    grades: <StudentGradesTab student={profileStudent} />,
    behavior: <StudentBehaviorTab student={profileStudent} />,
    documents: <StudentDocumentsTab student={profileStudent} />,
    medical: <StudentMedicalTab student={profileStudent} />,
    notes: <StudentNotesTab student={profileStudent} />,
    timeline: <StudentTimelineTab student={profileStudent} />,
    transfers: <StudentTransfersTab student={profileStudent} />,
    withdrawal: <StudentWithdrawalTab student={profileStudent} />,
  };

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
            {locale === "ar" ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{t("back_to_students")}</span>
          </button>

          {/* Student Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white text-2xl font-bold shrink-0">
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
                  className={`w-fit inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}
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
                  {enrichedStudent?.enrollment?.section ?? student.section ?? t("na")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("classroom")}:</span>{" "}
                  {getStudentClassroom(enrichedStudent ?? student)}
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
                      ? "border-primary text-primary"
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

      <div className="p-4 sm:p-6">
        {tabContent[activeTab] || (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
            {t("no_data")}
          </div>
        )}
      </div>
    </div>
  );
}
