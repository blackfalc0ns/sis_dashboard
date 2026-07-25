"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CheckCircle, Plus, Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, DataTable, EmptyState, FilterPanel, Input, Select } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchStudentById, fetchStudents } from "@/features/students-guardians/students/services/studentsApiService";
import type { Student } from "@/features/students-guardians/students/types";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchEnrollmentAcademicYears, fetchEnrollments } from "../api/enrollmentApi";
import type { AcademicYearDto, EnrollmentDto, EnrollmentStatusDto } from "../api/enrollmentDtos";
import EnrollmentDetailsDrawer from "../components/EnrollmentDetailsDrawer";
import EnrollmentPlacementDialog from "../components/EnrollmentPlacementDialog";
import EnrollmentWorkflowDialog from "../components/EnrollmentWorkflowDialog";
import { mapEnrollment, studentDisplayName } from "../model/enrollmentMappers";
import type { EnrollmentRecord } from "../model/enrollment";

interface Option { id: string; name: string; parentId?: string }

export default function EnrollmentList() {
  const t = useTranslations("admissions.enrollment"); const locale = useLocale();
  const [now] = useState(() => Date.now());
  const { yearId, termId, isReadOnly } = useAdmissionsYearTermContext();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("students.enrollments.view"); const canViewStudents = hasPermission("students.records.view"); const canManage = hasPermission("students.enrollments.manage") && !isReadOnly; const canManageLifecycle = hasPermission("students.lifecycle.manage") && !isReadOnly;
  const [dtos, setDtos] = useState<EnrollmentDto[]>([]); const [students, setStudents] = useState<Student[]>([]); const [studentMap, setStudentMap] = useState<Map<string, Student>>(new Map()); const [academicYears, setAcademicYears] = useState<AcademicYearDto[]>([]);
  const [grades, setGrades] = useState<Option[]>([]); const [sections, setSections] = useState<Option[]>([]); const [classrooms, setClassrooms] = useState<Option[]>([]);
  const resolvedStudentIds = useRef(new Set<string>());
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [search, setSearch] = useState(""); const [status, setStatus] = useState<EnrollmentStatusDto | "all">("all"); const [selected, setSelected] = useState<EnrollmentRecord | null>(null); const [placementOpen, setPlacementOpen] = useState(false); const [editing, setEditing] = useState<EnrollmentRecord | null>(null); const [workflow, setWorkflow] = useState<"transfer" | "withdraw" | "promote" | null>(null);

  const load = useCallback(async () => {
    if (!canView) return; setLoading(true); setError("");
    try { const [nextEnrollments, nextYears] = await Promise.all([fetchEnrollments(status === "all" ? undefined : { status }), fetchEnrollmentAcademicYears()]); setDtos(nextEnrollments); setAcademicYears(nextYears); }
    catch { setError(t("load_error")); } finally { setLoading(false); }
  }, [canView, status, t]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { if (!canViewStudents) return; void fetchStudents().then(setStudents).catch(() => setStudents([])); }, [canViewStudents]);
  useEffect(() => {
    if (!canViewStudents || dtos.length === 0) return; let active = true;
    const missing = [...new Set(dtos.map((item) => item.studentId))].filter((id) => !resolvedStudentIds.current.has(id));
    missing.forEach((id) => resolvedStudentIds.current.add(id));
    void Promise.all(missing.map(async (id) => { try { return [id, await fetchStudentById(id)] as const; } catch { return [id, undefined] as const; } })).then((entries) => { if (!active) return; setStudentMap((current) => { const next = new Map(current); entries.forEach(([id, student]) => { if (student) next.set(id, student); }); return next; }); });
    return () => { active = false; };
  }, [canViewStudents, dtos]);
  useEffect(() => { if (!yearId || !termId) return; void fetchStructureTree(yearId, termId).then((tree) => { const name = (item: { name?: string; nameAr?: string; nameEn?: string }) => locale === "ar" ? item.nameAr || item.name || t("details.not_available") : item.nameEn || item.name || t("details.not_available"); setGrades(tree.grades.map((item) => ({ id: item.id, name: name(item) }))); setSections(tree.sections.map((item) => ({ id: item.id, name: name(item), parentId: item.gradeId }))); setClassrooms(tree.classrooms.map((item) => ({ id: item.id, name: name(item), parentId: item.sectionId }))); }).catch(() => { setGrades([]); setSections([]); setClassrooms([]); }); }, [locale, termId, yearId, t]);

  const records = useMemo(() => dtos.map((dto) => mapEnrollment(dto, studentDisplayName(studentMap.get(dto.studentId), locale))), [dtos, locale, studentMap]);
  const visible = useMemo(() => records.filter((item) => !search || [item.studentName, item.academicYear, item.grade, item.section, item.classroom].some((value) => value.toLowerCase().includes(search.toLowerCase()))), [records, search]);
  const thisWeek = records.filter((item) => now - new Date(item.enrollmentDate).getTime() <= 7 * 86400000).length;
  const columns = [
    { key: "studentName", label: t("student_name") }, { key: "status", label: t("details.fields.status"), render: (value: unknown) => t(`status.${String(value)}`) }, { key: "academicYear", label: t("academic_year") }, { key: "grade", label: t("grade") }, { key: "section", label: t("section") }, { key: "classroom", label: t("classroom") }, { key: "enrollmentDate", label: t("enrolled_date"), render: (value: unknown) => new Date(String(value)).toLocaleDateString(locale) },
  ];
  if (!canView) return <AdmissionsAccessDenied />;
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3"><KPICardV2 title={t("total_enrolled")} value={records.length} icon={Users} iconColor="#3b82f6" iconBgColor="#dbeafe" /><KPICardV2 title={t("status.active")} value={records.filter((item) => item.status === "active").length} icon={CheckCircle} iconColor="#10b981" iconBgColor="#d1fae5" /><KPICardV2 title={t("this_week")} value={thisWeek} icon={Calendar} iconColor="#8b5cf6" iconBgColor="#ede9fe" /></div>
    {isReadOnly && <AdmissionsReadOnlyBanner />}
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{t("title")}</h2><p className="text-sm text-gray-500">{t("subtitle")}</p></div>{canManage && <Button type="button" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setPlacementOpen(true); }}>{t("actions.new_enrollment")}</Button>}</div>
    <FilterPanel searchSlot={<div className="max-w-md flex-1"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_placeholder")} leftIcon={<Search className="h-4 w-4" />} /></div>} filtersSlot={<Select value={status} onChange={(value) => setStatus(value as EnrollmentStatusDto | "all")} options={[{ value: "all", label: t("status.all") }, { value: "active", label: t("status.active") }, { value: "completed", label: t("status.completed") }, { value: "withdrawn", label: t("status.withdrawn") }]} />} showFilters onToggleFilters={() => undefined} clearAction={null} hasActiveFilters={Boolean(search || status !== "all")} />
    {loading ? <div className="rounded-xl bg-white p-10"><PartialLoader /></div> : error ? <div className="rounded-xl bg-red-50 p-5 text-red-700">{error}<Button type="button" variant="ghost" size="sm" className="ml-3 text-red-700" onClick={() => void load()}>{t("actions.retry")}</Button></div> : visible.length === 0 ? <div className="rounded-xl bg-white"><EmptyState message={t("no_enrollments")} /></div> : <DataTable columns={columns} data={visible as (EnrollmentRecord & { [key: string]: unknown })[]} onRowClick={setSelected} searchQuery={search} />}
    <EnrollmentDetailsDrawer enrollment={selected} onClose={() => setSelected(null)} canManage={canManage} canManageLifecycle={canManageLifecycle} onEdit={(item) => { setEditing(item); setPlacementOpen(true); }} onLifecycle={(action, item) => { setSelected(item); setWorkflow(action); }} />
    <EnrollmentPlacementDialog open={placementOpen} enrollment={editing} students={students} academicYears={academicYears} grades={grades} sections={sections} classrooms={classrooms} termId={termId} onClose={() => setPlacementOpen(false)} onSuccess={load} />
    <EnrollmentWorkflowDialog action={workflow} enrollment={selected} sections={sections} classrooms={classrooms} academicYears={academicYears} onClose={() => setWorkflow(null)} onSuccess={load} />
  </div>;
}
