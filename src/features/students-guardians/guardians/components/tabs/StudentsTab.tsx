// FILE: src/components/students-guardians/guardian-tabs/StudentsTab.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users, GraduationCap, ArrowRight } from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { Student, StudentGuardian } from "@/features/students-guardians/students/types";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface StudentsTabProps {
  guardian: StudentGuardian;
}

export default function StudentsTab({ guardian }: StudentsTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  const [linkedStudents, setLinkedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);

      try {
        const students = await studentsService.fetchGuardianStudents(
          guardian.guardianId,
        );

        if (isCancelled) {
          return;
        }

        setLinkedStudents(students);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [guardian.guardianId]);

  const handleStudentClick = (studentId: string) => {
    router.push(`/${lang}/students-guardians/students/${studentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {isLoading ? <PartialLoader /> : null}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("sections.linked_students")} ({linkedStudents.length})
          </h2>
        </div>

        {linkedStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t("no_linked_students")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentClick(student.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white font-semibold">
                      {student.full_name_en
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {student.full_name_en}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {student.student_id || student.id}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {student.grade || student.gradeRequested}
                    </span>
                    {student.section && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{student.section}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : student.status === "Suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
