// FILE: src/components/students-guardians/tables/TransfersWithdrawalsTable.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, FileText } from "lucide-react";
import DataTable from "@/components/ui/common/DataTable";

// TODO: Replace with actual API data
const mockRequests = [
  {
    id: "1",
    studentName: "Ahmed Hassan",
    studentNameAr: "أحمد حسن",
    stage: "Primary",
    grade: "Grade 5",
    behaviorAvg: 85,
    attendancePercent: 92,
    reason: "Relocation",
    status: "Pending",
    requestDate: "2024-02-15",
    type: "Withdrawal",
  },
  {
    id: "2",
    studentName: "Sara Mohamed",
    studentNameAr: "سارة محمد",
    stage: "Secondary",
    grade: "Grade 11",
    behaviorAvg: 45,
    attendancePercent: 78,
    reason: "Behavior",
    status: "Approved",
    requestDate: "2024-02-14",
    type: "Withdrawal",
  },
  {
    id: "3",
    studentName: "Omar Ali",
    studentNameAr: "عمر علي",
    stage: "Preparatory",
    grade: "Grade 8",
    behaviorAvg: 90,
    attendancePercent: 95,
    reason: "Transfer In",
    status: "Approved",
    requestDate: "2024-02-13",
    type: "Transfer",
  },
  {
    id: "4",
    studentName: "Fatima Ibrahim",
    studentNameAr: "فاطمة إبراهيم",
    stage: "Primary",
    grade: "Grade 3",
    behaviorAvg: 88,
    attendancePercent: 90,
    reason: "Financial",
    status: "Rejected",
    requestDate: "2024-02-12",
    type: "Withdrawal",
  },
  {
    id: "5",
    studentName: "Youssef Khaled",
    studentNameAr: "يوسف خالد",
    stage: "Secondary",
    grade: "Grade 12",
    behaviorAvg: 35,
    attendancePercent: 65,
    reason: "Academic",
    status: "Pending",
    requestDate: "2024-02-11",
    type: "Withdrawal",
  },
];

export default function TransfersWithdrawalsTable() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = useMemo(() => {
    if (!searchQuery) return mockRequests;

    return mockRequests.filter((request) =>
      request.studentName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = status.toLowerCase() as
      | "pending"
      | "approved"
      | "rejected";
    return t(`table.status.${statusKey}`);
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      Relocation: "relocation",
      Financial: "financial",
      Academic: "academic",
      Behavior: "behavior",
      "Transfer In": "transfer_in",
      Other: "other",
    };
    const reasonKey = reasonMap[reason] || "other";
    return t(`table.reasons.${reasonKey}`);
  };

  const getBehaviorColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      Primary: "primary",
      Preparatory: "preparatory",
      Secondary: "secondary",
    };
    const stageKey = stageMap[stage] || "primary";
    return t(`table.stages.${stageKey}`);
  };

  const getGradeLabel = (grade: string) => {
    // Extract grade number from "Grade X" format
    const gradeNumber = grade.replace("Grade ", "");
    return locale === "ar" ? `الصف ${gradeNumber}` : grade;
  };

  const getStudentName = (row: { [key: string]: unknown }) => {
    if (locale === "ar" && row.studentNameAr) {
      return row.studentNameAr as string;
    }
    return row.studentName as string;
  };

  const columns = [
    {
      key: "studentName",
      label: t("table.columns.student_name"),
      searchable: true,
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <span className="font-medium">{getStudentName(row)}</span>
      ),
    },
    {
      key: "stage",
      label: t("table.columns.stage"),
      render: (value: unknown) => getStageLabel(value as string),
    },
    {
      key: "grade",
      label: t("table.columns.grade"),
      render: (value: unknown) => getGradeLabel(value as string),
    },
    {
      key: "behaviorAvg",
      label: t("table.columns.behavior_avg"),
      render: (value: unknown) => (
        <span className={getBehaviorColor(value as number)}>
          {value as number}
        </span>
      ),
    },
    {
      key: "attendancePercent",
      label: t("table.columns.attendance"),
      render: (value: unknown) => `${value}%`,
    },
    {
      key: "reason",
      label: t("table.columns.reason"),
      render: (value: unknown) => getReasonLabel(value as string),
    },
    {
      key: "status",
      label: t("table.columns.status"),
      render: (value: unknown) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(value as string)}`}
        >
          {getStatusLabel(value as string)}
        </span>
      ),
    },
    {
      key: "requestDate",
      label: t("table.columns.request_date"),
      sortable: true,
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#036b80]" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("table.title")}
          </h2>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t("table.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 placeholder:text-black/60 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t("table.no_requests")}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRequests as unknown as Record<string, unknown>[]}
          showPagination={true}
          itemsPerPage={10}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
