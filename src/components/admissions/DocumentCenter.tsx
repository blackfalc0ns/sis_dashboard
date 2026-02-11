// FILE: src/components/admissions/DocumentCenter.tsx

"use client";

import { useState, useMemo } from "react";
import {
  Upload,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DataTable from "../ui/common/DataTable";
import { Application, Document } from "@/types/admissions";

interface DocumentCenterProps {
  applications: Application[];
}

export default function DocumentCenter({ applications }: DocumentCenterProps) {
  const t = useTranslations("admissions.document_center");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "missing"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  // Flatten all documents with application info
  const allDocuments = useMemo(() => {
    return applications.flatMap((app) =>
      app.documents.map((doc) => ({
        ...doc,
        applicationId: app.id,
        studentName: app.studentName,
        grade: app.gradeRequested,
        applicationStatus: app.status,
      })),
    );
  }, [applications]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allDocuments, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = allDocuments.length;
    const complete = allDocuments.filter(
      (doc) => doc.status === "complete",
    ).length;
    const unsubmitted = allDocuments.filter(
      (doc) => doc.status === "missing",
    ).length;
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

    return { total, complete, unsubmitted, completionRate };
  }, [allDocuments]);

  const handleUpload = (doc: Document & { applicationId: string }) => {
    // Simulate file upload
    alert(`Upload document for ${doc.type} - Application ${doc.applicationId}`);
  };

  const handleView = (doc: Document & { applicationId: string }) => {
    if (doc.uploadedDate) {
      alert(`Viewing ${doc.name} for Application ${doc.applicationId}`);
    } else {
      alert("Document not uploaded yet");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // Define columns for DataTable
  const columns = [
    {
      key: "applicationId",
      label: t("application_id"),
      searchable: true,
    },
    {
      key: "studentName",
      label: t("student_name"),
      searchable: true,
    },
    {
      key: "type",
      label: t("document_type"),
      searchable: true,
    },
    {
      key: "status",
      label: t("status"),
      sortable: true,
      render: (value: unknown) => {
        const status = value as "complete" | "missing";
        return status === "complete" ? (
          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3 shrink-0" />
            {t("complete")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {t("missing")}
          </span>
        );
      },
    },
    {
      key: "uploadedDate",
      label: t("uploaded_date"),
      sortable: true,
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "-",
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: Document & { applicationId: string }) => (
        <div className="flex items-center gap-2">
          {row.status === "missing" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload(row);
              }}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-xs font-medium transition-colors min-h-[36px]"
            >
              <Upload className="w-3 h-3 shrink-0" />
              {t("upload")}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleView(row);
              }}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors min-h-[36px]"
            >
              <Eye className="w-3 h-3 shrink-0" />
              {t("view")}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
            {t("title")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">
                {t("total_documents")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">
                {stats.total}
              </p>
            </div>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 shrink-0" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-green-600 font-medium truncate">
                {t("complete")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">
                {stats.complete}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 shrink-0" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-red-600 font-medium truncate">
                {t("unsubmitted")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-red-900 mt-1">
                {stats.unsubmitted}
              </p>
            </div>
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 shrink-0" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">
                {t("completion_rate")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-purple-900 mt-1">
                {stats.completionRate}%
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
              {stats.completionRate}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm min-h-[44px] ${
                searchQuery
                  ? "border-[#036b80] ring-2 ring-[#036b80]/20"
                  : "border-gray-200"
              }`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${
                showFilters
                  ? "bg-[#036b80] text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t("filters")}</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors min-h-[44px]"
              >
                <X className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t("clear")}</span>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t("document_status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "complete" | "missing",
                )
              }
              className="w-full sm:max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent min-h-[44px]"
            >
              <option value="all">{t("all_statuses")}</option>
              <option value="complete">{t("complete")}</option>
              <option value="missing">{t("missing")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_documents")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#036b80] hover:text-[#024d5c] font-medium text-sm"
            >
              {t("clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDocuments}
          searchQuery={searchQuery}
          showPagination={true}
          itemsPerPage={10}
        />
      )}
    </div>
  );
}
