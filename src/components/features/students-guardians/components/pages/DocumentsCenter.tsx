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
  Download,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import DocumentViewerModal from "@/components/features/admissions/components/modals/DocumentViewerModal";
import { mockStudentDocuments } from "@/data/mockDataLinked";
import { mockStudents } from "@/data/mockStudents";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";

export default function DocumentsCenter() {
  const t = useTranslations("admissions.document_center");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "missing"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);

  // Combine student documents with student info
  const allDocuments = useMemo(() => {
    return mockStudentDocuments.map((doc) => {
      const student = mockStudents.find((s) => s.id === doc.studentId);
      return {
        ...doc,
        studentName: student?.name || "Unknown",
        grade: student?.grade || "-",
      };
    });
  }, []);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    const missing = allDocuments.filter(
      (doc) => doc.status === "missing",
    ).length;
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

    return { total, complete, missing, completionRate };
  }, [allDocuments]);

  const handleUpload = (doc: { studentId: string; type: string }) => {
    alert(`Upload document for ${doc.type} - Student ${doc.studentId}`);
  };

  const handleView = (doc: {
    name: string;
    type: string;
    uploadedDate?: string;
  }) => {
    if (doc.uploadedDate) {
      // For demo, use sample PDF URL
      setSelectedDocument({
        type: doc.type,
        name: doc.name,
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileType: "pdf",
      });
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
      key: "studentId",
      label: "Student ID",
      searchable: true,
    },
    {
      key: "studentName",
      label: "Student Name",
      searchable: true,
    },
    {
      key: "grade",
      label: "Grade",
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
      render: (
        _: unknown,
        row: {
          studentId: string;
          type: string;
          name: string;
          status: string;
          uploadedDate?: string;
        },
      ) => (
        <div className="flex items-center gap-2">
          {row.status === "missing" ? (
            <Button
              size="sm"
              leftIcon={<Upload className="w-3 h-3" />}
              onClick={(e) => {
                e.stopPropagation();
                handleUpload(row);
              }}
            >
              {t("upload")}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Eye className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(row);
                }}
              >
                {t("view")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Download className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    "_blank",
                  );
                }}
              >
                Download
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
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
          <KPICardV2
            title={t("total_documents")}
            value={stats.total}
            icon={FileText}
            iconColor="#3b82f6"
            iconBgColor="#dbeafe"
            showChart={false}
          />

          <KPICardV2
            title={t("complete")}
            value={stats.complete}
            icon={CheckCircle}
            iconColor="#10b981"
            iconBgColor="#d1fae5"
            showChart={false}
          />

          <KPICardV2
            title={t("unsubmitted")}
            value={stats.missing}
            icon={AlertCircle}
            iconColor="#ef4444"
            iconBgColor="#fee2e2"
            showChart={false}
          />

          <KPICardV2
            title={t("completion_rate")}
            value={`${stats.completionRate}%`}
            icon={CheckCircle}
            iconColor="#8b5cf6"
            iconBgColor="#ede9fe"
            showChart={false}
          />
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
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary placeholder:text-black/60 focus:border-transparent text-sm min-h-[44px] ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200"
                }`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${
                  showFilters
                    ? "bg-primary text-white"
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
                className="w-full sm:max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
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
                className="mt-4 text-primary hover:text-hover font-medium text-sm"
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

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </>
  );
}
