// FILE: src/components/students-guardians/StudentsList.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  X,
  Eye,
  Edit,
  MessageSquare,
  Download,
  Plus,
  Upload,
  Lock,
} from "lucide-react";
import { DataTable, FilterPanel } from "@/components/ui";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import DateRangeFilter, {
  DateRangeValue,
} from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import {
  Student,
  StudentStatus,
} from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import {
  getStudentDisplayName,
  getStudentDisplayId,
  getStatusColor,
  getRiskFlagColor,
  getStudentClassroom,
} from "@/features/students-guardians/students/utils/studentUtils";
import AddNoteModal, {
  NoteFormData,
} from "@/features/students-guardians/students/components/modals/AddNoteModal";
import BulkUploadModal from "@/features/students-guardians/students/components/modals/BulkUploadModal";
import ChangePasswordModal from "@/features/students-guardians/students/components/modals/ChangePasswordModal";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatStudentsForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function StudentsList() {
  const t = useTranslations("students_guardians.students");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const {
    yearId,
    termId,
    isLoading: isContextLoading,
    error: contextError,
  } = useStudentsGuardiansYearTermContext();

  const [studentsWithEnrollment, setStudentsWithEnrollment] = useState<
    studentsService.StudentWithEnrollmentContext[]
  >([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (isContextLoading) {
      return () => {
        isCancelled = true;
      };
    }

    if (!yearId || !termId) {
      setStudentsWithEnrollment([]);
      setPageError(null);
      setIsPageLoading(false);

      return () => {
        isCancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsPageLoading(true);
      setPageError(null);

      try {
        const data =
          await studentsService.fetchStudentsWithEnrollmentForContext(
            yearId,
            termId,
          );
        if (isCancelled) {
          return;
        }
        setStudentsWithEnrollment(data);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        setStudentsWithEnrollment([]);
        setPageError(
          error instanceof Error ? error.message : t("loading_error"),
        );
      } finally {
        if (!isCancelled) {
          setIsPageLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isContextLoading, termId, t, yearId]);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [passwordChangeStudent, setPasswordChangeStudent] =
    useState<Student | null>(null);
  const {
    values: queryValues,
    setValue,
    setValues,
    replaceValues,
    reset,
  } = useUrlQueryState<{
    search: string;
    grade: string;
    section: string;
    classroom: string;
    status: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      grade: "all",
      section: "all",
      classroom: "all",
      status: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const searchQuery = queryValues.search;
  const gradeFilter = queryValues.grade;
  const sectionFilter = queryValues.section;
  const classroomFilter = queryValues.classroom;
  const statusFilter = queryValues.status as StudentStatus | "all";
  const dateRange = queryValues.dateRange as DateRangeValue;
  const customStartDate = queryValues.startDate;
  const customEndDate = queryValues.endDate;

  // Filter students
  const filteredStudents = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return studentsWithEnrollment.filter((student) => {
      // Search in both English and Arabic names
      const studentWithNames = student as Student & {
        full_name_en?: string;
        studentName?: string;
        full_name_ar?: string;
        studentNameArabic?: string;
      };
      const englishName =
        studentWithNames.full_name_en || studentWithNames.studentName || "";
      const arabicName =
        studentWithNames.full_name_ar ||
        studentWithNames.studentNameArabic ||
        "";
      const studentId = getStudentDisplayId(student);

      const matchesSearch =
        searchQuery === "" ||
        englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arabicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        studentId.toLowerCase().includes(searchQuery.toLowerCase());

      // Use enrollment data for grade and section
      const studentGrade = student.enrollment?.grade || student.gradeRequested;
      const studentSection = student.enrollment?.section || "";
      const studentClassroom = student.enrollment?.classroom || "";
      const matchesGrade =
        gradeFilter === "all" || studentGrade === gradeFilter;

      const matchesSection =
        sectionFilter === "all" || studentSection === sectionFilter;
      const matchesClassroom =
        classroomFilter === "all" || studentClassroom === classroomFilter;

      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;

      const matchesDateRange = isDateInRange(
        student.created_at ?? student.submittedDate,
        filterResult,
      );

      return (
        matchesSearch &&
        matchesGrade &&
        matchesSection &&
        matchesClassroom &&
        matchesStatus &&
        matchesDateRange
      );
    });
  }, [
    studentsWithEnrollment,
    searchQuery,
    gradeFilter,
    sectionFilter,
    classroomFilter,
    statusFilter,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    const studentsInRange = studentsWithEnrollment.filter((s) =>
      isDateInRange(s.created_at ?? s.submittedDate, filterResult),
    );

    const total = studentsInRange.length;
    const active = studentsInRange.filter((s) => s.status === "Active").length;
    const suspended = studentsInRange.filter(
      (s) => s.status === "Suspended",
    ).length;
    const withdrawn = studentsInRange.filter(
      (s) => s.status === "Withdrawn",
    ).length;

    const atRisk = studentsInRange.filter((student) => {
      const performance = student.contextPerformance || student.ytdPerformance;
      return Boolean(performance && performance.riskFlags.length > 0);
    }).length;

    return { total, active, suspended, withdrawn, atRisk };
  }, [studentsWithEnrollment, dateRange, customStartDate, customEndDate]);

  // Get unique values for filters from enrollment data
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    studentsWithEnrollment.forEach((s) => {
      const grade = s.enrollment?.grade || s.gradeRequested;
      grades.add(grade);
    });
    return Array.from(grades).sort();
  }, [studentsWithEnrollment]);

  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    studentsWithEnrollment.forEach((s) => {
      const matchesGrade =
        gradeFilter === "all" ||
        (s.enrollment?.grade || s.gradeRequested) === gradeFilter;

      if (matchesGrade && s.enrollment?.section) {
        sections.add(s.enrollment.section);
      }
    });
    return Array.from(sections).sort();
  }, [gradeFilter, studentsWithEnrollment]);

  const uniqueClassrooms = useMemo(() => {
    const classrooms = new Set<string>();
    studentsWithEnrollment.forEach((s) => {
      const studentGrade = s.enrollment?.grade || s.gradeRequested;
      const studentSection = s.enrollment?.section || "";

      const matchesGrade =
        gradeFilter === "all" || studentGrade === gradeFilter;
      const matchesSection =
        sectionFilter === "all" || studentSection === sectionFilter;

      if (matchesGrade && matchesSection && s.enrollment?.classroom) {
        classrooms.add(s.enrollment.classroom);
      }
    });
    return Array.from(classrooms).sort();
  }, [gradeFilter, sectionFilter, studentsWithEnrollment]);

  useEffect(() => {
    if (gradeFilter !== "all" && !uniqueGrades.includes(gradeFilter)) {
      replaceValues({
        grade: null,
        section: null,
        classroom: null,
      });
    }
  }, [gradeFilter, replaceValues, uniqueGrades]);

  useEffect(() => {
    if (sectionFilter !== "all" && !uniqueSections.includes(sectionFilter)) {
      replaceValues({
        section: null,
        classroom: null,
      });
    }
  }, [replaceValues, sectionFilter, uniqueSections]);

  useEffect(() => {
    if (
      classroomFilter !== "all" &&
      !uniqueClassrooms.includes(classroomFilter)
    ) {
      replaceValues({ classroom: null });
    }
  }, [classroomFilter, replaceValues, uniqueClassrooms]);

  const hasActiveFilters =
    searchQuery !== "" ||
    gradeFilter !== "all" ||
    sectionFilter !== "all" ||
    classroomFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleAddNote = (noteData: NoteFormData) => {
    // TODO: Implement API call to add note
    console.log("Adding note for student:", selectedStudent?.id, noteData);

    // Close modal
    setShowAddNoteModal(false);
    setSelectedStudent(null);

    // Show success message (you can add a toast notification here)
    alert("Note added successfully!");
  };

  const handleAddNoteClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setShowAddNoteModal(true);
  };

  const handleChangePasswordClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setPasswordChangeStudent(student);
    setShowChangePasswordModal(true);
  };

  const handlePasswordChange = (data: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    // TODO: Implement API call to change password
    console.log("Changing password for student:", passwordChangeStudent?.id);
    console.log("New password:", data.newPassword);

    // Show success message
    alert(t("change_password.success"));
  };

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );
    const formattedData = formatStudentsForExport(
      filteredStudents as unknown as Student[],
      exportLocale,
    );

    downloadStudentsGuardiansExport({
      data: formattedData,
      format,
      filenameBase: "students",
      emptyMessage: t("no_students"),
    });
  };

  const handleBulkUpload = async (file: File) => {
    // TODO: Implement bulk upload logic
    // This would typically:
    // 1. Parse the CSV/Excel file
    // 2. Validate the data
    // 3. Send to API
    // 4. Show success/error messages

    console.log("Uploading file:", file.name);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For now, just show success
    alert(t("bulk_upload_success"));
  };

  const getRiskBadges = (
    performance:
      | ReturnType<typeof studentsService.getStudentYTDPerformance>
      | studentsService.StudentWithEnrollmentContext["contextPerformance"]
      | undefined,
  ) => {
    if (!performance || performance.riskFlags.length === 0) return null;

    const getRiskLabel = (flag: string) => {
      switch (flag) {
        case "attendance":
          return t("risk_flags.low_attendance");
        case "grades":
          return t("risk_flags.low_grades");
        case "behavior":
          return t("risk_flags.behavior_issues");
        default:
          return flag;
      }
    };

    return (
      <div className="flex gap-1 flex-wrap">
        {performance.riskFlags.map((flag) => (
          <span
            key={flag}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRiskFlagColor(flag)}`}
          >
            {getRiskLabel(flag)}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: StudentStatus) => {
    const statusKey = status.toLowerCase() as
      | "active"
      | "withdrawn"
      | "suspended";
    const statusDisplay = t(`status.${statusKey}`);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
      >
        {statusDisplay}
      </span>
    );
  };

  const columns = [
    {
      key: "student_id",
      label: t("columns.student_id"),
      searchable: true,
      render: (_: unknown, row: { [key: string]: unknown }) =>
        getStudentDisplayId(row as unknown as Student),
    },
    {
      key: "name",
      label: t("columns.name"),
      searchable: true,
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as Student & {
          full_name_en?: string;
          studentName?: string;
          full_name_ar?: string;
          studentNameArabic?: string;
        };
        return locale === "ar"
          ? student.full_name_ar ||
              student.studentNameArabic ||
              student.full_name_en ||
              student.studentName ||
              getStudentDisplayName(student as Student)
          : student.full_name_en ||
              student.studentName ||
              student.full_name_ar ||
              getStudentDisplayName(student as Student);
      },
    },
    {
      key: "grade",
      label: t("columns.grade"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as (typeof studentsWithEnrollment)[0];
        const grade = student.enrollment?.grade || student.gradeRequested;
        // Translate grade if it's in "Grade X" format
        if (grade && grade.startsWith("Grade ")) {
          const gradeNumber = grade.replace("Grade ", "");
          return locale === "ar" ? `الصف ${gradeNumber}` : grade;
        }
        return grade;
      },
    },
    {
      key: "section",
      label: t("columns.section"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as (typeof studentsWithEnrollment)[0];
        return student.enrollment?.section || t("columns.na");
      },
    },
    {
      key: "classroom",
      label: t("columns.classroom"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as (typeof studentsWithEnrollment)[0];
        return getStudentClassroom(student);
      },
    },
    {
      key: "attendance_percentage",
      label: t("columns.attendance"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as (typeof studentsWithEnrollment)[0];
        return student.contextPerformance || student.ytdPerformance
          ? `${(student.contextPerformance || student.ytdPerformance)?.attendance}%`
          : t("columns.na");
      },
    },
    {
      key: "current_average",
      label: t("columns.average"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as (typeof studentsWithEnrollment)[0];
        return student.contextPerformance || student.ytdPerformance
          ? `${(student.contextPerformance || student.ytdPerformance)?.gradeAverage}%`
          : t("columns.na");
      },
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (value: unknown) =>
        getStatusBadge(value as "Active" | "Withdrawn" | "Suspended"),
    },
    {
      key: "risk_flags",
      label: t("columns.risk_flags"),
      sortable: false,
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as (typeof studentsWithEnrollment)[0];
        return getRiskBadges(
          student.contextPerformance || student.ytdPerformance,
        );
      },
    },
    {
      key: "actions",
      label: t("columns.actions"),
      sortable: false,
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/${lang}/students-guardians/students/${(row as unknown as Student).id}`,
              );
            }}
            className="p-1.5 text-primary hover:bg-primary hover:text-white rounded transition-colors"
            title={t("actions.view_profile")}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title={t("actions.edit")}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) =>
              handleChangePasswordClick(e, row as unknown as Student)
            }
            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title={t("actions.change_password")}
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleAddNoteClick(e, row as unknown as Student)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title={t("actions.add_note")}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleRowClick = (student: { [key: string]: unknown }) => {
    router.push(
      `/${lang}/students-guardians/students/${(student as unknown as Student).id}`,
    );
  };

  if (isContextLoading || isPageLoading) {
    return <MainLoader />;
  }

  if (contextError || pageError || !yearId || !termId) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-sm text-red-600">
            {contextError || pageError || t("loading_error")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={(nextRange) => {
          const shouldResetCustom = nextRange !== "custom";
          setValues(
            {
              dateRange: nextRange,
              startDate: shouldResetCustom ? null : customStartDate || null,
              endDate: shouldResetCustom ? null : customEndDate || null,
            },
            "push",
          );
        }}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setValues(
            {
              dateRange: "custom",
              startDate: start || null,
              endDate: end || null,
            },
            "replace",
          );
        }}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={
            dateRange === "all"
              ? t("kpis.total_students")
              : t("kpis.students_period", {
                  period:
                    dateRange === "custom"
                      ? t("kpis.custom")
                      : `${dateRange} ${t("kpis.days")}`,
                })
          }
          value={kpis.total}
          subtitle={t("kpis.active_count", { count: kpis.active })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "M1", value: kpis.total - 15 },
            { label: "M2", value: kpis.total - 10 },
            { label: "M3", value: kpis.total - 5 },
            { label: "M4", value: kpis.total },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("kpis.active_students")}
          value={kpis.active}
          subtitle={t("kpis.currently_enrolled")}
          icon={UserCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "M1", value: kpis.active - 12 },
            { label: "M2", value: kpis.active - 8 },
            { label: "M3", value: kpis.active - 4 },
            { label: "M4", value: kpis.active },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("kpis.withdrawn")}
          value={kpis.withdrawn}
          subtitle={t("kpis.this_period")}
          icon={UserX}
          iconColor="#6b7280"
          iconBgColor="#f3f4f6"
          chartData={[
            { label: "M1", value: Math.max(0, kpis.withdrawn - 3) },
            { label: "M2", value: Math.max(0, kpis.withdrawn - 2) },
            { label: "M3", value: Math.max(0, kpis.withdrawn - 1) },
            { label: "M4", value: kpis.withdrawn },
          ]}
          chartColor="#6b7280"
        />
        <KPICardV2
          title={t("kpis.at_risk_students")}
          value={kpis.atRisk}
          subtitle={t("kpis.need_attention")}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "M1", value: Math.max(0, kpis.atRisk - 2) },
            { label: "M2", value: Math.max(0, kpis.atRisk - 1) },
            { label: "M3", value: kpis.atRisk },
            { label: "M4", value: kpis.atRisk },
          ]}
          chartColor="#ef4444"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("bulk_upload_button")}
          </button>
          <button
            onClick={() => {
              // Handle add student
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("add_student")}
          </button>
        </div>
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
        clearAction={null}
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => {
                  setValue("search", e.target.value, "replace");
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border placeholder:text-black/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200"
                }`}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                {t("clear")}
              </button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filter_labels.grade")}
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  const nextGrade = e.target.value;
                  setValues(
                    {
                      grade: nextGrade,
                      section: null,
                      classroom: null,
                    },
                    "push",
                  );
                }}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filter_options.all_grades")}</option>
                {uniqueGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filter_labels.section")}
              </label>
              <select
                value={sectionFilter}
                onChange={(e) => {
                  const nextSection = e.target.value;
                  setValues(
                    {
                      section: nextSection,
                      classroom: null,
                    },
                    "push",
                  );
                }}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filter_options.all_sections")}</option>
                {uniqueSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filter_labels.classroom")}
              </label>
              <select
                value={classroomFilter}
                onChange={(e) => {
                  setValue("classroom", e.target.value, "push");
                }}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">
                  {t("filter_options.all_classrooms")}
                </option>
                {uniqueClassrooms.map((classroom) => (
                  <option key={classroom} value={classroom}>
                    {classroom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filter_labels.status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setValue(
                    "status",
                    e.target.value as StudentStatus | "all",
                    "push",
                  );
                }}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filter_options.all_statuses")}</option>
                <option value="Active">{t("status.active")}</option>
                <option value="Withdrawn">{t("status.withdrawn")}</option>
                <option value="Suspended">{t("status.suspended")}</option>
              </select>
            </div>
          </div>
        }
      />

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_students")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:text-hover font-medium text-sm"
            >
              {t("clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={
            filteredStudents as unknown as Array<{ [key: string]: unknown }>
          }
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          virtualize={true}
          urlState={{
            keyPrefix: "studentsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Add Note Modal */}
      {selectedStudent && (
        <AddNoteModal
          isOpen={showAddNoteModal}
          onClose={() => {
            setShowAddNoteModal(false);
            setSelectedStudent(null);
          }}
          onSubmit={handleAddNote}
          studentName={(() => {
            const studentWithNames = selectedStudent as unknown as Student & {
              full_name_en?: string;
              studentName?: string;
              full_name_ar?: string;
              studentNameArabic?: string;
            };
            return locale === "ar"
              ? studentWithNames.full_name_ar ||
                  studentWithNames.studentNameArabic ||
                  studentWithNames.full_name_en ||
                  studentWithNames.studentName ||
                  getStudentDisplayName(selectedStudent)
              : studentWithNames.full_name_en ||
                  studentWithNames.studentName ||
                  studentWithNames.full_name_ar ||
                  getStudentDisplayName(selectedStudent);
          })()}
        />
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onUpload={handleBulkUpload}
      />

      {/* Change Password Modal */}
      {passwordChangeStudent && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => {
            setShowChangePasswordModal(false);
            setPasswordChangeStudent(null);
          }}
          onSubmit={handlePasswordChange}
          userName={(() => {
            const studentWithNames = passwordChangeStudent as Student & {
              full_name_en?: string;
              studentName?: string;
              full_name_ar?: string;
              studentNameArabic?: string;
            };
            return locale === "ar"
              ? studentWithNames.full_name_ar ||
                  studentWithNames.studentNameArabic ||
                  studentWithNames.full_name_en ||
                  studentWithNames.studentName ||
                  getStudentDisplayName(passwordChangeStudent)
              : studentWithNames.full_name_en ||
                  studentWithNames.studentName ||
                  studentWithNames.full_name_ar ||
                  getStudentDisplayName(passwordChangeStudent);
          })()}
          userType="student"
        />
      )}

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("subtitle")}
        datasetCount={filteredStudents.length}
        emptyStateMessage={t("no_students")}
      />
    </div>
  );
}
