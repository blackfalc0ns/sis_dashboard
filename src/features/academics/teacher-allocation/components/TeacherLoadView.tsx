"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserX,
  TrendingUp,
  Zap,
  Search,
  Filter,
  Download,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import DataTable from "@/components/ui/data-table/DataTable";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  Teacher,
  TeacherAllocation,
  TeacherLoad,
  calculateTeacherLoads,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";

interface TeacherLoadViewProps {
  termId: string;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
}

interface TeacherLoadRow {
  [key: string]: unknown;
  teacherId: string;
  teacherName: string;
  weeklyLoad: number;
  maxLoad: number | undefined;
  sections: number;
  subjectsCount: number;
  status: "normal" | "warning" | "overloaded" | "zero";
  assignments: TeacherLoad["assignments"];
}

export default function TeacherLoadView({
  termId,
  grades,
  sections,
  classrooms,
  subjects,
  subjectAllocations,
  teachers,
  teacherAllocations,
}: TeacherLoadViewProps) {
  const t = useTranslations("academics.teacherAllocation.load");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teacherLoads, setTeacherLoads] = useState<TeacherLoad[]>([]);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const queryState = useMemo(
    () => ({
      searchQuery: searchParams.get("loadSearch") || "",
      statusFilter: (
        ["all", "normal", "warning", "overloaded", "zero"].includes(
          searchParams.get("loadStatus") || ""
        )
          ? searchParams.get("loadStatus")
          : "all"
      ) as "all" | "normal" | "warning" | "overloaded" | "zero",
    }),
    [searchParams]
  );
  const [searchInputValue, setSearchInputValue] = useState(queryState.searchQuery);

  useEffect(() => {
    setSearchInputValue(queryState.searchQuery);
  }, [queryState.searchQuery]);

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        searchQuery: string;
        statusFilter: "all" | "normal" | "warning" | "overloaded" | "zero";
      }>,
      historyMode: "push" | "replace" = "replace"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const mergedState = {
        searchQuery: nextState.searchQuery ?? queryState.searchQuery,
        statusFilter: nextState.statusFilter ?? queryState.statusFilter,
      };

      if (mergedState.searchQuery) {
        params.set("loadSearch", mergedState.searchQuery);
      } else {
        params.delete("loadSearch");
      }

      if (mergedState.statusFilter !== "all") {
        params.set("loadStatus", mergedState.statusFilter);
      } else {
        params.delete("loadStatus");
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [queryState.searchQuery, queryState.statusFilter, router, searchParams]
  );
  const syncSearchQueryParam = useDebouncedCallback((value: string) => {
    syncQueryParams({ searchQuery: value }, "replace");
  }, 250);

  useEffect(() => () => {
    syncSearchQueryParam.cancel();
  }, [syncSearchQueryParam]);

  // Calculate loads
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const structureData = { grades, sections, classrooms, subjects };
        const loads = await calculateTeacherLoads(termId, structureData, subjectAllocations, teacherAllocations);
        setTeacherLoads(loads);
      } catch (error) {
        console.error("Failed to calculate loads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [termId, grades, sections, classrooms, subjects, subjectAllocations, teacherAllocations]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTeachers = teacherLoads.length;
    const teachersWithZeroLoad = teacherLoads.filter((tl) => tl.totalWeeklyPeriods === 0).length;
    const avgLoad =
      totalTeachers > 0
        ? Math.round(
            teacherLoads.reduce((sum, tl) => sum + tl.totalWeeklyPeriods, 0) / totalTeachers
          )
        : 0;
    const maxLoad = teacherLoads.reduce(
      (max, tl) => Math.max(max, tl.totalWeeklyPeriods),
      0
    );

    return {
      totalTeachers,
      teachersWithZeroLoad,
      avgLoad,
      maxLoad,
    };
  }, [teacherLoads]);

  const getTeacherName = useCallback((load: TeacherLoad) => {
    return locale === "ar"
      ? (load.teacherNameAr || load.teacherNameEn || load.teacherName)
      : (load.teacherNameEn || load.teacherNameAr || load.teacherName);
  }, [locale]);

  const getMaxLoadForTeacher = useCallback((teacherId: string): number | undefined => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher?.maxWeeklyLoad;
  }, [teachers]);

  const getTeacherStatus = useCallback((load: TeacherLoad): "normal" | "warning" | "overloaded" | "zero" => {
    if (load.totalWeeklyPeriods === 0) return "zero";
    const maxLoad = getMaxLoadForTeacher(load.teacherId);
    if (!maxLoad) return "normal";
    if (load.totalWeeklyPeriods > maxLoad) return "overloaded";
    if (load.totalWeeklyPeriods > maxLoad * 0.8) return "warning";
    return "normal";
  }, [getMaxLoadForTeacher]);

  // Transform teacher loads to table rows
  const tableData = useMemo<TeacherLoadRow[]>(() => {
    return teacherLoads.map((load) => {
      const uniqueSections = new Set(load.assignments.map((a) => a.sectionId)).size;
      const uniqueSubjects = new Set(load.assignments.map((a) => a.subjectId)).size;
      
      return {
        teacherId: load.teacherId,
        teacherName: getTeacherName(load),
        weeklyLoad: load.totalWeeklyPeriods,
        maxLoad: getMaxLoadForTeacher(load.teacherId),
        sections: uniqueSections,
        subjectsCount: uniqueSubjects,
        status: getTeacherStatus(load),
        assignments: load.assignments,
      };
    });
  }, [teacherLoads, getMaxLoadForTeacher, getTeacherName, getTeacherStatus]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = tableData;

    // Search filter
    if (searchInputValue) {
      filtered = filtered.filter((row) =>
        row.teacherName.toLowerCase().includes(searchInputValue.toLowerCase())
      );
    }

    // Status filter
    if (queryState.statusFilter !== "all") {
      filtered = filtered.filter((row) => row.status === queryState.statusFilter);
    }

    return filtered;
  }, [queryState.statusFilter, searchInputValue, tableData]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: "teacherName",
      label: t("table.teacher"),
      sortable: true,
      searchable: true,
      render: (value: unknown) => (
        <span className="font-medium text-gray-900">{String(value)}</span>
      ),
    },
    {
      key: "weeklyLoad",
      label: t("table.weeklyLoad"),
      sortable: true,
      render: (value: unknown, row: { [key: string]: unknown }) => {
        const typedRow = row as unknown as TeacherLoadRow;
        const load = Number(value);
        const status = typedRow.status;
        
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                status === "overloaded"
                  ? "bg-red-100 text-red-800"
                  : status === "warning"
                  ? "bg-amber-100 text-amber-800"
                  : status === "zero"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-primary-100 text-primary-800"
              }`}
            >
              {load}
            </span>
            {typedRow.maxLoad && (
              <span className="text-xs text-gray-500">/ {typedRow.maxLoad}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "sections",
      label: t("table.sections"),
      sortable: true,
      render: (value: unknown) => (
        <span className="text-gray-600">{String(value)}</span>
      ),
    },
    {
      key: "subjectsCount",
      label: t("table.subjects"),
      sortable: true,
      render: (value: unknown) => (
        <span className="text-gray-600">{String(value)}</span>
      ),
    },
    {
      key: "actions",
      label: t("table.viewBreakdown"),
      sortable: false,
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const typedRow = row as unknown as TeacherLoadRow;
        if (typedRow.assignments.length === 0) return null;
        
        const isExpanded = expandedTeacherId === typedRow.teacherId;
        
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedTeacherId(isExpanded ? null : typedRow.teacherId);
            }}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-700 font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>{t("actions.hide")}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>{t("actions.show")}</span>
              </>
            )}
          </button>
        );
      },
    },
  ], [t, expandedTeacherId]);

  const teacherLoadExportRows = useMemo<Record<string, unknown>[]>(() => {
    return filteredData.flatMap((row) => {
      if (row.assignments.length === 0) {
        return [
          {
            teacherName: row.teacherName,
            weeklyLoad: row.weeklyLoad,
            maxLoad: row.maxLoad || "",
            status:
              row.status === "warning"
                ? t("filters.warning")
                : row.status === "overloaded"
                  ? t("filters.overloaded")
                  : row.status === "zero"
                    ? t("filters.zero")
                    : t("filters.normal"),
            grade: "",
            section: "",
            classroom: "",
            subject: "",
            periods: 0,
          },
        ];
      }

      return row.assignments.map((assignment) => ({
        teacherName: row.teacherName,
        weeklyLoad: row.weeklyLoad,
        maxLoad: row.maxLoad || "",
        status:
          row.status === "warning"
            ? t("filters.warning")
            : row.status === "overloaded"
              ? t("filters.overloaded")
              : row.status === "zero"
                ? t("filters.zero")
                : t("filters.normal"),
        grade:
          locale === "ar"
            ? assignment.gradeNameAr || assignment.gradeNameEn || assignment.gradeName
            : assignment.gradeNameEn || assignment.gradeNameAr || assignment.gradeName,
        section:
          locale === "ar"
            ? assignment.sectionNameAr || assignment.sectionNameEn || assignment.sectionName
            : assignment.sectionNameEn || assignment.sectionNameAr || assignment.sectionName,
        classroom: assignment.classroomId
          ? locale === "ar"
            ? assignment.classroomNameAr ||
              assignment.classroomNameEn ||
              assignment.classroomName
            : assignment.classroomNameEn ||
              assignment.classroomNameAr ||
              assignment.classroomName
          : "",
        subject:
          locale === "ar"
            ? assignment.subjectNameAr || assignment.subjectNameEn || assignment.subjectName
            : assignment.subjectNameEn || assignment.subjectNameAr || assignment.subjectName,
        periods: assignment.weeklyHours,
      }));
    });
  }, [filteredData, locale, t]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      termName: termId,
      exportDate: formatExportDate(locale),
    };
    const exportColumns: ExportColumn[] = [
      { key: "teacherName", label: locale === "ar" ? "المعلم" : "Teacher" },
      {
        key: "weeklyLoad",
        label: locale === "ar" ? "التوزيع الأسبوعي" : "Weekly load",
      },
      { key: "maxLoad", label: locale === "ar" ? "الحد الأقصى" : "Max load" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "grade", label: locale === "ar" ? "الصف" : "Grade" },
      { key: "section", label: locale === "ar" ? "الشعبة" : "Section" },
      { key: "classroom", label: locale === "ar" ? "الفصل" : "Classroom" },
      { key: "subject", label: locale === "ar" ? "المادة" : "Subject" },
      { key: "periods", label: locale === "ar" ? "الحصص" : "Periods" },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename("teacher-loads", termId),
      format,
      columns: exportColumns,
      rows: teacherLoadExportRows,
      locale,
      jsonData: {
        title: "Teacher Loads",
        metadata,
        summary: filteredData,
      },
    });
  };

  if (isLoading) {
    return (
        <PartialLoader />
    );
  }

  if (teacherLoads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-6">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("noTeachers")}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-auto">
      <div className="max-w-[1400px] mx-auto w-full p-4 md:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICardV2
            title={t("kpi.totalTeachers")}
            value={kpis.totalTeachers.toString()}
            icon={Users}
            iconColor="#3b82f6"
            iconBgColor="#eff6ff"
          />
          <KPICardV2
            title={t("kpi.teachersWithZeroLoad")}
            value={kpis.teachersWithZeroLoad.toString()}
            icon={UserX}
            iconColor="#f59e0b"
            iconBgColor="#fffbeb"
          />
          <KPICardV2
            title={t("kpi.avgLoad")}
            value={`${kpis.avgLoad}`}
            icon={TrendingUp}
            iconColor="#10b981"
            iconBgColor="#f0fdf4"
          />
          <KPICardV2
            title={t("kpi.maxLoad")}
            value={`${kpis.maxLoad}`}
            icon={Zap}
            iconColor="#8b5cf6"
            iconBgColor="#faf5ff"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
              leftIcon={<Download className="w-4 h-4" />}
              disabled={teacherLoadExportRows.length === 0}
            >
              {tExport("button")}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("filters.searchPlaceholder")}
                  value={searchInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchInputValue(value);
                    syncSearchQueryParam(value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={queryState.statusFilter}
                  onChange={(e) =>
                    syncQueryParams(
                      {
                        statusFilter: e.target.value as
                          | "all"
                          | "normal"
                          | "warning"
                          | "overloaded"
                          | "zero",
                      },
                      "push"
                    )
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">{t("filters.allStatus")}</option>
                  <option value="normal">{t("filters.normal")}</option>
                  <option value="warning">{t("filters.warning")}</option>
                  <option value="overloaded">{t("filters.overloaded")}</option>
                  <option value="zero">{t("filters.zero")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          searchQuery={searchInputValue}
          itemsPerPage={10}
          showPagination={true}
        />

        {/* Expanded Breakdown */}
        {expandedTeacherId && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {t("breakdown.title")}
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className={`px-3 py-2  ${locale === "ar" ? "text-right" : "text-left"} text-xs font-bold text-gray-700`}>
                      {t("breakdown.grade")}
                    </th>
                    <th className={`px-3 py-2 ${locale === "ar" ? "text-right" : "text-left"} text-xs font-bold text-gray-700`}>
                      {t("breakdown.section")}
                    </th>
                    <th className={`px-3 py-2 ${locale === "ar" ? "text-right" : "text-left"} text-xs font-bold text-gray-700`}>
                      {t("breakdown.classroom")}
                    </th>
                    <th className={`px-3 py-2 ${locale === "ar" ? "text-right" : "text-left"} text-xs font-bold text-gray-700`}>
                      {t("breakdown.subject")}
                    </th>
                    <th className={`px-3 py-2 ${locale === "ar" ? "text-right" : "text-left"} text-xs font-bold text-gray-700`}>
                      {t("breakdown.periods")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData
                    .find((row) => row.teacherId === expandedTeacherId)
                    ?.assignments.map((assignment, idx) => (
                      <tr
                        key={`${expandedTeacherId}-${assignment.sectionId}-${assignment.subjectId}-${idx}`}
                        className={`border-b border-gray-100 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {locale === "ar"
                            ? (assignment.gradeNameAr || assignment.gradeNameEn || assignment.gradeName)
                            : (assignment.gradeNameEn || assignment.gradeNameAr || assignment.gradeName)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {locale === "ar"
                            ? (assignment.sectionNameAr || assignment.sectionNameEn || assignment.sectionName)
                            : (assignment.sectionNameEn || assignment.sectionNameAr || assignment.sectionName)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {assignment.classroomId
                            ? locale === "ar"
                              ? (assignment.classroomNameAr || assignment.classroomNameEn || assignment.classroomName)
                              : (assignment.classroomNameEn || assignment.classroomNameAr || assignment.classroomName)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {locale === "ar"
                            ? (assignment.subjectNameAr || assignment.subjectNameEn || assignment.subjectName)
                            : (assignment.subjectNameEn || assignment.subjectNameAr || assignment.subjectName)}
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-medium text-gray-900">
                          {assignment.weeklyHours}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td
                      colSpan={4}
                      className={`px-3 py-2 text-sm font-semibold text-gray-900 ${locale === "ar" ? "text-right" : "text-left"}`}
                    >
                      {t("breakdown.total")}:
                    </td>
                    <td className="px-3 py-2 text-center text-sm font-bold text-gray-900">
                      {tableData.find((row) => row.teacherId === expandedTeacherId)?.weeklyLoad}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={teacherLoadExportRows.length}
      />
    </div>
  );
}
