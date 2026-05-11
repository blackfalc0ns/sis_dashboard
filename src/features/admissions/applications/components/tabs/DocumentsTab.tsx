"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download, Eye, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Application } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import DocumentViewerModal from "../modals/DocumentViewerModal";
import { fetchApplicationDocuments } from "@/features/admissions/applications/services/applicationDocumentsApiService";

interface DocumentsTabProps {
  application: Application;
}

export default function DocumentsTab({ application }: DocumentsTabProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const [documents, setDocuments] = useState(application.documents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchApplicationDocuments(application.id)
      .then((nextDocuments) => {
        if (!cancelled) {
          setDocuments(nextDocuments);
        }
      })
      .catch((loadError) => {
        console.error("Failed to load application documents:", loadError);
        if (!cancelled) {
          setError("Failed to load documents.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [application.documents, application.id]);

  const resolveLabel = (doc: Application["documents"][number]) => {
    if (locale === "ar") return doc.labelAr || doc.type;
    return doc.labelEn || doc.type;
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">{t("documents.title")}</h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading documents...</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-2">
          {documents.map((doc) => (
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
