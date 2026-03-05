"use client";

import { useTranslations } from "next-intl";
import { FileText, Eye, Download } from "lucide-react";
import { Application } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import { Button } from "@/components/ui/button";
import DocumentViewerModal from "../modals/DocumentViewerModal";
import { useState } from "react";

interface DocumentsTabProps {
  application: Application;
}

export default function DocumentsTab({ application }: DocumentsTabProps) {
  const t = useTranslations("admissions.application360");
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);

  const handleViewDocument = (doc: {
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  }) => {
    setSelectedDocument(doc);
  };

  const handleCloseModal = () => {
    setSelectedDocument(null);
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">{t("documents.title")}</h3>
        <div className="space-y-2">
          {application.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.type}
                  </p>
                  {doc.name && (
                    <p className="text-xs text-gray-500">{doc.name}</p>
                  )}
                  {doc.uploadedDate && (
                    <p className="text-xs text-gray-400">
                      Uploaded:{" "}
                      {new Date(doc.uploadedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={doc.status === "complete" ? "completed" : "scheduled"}
                />
                {doc.status === "complete" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(doc)}
                      title="View document"
                    >
                      <Eye className="w-4 h-4" />{" "}
                    </Button>
                    {doc.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(doc.url, "_blank")}
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={handleCloseModal}
        document={selectedDocument}
      />
    </>
  );
}
