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
  Clock,
} from "lucide-react";
import { Student } from "@/types/students";
import DataTable from "@/components/ui/common/DataTable";

interface DocumentsTabProps {
  student: Student;
}

// Mock documents data
const mockDocuments = [
  {
    id: "1",
    type: "Birth Certificate",
    file_name: "birth_certificate.pdf",
    status: "complete",
    expiry_date: null,
    uploaded_at: "2024-01-15T10:00:00Z",
    size: "2.3 MB",
  },
  {
    id: "2",
    type: "Vaccination Record",
    file_name: "vaccination_record.pdf",
    status: "complete",
    expiry_date: "2025-06-30",
    uploaded_at: "2024-01-20T14:30:00Z",
    size: "1.8 MB",
  },
  {
    id: "3",
    type: "Previous School Report",
    file_name: "school_report_2023.pdf",
    status: "complete",
    expiry_date: null,
    uploaded_at: "2024-01-18T09:15:00Z",
    size: "3.1 MB",
  },
  {
    id: "4",
    type: "Medical Certificate",
    file_name: "",
    status: "missing",
    expiry_date: null,
    uploaded_at: null,
    size: null,
  },
  {
    id: "5",
    type: "ID Copy",
    file_name: "student_id.pdf",
    status: "expired",
    expiry_date: "2024-01-01",
    uploaded_at: "2023-06-10T11:00:00Z",
    size: "1.2 MB",
  },
];

export default function DocumentsTab({ student }: DocumentsTabProps) {
  const [documents] = useState(mockDocuments);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      complete: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Complete",
      },
      missing: {
        color: "bg-red-100 text-red-700",
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Missing",
      },
      expired: {
        color: "bg-orange-100 text-orange-700",
        icon: <Clock className="w-3 h-3" />,
        label: "Expired",
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

  const getExpiryWarning = (expiryDate: string | null) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) {
      return (
        <span className="text-xs text-red-600 font-medium">
          Expired {Math.abs(daysUntilExpiry)} days ago
        </span>
      );
    } else if (daysUntilExpiry <= 30) {
      return (
        <span className="text-xs text-orange-600 font-medium">
          Expires in {daysUntilExpiry} days
        </span>
      );
    }

    return null;
  };

  const columns = [
    {
      key: "type",
      label: "Document Type",
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: "file_name",
      label: "File Name",
      render: (value: unknown) => (value as string) || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => getStatusBadge(value as string),
    },
    {
      key: "expiry_date",
      label: "Expiry",
      render: (value: unknown, row: any) => {
        if (!value) return "-";
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {new Date(value as string).toLocaleDateString()}
            </div>
            {getExpiryWarning(value as string)}
          </div>
        );
      },
    },
    {
      key: "size",
      label: "Size",
      render: (value: unknown) => (value as string) || "-",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-1">
          {row.status !== "missing" && (
            <>
              <button
                className="p-1.5 text-[#036b80] hover:bg-[#036b80] hover:text-white rounded transition-colors"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === "missing" && (
            <button
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Upload"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const completeCount = documents.filter((d) => d.status === "complete").length;
  const missingCount = documents.filter((d) => d.status === "missing").length;
  const expiredCount = documents.filter((d) => d.status === "expired").length;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(missingCount > 0 || expiredCount > 0) && (
        <div className="space-y-3">
          {missingCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Missing Documents
                  </h3>
                  <p className="text-sm text-red-700">
                    {missingCount} required document
                    {missingCount > 1 ? "s are" : " is"} missing. Please upload
                    as soon as possible.
                  </p>
                </div>
              </div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Expired Documents
                  </h3>
                  <p className="text-sm text-orange-700">
                    {expiredCount} document
                    {expiredCount > 1 ? "s have" : " has"} expired. Please
                    update.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Complete</p>
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
              <p className="text-sm text-gray-600 mb-1">Missing</p>
              <p className="text-3xl font-bold text-gray-900">{missingCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expired</p>
              <p className="text-3xl font-bold text-gray-900">{expiredCount}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Student Documents
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track required documents
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={documents}
            showPagination={false}
          />
        </div>
      </div>
    </div>
  );
}
