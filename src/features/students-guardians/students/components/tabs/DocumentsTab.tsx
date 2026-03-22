// FILE: src/components/students-guardians/profile-tabs/DocumentsTab.tsx

"use client";

import { useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Student } from "@/features/students-guardians/students/types";
import { DataTable } from "@/components/ui/data-table";
import { getStudentDocuments } from "@/features/students-guardians/students/services/studentsService";
import UploadDocumentModal, {
  DocumentUploadData,
} from "@/features/students-guardians/students/components/modals/UploadDocumentModal";
import DocumentViewerModal from "@/features/admissions/applications/components/modals/DocumentViewerModal";
import { useTranslations } from "next-intl";

interface DocumentsTabProps {
  student: Student;
}

export default function DocumentsTab({ student }: DocumentsTabProps) {
  const t = useTranslations("students_guardians.profile.documents");
  const documents = getStudentDocuments(student.id);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);

  const handleUploadDocument = (documentData: DocumentUploadData) => {
    // TODO: Implement API call to upload document
    console.log("Uploading document:", documentData);
    console.log("File:", documentData.file.name, documentData.file.size);

    // Close modal
    setShowUploadModal(false);

    // Show success message (you can add a toast notification here)
    alert(`Document "${documentData.type}" uploaded successfully!`);
  };

  const handleUploadClick = () => {
    // Can be extended to track which document is being uploaded
    setShowUploadModal(true);
  };

  const handleViewDocument = (doc: Record<string, unknown>) => {
    // Generate a mock URL for demonstration
    const mockUrl = `/documents/${doc.id}.pdf`;
    const fileType = (doc.name as string)?.endsWith(".pdf")
      ? "pdf"
      : (doc.name as string)?.match(/\.(jpg|jpeg|png|gif)$/i)
        ? "image"
        : "other";

    setSelectedDocument({
      type: doc.type as string,
      name: doc.name as string,
      url: mockUrl,
      fileType,
    });
  };

  const handleDownloadDocument = (doc: Record<string, unknown>) => {
    // Generate a mock download URL
    const mockUrl = `/documents/${doc.id}.pdf`;
    const link = document.createElement("a");
    link.href = mockUrl;
    link.download = doc.name as string;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      complete: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
        label: t("complete"),
      },
      missing: {
        color: "bg-red-100 text-red-700",
        icon: <AlertCircle className="w-3 h-3" />,
        label: t("missing"),
      },
    };

    const { color, icon, label } = config[status] || config.missing;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const columns = [
    {
      key: "type",
      label: t("document_type"),
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: "name",
      label: t("file_name"),
      render: (value: unknown) => (value as string) || "-",
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => getStatusBadge(value as string),
    },
    {
      key: "uploadedDate",
      label: t("uploaded"),
      render: (value: unknown) => {
        if (!value) return "-";
        return new Date(value as string).toLocaleDateString();
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          {row.status !== "missing" && (
            <>
              <button
                onClick={() => handleViewDocument(row)}
                className="p-1.5 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                title={t("view")}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownloadDocument(row)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title={t("download")}
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === "missing" && (
            <button
              onClick={() => handleUploadClick()}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title={t("upload")}
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title={t("delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const completeCount = documents.filter((d) => d.status === "complete").length;
  const missingCount = documents.filter((d) => d.status === "missing").length;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {missingCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                {t("missing_documents")}
              </h3>
              <p className="text-sm text-red-700">
                {missingCount === 1
                  ? t("missing_message", { count: missingCount })
                  : t("missing_message_plural", { count: missingCount })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t("complete")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {completeCount}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t("missing")}</p>
              <p className="text-3xl font-bold text-gray-900">{missingCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {t("student_documents")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{t("manage_track")}</p>
          </div>
          <button
            onClick={() => handleUploadClick()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("upload_document")}
          </button>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={documents as unknown as Record<string, unknown>[]}
            showPagination={false}
          />
        </div>
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
        }}
        onSubmit={handleUploadDocument}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </div>
  );
}
