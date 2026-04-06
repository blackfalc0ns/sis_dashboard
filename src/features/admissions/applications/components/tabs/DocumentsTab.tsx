"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Application } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import DocumentViewerModal from "../modals/DocumentViewerModal";

interface DocumentsTabProps {
  application: Application;
}

export default function DocumentsTab({ application }: DocumentsTabProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);

  const resolveLabel = (doc: Application["documents"][number]) => {
    if (locale === "ar") return doc.labelAr || doc.type;
    return doc.labelEn || doc.type;
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">{t("documents.title")}</h3>
        <div className="space-y-2">
          {application.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{resolveLabel(doc)}</p>
                  {doc.name && <p className="text-xs text-gray-500">{doc.name}</p>}
                  {doc.uploadedDate && (
                    <p className="text-xs text-gray-400">
                      Uploaded: {new Date(doc.uploadedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={doc.status === "complete" ? "completed" : "scheduled"} />
                {doc.status === "complete" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setSelectedDocument(doc)} title="View document">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {doc.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(doc.url, "_blank")}
                        title="Download document"
                      >
                        <Download className="h-4 w-4" />
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
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </>
  );
}