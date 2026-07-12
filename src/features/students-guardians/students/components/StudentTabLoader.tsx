"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { Student } from "@/features/students-guardians/students/types";
import OverviewTab from "@/features/students-guardians/students/components/tabs/OverviewTab";
import PersonalInfoTab from "@/features/students-guardians/students/components/tabs/PersonalInfoTab";
import GuardiansTab from "@/features/students-guardians/students/components/tabs/GuardiansTab";
import EnrollmentHistoryTab from "@/features/students-guardians/students/components/tabs/EnrollmentHistoryTab";
import DocumentsTab from "@/features/students-guardians/students/components/tabs/DocumentsTab";
import MedicalTab from "@/features/students-guardians/students/components/tabs/MedicalTab";
import NotesTab from "@/features/students-guardians/students/components/tabs/NotesTab";
import TimelineTab from "@/features/students-guardians/students/components/tabs/TimelineTab";
import BehaviorTab from "@/features/students-guardians/students/components/tabs/BehaviorTab";
import GradesTab from "@/features/students-guardians/students/components/tabs/GradesTab";
import HeroJourneyTab from "@/features/students-guardians/students/components/tabs/HeroJourneyTab";
import ReinforcementProgressTab from "@/features/students-guardians/students/components/tabs/ReinforcementProgressTab";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import { Clock } from "lucide-react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

export type StudentTabKey =
  | "overview"
  | "personal"
  | "guardians"
  | "enrollment"
  | "documents"
  | "medical"
  | "notes"
  | "timeline"
  | "behavior"
  | "attendance"
  | "grades"
  | "reinforcement"
  | "hero-journey";

interface StudentTabLoaderProps {
  studentId: string;
  tab: StudentTabKey;
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
      <Clock className="w-12 h-12" />
      <p className="text-lg font-semibold">{label} — Coming Soon</p>
      <p className="text-sm text-gray-400">
        This section will be available when the API endpoint is ready.
      </p>
    </div>
  );
}

function renderTab(
  tab: StudentTabKey,
  student: Student,
  onStudentUpdated: () => void,
  academicYearId?: string | null,
  termId?: string | null,
) {
  switch (tab) {
    case "overview":
      return <OverviewTab student={student} />;
    case "personal":
      return (
        <PersonalInfoTab student={student} onStudentUpdated={onStudentUpdated} />
      );
    case "guardians":
      return <GuardiansTab student={student} />;
    case "enrollment":
      return <EnrollmentHistoryTab student={student} />;
    case "documents":
      return <DocumentsTab student={student} />;
    case "medical":
      return <MedicalTab student={student} />;
    case "notes":
      return <NotesTab student={student} />;
    case "timeline":
      return <TimelineTab student={student} />;
    case "behavior":
      return <BehaviorTab student={student} />;
    case "attendance":
      return <ComingSoonTab label="Attendance" />;
    case "grades":
      return (
        <GradesTab
          student={student}
          academicYearId={academicYearId}
          termId={termId}
        />
      );
    case "reinforcement":
      return (
        <ReinforcementProgressTab
          studentId={student.id}
          academicYearId={academicYearId}
          termId={termId}
        />
      );
    case "hero-journey":
      return <HeroJourneyTab student={student} academicYearId={academicYearId} termId={termId} />;
    default:
      return null;
  }
}

export default function StudentTabLoader({
  studentId,
  tab,
}: StudentTabLoaderProps) {
  const { yearId, termId } = useStudentsGuardiansYearTermContext();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const loadStudent = async () => {
    setIsLoading(true);
    setIsNotFound(false);
    try {
      const data = await studentsService.fetchStudentById(studentId);
      if (!data) {
        setIsNotFound(true);
      } else {
        setStudent(data);
      }
    } catch {
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await studentsService.fetchStudentById(studentId);
        if (!mounted) return;
        if (!data) {
          setIsNotFound(true);
        } else {
          setStudent(data);
        }
      } catch {
        if (mounted) setIsNotFound(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <PartialLoader size={32} />
      </div>
    );
  }

  if (isNotFound) {
    notFound();
  }

  if (!student) return null;

  return renderTab(tab, student, loadStudent, yearId, termId);
}
