"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Download,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable, FilterPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import DocumentViewerModal from "@/features/admissions/applications/components/modals/DocumentViewerModal";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import {
  fetchAllStudentDocumentsForCenter,
  fetchStudentDocumentsCenterStats,
} from "@/features/students-guardians/documents/services/documentsService";
import type { StudentDocumentCenterItem } from "@/features/students-guardians/documents/services/documentsAdapter";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatDocumentsForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function DocumentsCenter() {
  const t = useTranslations("admissions.document_center");
  const locale = useLocale();
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);
  const [allDocuments, setAllDocuments] = useState<StudentDocumentCenterItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    complete: 0,
    missing: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { values, setValue, reset } = useUrlQueryState<{
    search: string;
    status: string;
  }>({
    defaults: {
      search: "",
      status: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const searchQuery = values.search;
  const statusFilter = values.status as "all" | "complete" | "missing";

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [documentsData, statsData] = await Promise.all([
          fetchAllStudentDocumentsForCenter(),
          fetchStudentDocumentsCenterStats(),
        ]);

        if (isCancelled) {
          return;
        }

        setAllDocuments(documentsData);
        setStats(statsData);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setAllDocuments([]);
        setStats({
          total: 0,
          complete: 0,
          missing: 0,
          completionRate: 0,
        });
        setLoadError(error instanceof Error ? error.message : t("no_documents"));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [t]);

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

  if (isLoading) {
    return <MainLoader />;
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-xl p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

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
    reset(undefined, "replace");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data: formatDocumentsForExport(filteredDocuments, exportLocale),
      format,
      filenameBase: "documents",
      emptyMessage: t("no_documents"),
    });
  };

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
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
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
        <FilterPanel
          searchSlot={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setValue("search", e.target.value, "replace")}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary placeholder:text-black/60 focus:border-transparent text-sm min-h-[44px] ${
                    searchQuery
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-gray-200"
                  }`}
                />
              </div>
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
          }
          filtersSlot={
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("document_status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setValue("status", e.target.value as "all" | "complete" | "missing", "push");
                }}
                className="w-full sm:max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
              >
                <option value="all">{t("all_statuses")}</option>
                <option value="complete">{t("complete")}</option>
                <option value="missing">{t("missing")}</option>
              </select>
            </div>
          }
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          clearAction={null}
          hasActiveFilters={hasActiveFilters}
          toggleTitle={t("filters")}
          toggleAriaLabel={t("filters")}
          className="p-0 bg-transparent shadow-none"
        />

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
          urlState={{
            keyPrefix: "documentsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}
      </div>

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("subtitle")}
        datasetCount={filteredDocuments.length}
        emptyStateMessage={t("no_documents")}
      />
    </>
  );
}
