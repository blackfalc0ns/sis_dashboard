"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download, Eye, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Application, Document } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import DocumentViewerModal from "../modals/DocumentViewerModal";
import {
  fetchApplicationDocuments,
  uploadAdmissionsFile,
  createApplicationDocument,
} from "@/features/admissions/applications/services/applicationDocumentsApiService";
import { apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

const DOCUMENT_TYPES = [
  "Birth Certificate",
  "Passport Copy",
  "Medical Report",
  "Previous School Certificate",
  "National ID",
  "Vaccination Record",
  "Report Card",
  "Transfer Certificate",
];

interface DocumentsTabProps {
  application: Application;
}

export default function DocumentsTab({ application }: DocumentsTabProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>(application.documents);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditable = application.status === "documents_pending";

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextDocuments = await fetchApplicationDocuments(application.id);
      setDocuments(nextDocuments);
    } catch (loadError) {
      console.error("Failed to load application documents:", loadError);
      setError("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  }, [application.id]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleAddClick = () => {
    setSelectedType("");
    setCustomType("");
    setIsTypeModalOpen(true);
  };

  const handleTypeConfirm = () => {
    const docType = selectedType === "__custom__" ? customType.trim() : selectedType;
    if (!docType) {
      showToast("Please select or enter a document type.", "error");
      return;
    }
    setIsTypeModalOpen(false);
    fileInputRef.current?.click();
  };

  const getResolvedType = () => {
    return selectedType === "__custom__" ? customType.trim() : selectedType;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast("Only PDF, JPG, and PNG files are allowed.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB.", "error");
      return;
    }

    const docType = getResolvedType();
    if (!docType) {
      showToast("Document type is missing.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const fileId = await uploadAdmissionsFile(file);
      await createApplicationDocument(application.id, {
        fileId,
        documentType: docType,
        status: "complete",
      });
      showToast("Document uploaded successfully.", "success");
      await loadDocuments();
    } catch (uploadError) {
      console.error("Failed to upload document:", uploadError);
      showToast("Failed to upload document.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiDelete(
        `/admissions/applications/${application.id}/documents/${documentId}`,
      );
      showToast("Document removed.", "success");
      await loadDocuments();
    } catch (deleteError) {
      console.error("Failed to delete document:", deleteError);
      showToast("Failed to remove document.", "error");
    }
  };

  const resolveLabel = (doc: Document) => {
    if (locale === "ar") return doc.labelAr || doc.type;
    return doc.labelEn || doc.type;
  };

  const usedTypes = new Set(documents.map((d) => d.type));

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {t("documents.title")}
          </h3>
          {isEditable && (
            <Button
              size="sm"
              onClick={handleAddClick}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-pulse" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isUploading ? t("documents.uploading") : t("documents.add")}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading documents...</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {documents.length === 0 && !isLoading ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {t("documents.no_documents")}
            </p>
            {isEditable && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddClick}
                className="mt-3"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("documents.upload_first")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {resolveLabel(doc)}
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
                    status={
                      doc.status === "complete" ? "completed" : "scheduled"
                    }
                  />
                  {doc.status === "complete" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDocument(doc)}
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
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
                  {isEditable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Remove document"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Type Selection Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title={t("documents.select_type")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>
              {t("documents.cancel")}
            </Button>
            <Button
              onClick={handleTypeConfirm}
              disabled={
                !selectedType ||
                (selectedType === "__custom__" && !customType.trim())
              }
            >
              {t("documents.choose_file")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {DOCUMENT_TYPES.map((type) => (
              <label
                key={type}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedType === type
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                } ${usedTypes.has(type) ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="documentType"
                  value={type}
                  checked={selectedType === type}
                  onChange={() => setSelectedType(type)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-900">{type}</span>
                {usedTypes.has(type) && (
                  <span className="ml-auto text-xs text-gray-400">
                    {t("documents.already_uploaded")}
                  </span>
                )}
              </label>
            ))}
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === "__custom__"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="documentType"
                value="__custom__"
                checked={selectedType === "__custom__"}
                onChange={() => setSelectedType("__custom__")}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-900">
                {t("documents.other_type")}
              </span>
            </label>
          </div>

          {selectedType === "__custom__" && (
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder={t("documents.enter_type")}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              autoFocus
            />
          )}
        </div>
      </Modal>

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </>
  );
}
