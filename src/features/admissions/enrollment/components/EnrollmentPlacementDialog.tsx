"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type { Student } from "@/features/students-guardians/students/types";
import { createEnrollment, upsertEnrollment, validateEnrollment } from "../api/enrollmentApi";
import type { AcademicYearDto } from "../api/enrollmentDtos";
import type { EnrollmentRecord } from "../model/enrollment";
import { studentDisplayName } from "../model/enrollmentMappers";
import { useLocale } from "next-intl";

interface Option { id: string; name: string; parentId?: string }
interface Props { open: boolean; enrollment: EnrollmentRecord | null; students: Student[]; academicYears: AcademicYearDto[]; grades: Option[]; sections: Option[]; classrooms: Option[]; termId?: string | null; onClose: () => void; onSuccess: () => Promise<void> }

export default function EnrollmentPlacementDialog({ open, enrollment, students, academicYears, grades, sections, classrooms, termId, onClose, onSuccess }: Props) {
  const locale = useLocale();
  const [studentId, setStudentId] = useState(""); const [academicYearId, setAcademicYearId] = useState(""); const [gradeId, setGradeId] = useState(""); const [sectionId, setSectionId] = useState(""); const [classroomId, setClassroomId] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().slice(0, 10)); const [errors, setErrors] = useState<string[]>([]); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) return; setStudentId(enrollment?.studentId ?? ""); setAcademicYearId(enrollment?.academicYearId ?? ""); setGradeId(enrollment?.gradeId ?? ""); setSectionId(enrollment?.sectionId ?? ""); setClassroomId(enrollment?.classroomId ?? ""); setEnrollmentDate(enrollment?.enrollmentDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)); setErrors([]); }, [enrollment, open]);
  const shownSections = useMemo(() => sections.filter((item) => !gradeId || item.parentId === gradeId), [gradeId, sections]);
  const shownClassrooms = useMemo(() => classrooms.filter((item) => !sectionId || item.parentId === sectionId), [classrooms, sectionId]);
  if (!open) return null;
  const submit = async () => {
    const grade = grades.find((item) => item.id === gradeId); const section = sections.find((item) => item.id === sectionId); const classroom = classrooms.find((item) => item.id === classroomId); const year = academicYears.find((item) => item.id === academicYearId);
    if (!studentId || !academicYearId || !classroomId) return;
    const payload = { studentId, academicYearId, academicYear: year?.name, gradeId, grade: grade?.name, sectionId, section: section?.name, classroomId, classroom: classroom?.name, termId: termId || undefined, enrollmentDate, status: "active" as const };
    setSaving(true); setErrors([]);
    try { const validation = await validateEnrollment({ ...payload, enrollmentId: enrollment?.id }); if (!validation.valid) { setErrors(validation.errors); return; } if (enrollment) await upsertEnrollment(payload); else await createEnrollment(payload); await onSuccess(); onClose(); }
    catch { setErrors(["The enrollment could not be saved."]); } finally { setSaving(false); }
  };
  return <Modal isOpen onClose={onClose} title={enrollment ? "Edit placement" : "New enrollment"} size="lg" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => void submit()} loading={saving} disabled={!studentId || !academicYearId || !classroomId}>Save</Button></>}><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Select label="Student" value={studentId} disabled={Boolean(enrollment)} onChange={setStudentId} searchable options={students.map((student) => ({ value: student.id, label: studentDisplayName(student, locale) }))} />
    <Select label="Academic year" value={academicYearId} onChange={setAcademicYearId} options={academicYears.map((year) => ({ value: year.id, label: locale === "ar" ? year.nameAr || year.name : year.nameEn || year.name }))} />
    <Select label="Grade" value={gradeId} onChange={(value) => { setGradeId(value); setSectionId(""); setClassroomId(""); }} options={grades.map((option) => ({ value: option.id, label: option.name }))} />
    <Select label="Section" value={sectionId} onChange={(value) => { setSectionId(value); setClassroomId(""); }} options={shownSections.map((option) => ({ value: option.id, label: option.name }))} />
    <Select label="Classroom" value={classroomId} onChange={setClassroomId} options={shownClassrooms.map((option) => ({ value: option.id, label: option.name }))} />
    <Input label="Enrollment date" type="date" value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} />
    {errors.length > 0 && <div role="alert" className="md:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.join(" · ")}</div>}
  </div></Modal>;
}
