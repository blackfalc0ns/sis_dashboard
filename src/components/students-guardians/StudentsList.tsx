// FILE: src/components/students-guardians/StudentsList.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  X,
  Eye,
  Edit,
  MessageSquare,
  Download,
  Plus,
} from "lucide-react";
import DataTable from "@/components/ui/common/DataTable";
import KPICard from "@/components/ui/common/KPICard";
import DateRangeFilter, {
  DateRangeValue,
} from "@/components/admissions/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { mockStudents } from "@/data/mockStudents";
import { Student, StudentStatus, RiskFlag } from "@/types/students";

export default function StudentsList() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [students] = useState<Student[]>(mockStudents);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Filter students
  const filteredStudents = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return students.filter((student) => {
      const matchesSearch =
        searchQuery === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGrade =
        gradeFilter === "all" || student.grade === gradeFilter;
      const matchesSection =
        sectionFilter === "all" || student.section === sectionFilter;
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const matchesDateRange = isDateInRange(student.created_at, filterResult);

      return (
        matchesSearch &&
        matchesGrade &&
        matchesSection &&
        matchesStatus &&
        matchesDateRange
      );
    });
  }, [
    students,
    searchQuery,
    gradeFilter,
    sectionFilter,
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

    const studentsInRange = students.filter((s) =>
      isDateInRange(s.created_at, filterResult),
    );

    const total = studentsInRange.length;
    const active = studentsInRange.filter((s) => s.status === "active").length;
    const withdrawn = studentsInRange.filter(
      (s) => s.status === "withdrawn",
    ).length;
    const atRisk = studentsInRange.filter(
      (s) => s.risk_flags.length > 0,
    ).length;

    return { total, active, withdrawn, atRisk };
  }, [students, dateRange, customStartDate, customEndDate]);

  // Get unique values for filters
  const uniqueGrades = useMemo(() => {
    const grades = new Set(students.map((s) => s.grade));
    return Array.from(grades).sort();
  }, [students]);

  const uniqueSections = useMemo(() => {
    const sections = new Set(students.map((s) => s.section));
    return Array.from(sections).sort();
  }, [students]);

  const hasActiveFilters =
    searchQuery !== "" ||
    gradeFilter !== "all" ||
    sectionFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setGradeFilter("all");
    setSectionFilter("all");
    setStatusFilter("all");
  };

  const handleExport = () => {
    const formattedData = filteredStudents.map((student) => ({
      "Student ID": student.student_id,
      Name: student.name,
      Grade: student.grade,
      Section: student.section,
      Status: student.status,
      "Attendance %": student.attendance_percentage,
      "Current Average": student.current_average,
      "Risk Flags": student.risk_flags.join(", ") || "None",
    }));
    const filename = generateFilename("students", "csv");
    downloadCSV(formattedData, filename);
  };

  const getRiskBadges = (flags: RiskFlag[]) => {
    if (flags.length === 0) return null;

    const badgeColors: Record<RiskFlag, string> = {
      attendance: "bg-red-100 text-red-700",
      grades: "bg-orange-100 text-orange-700",
      behavior: "bg-yellow-100 text-yellow-700",
    };

    return (
      <div className="flex gap-1 flex-wrap">
        {flags.map((flag) => (
          <span
            key={flag}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[flag]}`}
          >
            {flag === "attendance" && "Attendance"}
            {flag === "grades" && "Low Grades"}
            {flag === "behavior" && "Behavior"}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: StudentStatus) => {
    const colors: Record<StudentStatus, string> = {
      active: "bg-green-100 text-green-700",
      withdrawn: "bg-gray-100 text-gray-700",
      suspended: "bg-red-100 text-red-700",
    };

    const labels: Record<StudentStatus, string> = {
      active: "Active",
      withdrawn: "Withdrawn",
      suspended: "Suspended",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const columns = [
    {
      key: "student_id",
      label: "Student ID",
      searchable: true,
    },
    {
      key: "name",
      label: "Name",
      searchable: true,
    },
    {
      key: "grade",
      label: "Grade",
    },
    {
      key: "section",
      label: "Section",
    },
    {
      key: "attendance_percentage",
      label: "Attendance",
      render: (value: unknown) => `${value}%`,
    },
    {
      key: "current_average",
      label: "Average",
      render: (value: unknown) => `${value}%`,
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => getStatusBadge(value as StudentStatus),
    },
    {
      key: "risk_flags",
      label: "Risk Flags",
      sortable: false,
      render: (value: unknown) => getRiskBadges(value as RiskFlag[]),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: unknown, row: Student) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${lang}/students-guardians/students/${row.id}`);
            }}
            className="p-1.5 text-[#036b80] hover:bg-[#036b80] hover:text-white rounded transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle add note
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Add Note"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleRowClick = (student: Student) => {
    router.push(`/${lang}/students-guardians/students/${student.id}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={
            dateRange === "all"
              ? "Total Students"
              : `Students (${dateRange === "custom" ? "Custom" : dateRange + " days"})`
          }
          value={kpis.total}
          icon={Users}
          numbers={`${kpis.active} active`}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title="Active Students"
          value={kpis.active}
          icon={UserCheck}
          numbers="Currently enrolled"
          iconBgColor="bg-green-500"
        />
        <KPICard
          title="Withdrawn"
          value={kpis.withdrawn}
          icon={UserX}
          numbers="This period"
          iconBgColor="bg-gray-500"
        />
        <KPICard
          title="At-Risk Students"
          value={kpis.atRisk}
          icon={AlertTriangle}
          numbers="Need attention"
          iconBgColor="bg-red-500"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Students</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track student information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              // Handle add student
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                searchQuery
                  ? "border-[#036b80] ring-2 ring-[#036b80]/20"
                  : "border-gray-200"
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              showFilters
                ? "bg-[#036b80] text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">All Grades</option>
                {uniqueGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">All Sections</option>
                {uniqueSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StudentStatus | "all")
                }
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters
              ? "No students match your filters"
              : "No students found"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#036b80] hover:text-[#024d5c] font-medium text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
