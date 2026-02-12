// FILE: src/components/students-guardians/StudentProfilePage.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { mockStudents } from "@/data/mockStudents";
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

interface StudentProfilePageProps {
  studentId: string;
}

type TabKey =
  | "overview"
  | "personal"
  | "guardians"
  | "attendance"
  | "grades"
  | "behavior"
  | "documents"
  | "medical"
  | "notes"
  | "timeline";

const tabs = [
  { key: "overview" as TabKey, label: "Overview", icon: Activity },
  { key: "personal" as TabKey, label: "Personal Info", icon: User },
  { key: "guardians" as TabKey, label: "Guardians", icon: Users },
  { key: "attendance" as TabKey, label: "Attendance", icon: Calendar },
  { key: "grades" as TabKey, label: "Grades", icon: GraduationCap },
  { key: "behavior" as TabKey, label: "Behavior", icon: Award },
  { key: "documents" as TabKey, label: "Documents", icon: FileText },
  { key: "medical" as TabKey, label: "Medical", icon: Heart },
  { key: "notes" as TabKey, label: "Notes", icon: MessageSquare },
  { key: "timeline" as TabKey, label: "Timeline", icon: Clock },
];

export default function StudentProfilePage({
  studentId,
}: StudentProfilePageProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const student = useMemo(() => {
    console.log("Looking for student with ID:", studentId);
    console.log(
      "Available students:",
      mockStudents.map((s) => ({ id: s.id, name: s.name })),
    );
    return mockStudents.find((s) => s.id === studentId);
  }, [studentId]);

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">Student not found</p>
          <button
            onClick={() => router.push(`/${lang}/students-guardians/students`)}
            className="text-[#036b80] hover:text-[#024d5c] font-medium"
          >
            Back to Students List
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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
            <span className="text-sm font-medium">Back to Students</span>
          </button>

          {/* Student Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#036b80] to-[#024d5c] flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {student.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.name}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}
                >
                  {student.status.charAt(0).toUpperCase() +
                    student.status.slice(1)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">ID:</span> {student.student_id}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Grade:</span> {student.grade}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Section:</span>{" "}
                  {student.section}
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
                  {tab.label}
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
