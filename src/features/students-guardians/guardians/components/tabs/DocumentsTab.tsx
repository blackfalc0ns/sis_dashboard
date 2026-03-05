// FILE: src/components/students-guardians/guardian-tabs/DocumentsTab.tsx

"use client";

import { useTranslations } from "next-intl";
import { FileText, Upload } from "lucide-react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";

interface DocumentsTabProps {
  guardian: StudentGuardian;
}

export default function DocumentsTab({}: DocumentsTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");

  // TODO: Implement documents fetching from service
  const documents: never[] = [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t("sections.documents")}
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents available</p>
            <p className="text-sm text-gray-400 mt-2">
              Upload documents related to this guardian
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Document list will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
