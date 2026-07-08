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
  acceptApplicationDocument,
  fetchApplicationDocuments,
  rejectApplicationDocument,
  requestApplicationDocumentReplacement,
  uploadAdmissionsFile,
  createApplicationDocument,
  deleteApplicationDocument,
} from "@/features/admissions/applications/services/applicationDocumentsApiService";
import { fetchAdmissionsDocumentRequirements } from "@/features/settings/services/settingsService";
import type { AdmissionsRequiredDocumentConfig } from "@/features/settings/types";
import { isApiError } from "@/lib/api-error";
import { useToast } from "@/components/ui/toast/Toast";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { downloadFileBlob } from "@/services/filesService";

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
  initialDocuments?: Document[];
}

type ReviewAction = "accept" | "reject" | "request_replacement";

function documentReviewErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Failed to update document review.";
  }

  if (error.status === 403) {
    return "You do not have permission to review this document.";
  }
  if (error.status === 404) {
    return "This application or document could not be found.";
  }
  if (error.status === 409) {
    return "This document has already been reviewed or is no longer pending review.";
  }
  if (error.status === 422) {
    return "Please check the review note and try again.";
  }

  return error.message || "Failed to update document review.";
}

function documentLoadErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Failed to load documents.";
  }

  if (error.status === 403) {
    return "You do not have permission to view these documents.";
  }
  if (error.status === 404) {
    return "This application could not be found.";
  }

  return error.message || "Failed to load documents.";
}

function documentMutationErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) {
    return fallback;
  }

  if (error.status === 403) {
    return "You do not have permission to manage documents.";
  }
  if (error.status === 404) {
    return "This application or document could not be found.";
  }
  if (error.status === 409) {
    return "This document changed status. Refresh and try again.";
  }
  if (error.status === 422) {
    return "Please check the document details and try again.";
  }

  return error.message || fallback;
}

export default function DocumentsTab({
  application,
  initialDocuments,
}: DocumentsTabProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewDocuments = hasPermission("admissions.documents.view");
  const canManageDocuments = hasPermission("admissions.documents.manage");
  const [documents, setDocuments] = useState<Document[]>(
    initialDocuments ?? application.documents,
  );
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
  const [documentRequirements, setDocumentRequirements] = useState<
    AdmissionsRequiredDocumentConfig[]
  >([]);
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(
    null,
  );
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const viewerUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditable =
    canManageDocuments &&
    ["documents_pending", "submitted", "under_review"].includes(application.status);

  const loadDocuments = useCallback(async () => {
    if (!canViewDocuments) return;
    setIsLoading(true);
    setError(null);
    try {
      const nextDocuments = await fetchApplicationDocuments(application.id);
      setDocuments(nextDocuments);
    } catch (loadError) {
      console.error("Failed to load application documents:", loadError);
      setError(documentLoadErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [application.id, canViewDocuments]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!canManageDocuments) return;
    let isMounted = true;

    async function loadDocumentRequirements() {
      try {
        const requirements = await fetchAdmissionsDocumentRequirements();
        if (isMounted) {
          setDocumentRequirements(
            requirements
              .filter((requirement) => requirement.active)
              .sort((first, second) => first.sortOrder - second.sortOrder),
          );
        }
      } catch (requirementsError) {
        console.error("Failed to load admissions document requirements:", requirementsError);
        if (isMounted) {
          setDocumentRequirements([]);
        }
      }
    }

    void loadDocumentRequirements();

    return () => {
      isMounted = false;
    };
  }, [canManageDocuments]);

  useEffect(() => {
    return () => {
      if (viewerUrlRef.current) URL.revokeObjectURL(viewerUrlRef.current);
    };
  }, []);

  const closeDocumentViewer = () => {
    setSelectedDocument(null);
    if (viewerUrlRef.current) {
      URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = null;
    }
  };

  const viewDocument = async (document: Document) => {
    if (!document.fileId || viewingDocumentId) return;
    setViewingDocumentId(document.id);
    try {
      const blob = await downloadFileBlob(document.fileId);
      const blobUrl = URL.createObjectURL(blob);
      if (viewerUrlRef.current) URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = blobUrl;
      setSelectedDocument({ ...document, url: blobUrl });
    } catch (viewError) {
      console.error("Failed to load document preview:", viewError);
      showToast("Failed to open document.", "error");
    } finally {
      setViewingDocumentId(null);
    }
  };

  const downloadDocument = async (document: Document) => {
    if (!document.fileId || downloadingDocumentId) return;
    setDownloadingDocumentId(document.id);
    try {
      const blob = await downloadFileBlob(document.fileId);
      const blobUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document.name || document.type;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      console.error("Failed to download document:", downloadError);
      showToast("Failed to download document.", "error");
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleAddClick = () => {
    if (!canManageDocuments) {
      showToast("You do not have permission to manage documents.", "error");
      return;
    }
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
    if (!canManageDocuments) {
      showToast("You do not have permission to manage documents.", "error");
      return;
    }

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
      showToast(
        documentMutationErrorMessage(uploadError, "Failed to upload document."),
        "error",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!canManageDocuments) {
      showToast("You do not have permission to manage documents.", "error");
      return;
    }

    if (!window.confirm("Remove this document link? This action cannot be undone.")) {
      return;
    }

    setDeletingDocumentId(documentId);
    try {
      await deleteApplicationDocument(application.id, documentId);
      showToast("Document removed.", "success");
      await loadDocuments();
    } catch (deleteError) {
      console.error("Failed to delete document:", deleteError);
      showToast(
        documentMutationErrorMessage(deleteError, "Failed to remove document."),
        "error",
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const openReviewModal = (documentId: string, action: ReviewAction) => {
    if (!canManageDocuments) {
      showToast("You do not have permission to manage documents.", "error");
      return;
    }
    setReviewingDocumentId(documentId);
    setReviewAction(action);
    setReviewNote("");
  };

  const resetReviewState = () => {
    setReviewingDocumentId(null);
    setReviewAction(null);
    setReviewNote("");
  };

  const closeReviewModal = () => {
    if (isSubmittingReview) return;
    resetReviewState();
  };

  const reviewActionTitle = () => {
    if (reviewAction === "accept") return "Accept document";
    if (reviewAction === "reject") return "Reject document";
    if (reviewAction === "request_replacement") return "Request replacement";
    return "Review document";
  };

  const reviewActionDescription = () => {
    if (reviewAction === "accept") {
      return "Add an optional note for this approval.";
    }
    if (reviewAction === "reject") {
      return "Enter the reason this document is being rejected.";
    }
    return "Enter what the applicant needs to replace or fix.";
  };

  const reviewActionRequiresNote =
    reviewAction === "reject" || reviewAction === "request_replacement";

  const runReviewAction = async (
    documentId: string,
    action: ReviewAction,
    note: string,
  ) => {
    if (action === "accept") {
      await acceptApplicationDocument(
        application.id,
        documentId,
        note || undefined,
      );
      return;
    }

    if (action === "reject") {
      await rejectApplicationDocument(application.id, documentId, note);
      return;
    }

    await requestApplicationDocumentReplacement(application.id, documentId, note);
  };

  const submitReviewAction = async () => {
    if (isSubmittingReview) return;
    if (!reviewingDocumentId || !reviewAction) return;
    if (!canManageDocuments) {
      showToast("You do not have permission to manage documents.", "error");
      return;
    }

    const trimmedNote = reviewNote.trim();
    if (reviewActionRequiresNote && !trimmedNote) {
      showToast("Please enter a note before submitting.", "error");
      return;
    }
    if (trimmedNote.length > 2000) {
      showToast("The review note must be 2,000 characters or fewer.", "error");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await runReviewAction(reviewingDocumentId, reviewAction, trimmedNote);
      showToast("Document review updated.", "success");
      resetReviewState();
      await loadDocuments();
    } catch (reviewError) {
      console.error("Failed to update document review:", reviewError);
      showToast(documentReviewErrorMessage(reviewError), "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const resolveLabel = (doc: Document) => {
    if (locale === "ar") return doc.labelAr || doc.type;
    return doc.labelEn || doc.type;
  };

  const usedTypes = new Set(documents.map((d) => d.type));
  const configuredTypeOptions = documentRequirements.map((requirement) => ({
    value: requirement.nameEn,
    label: locale === "ar" ? requirement.nameAr || requirement.nameEn : requirement.nameEn,
  }));
  const documentTypeOptions =
    configuredTypeOptions.length > 0
      ? configuredTypeOptions
      : DOCUMENT_TYPES.map((type) => ({ value: type, label: type }));

  if (!canViewDocuments) {
    return <AdmissionsAccessDenied />;
  }

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
              No documents have been submitted for this application yet.
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
                    <p className="mt-1 max-w-xl text-xs text-gray-500">
                      {doc.status === "pending_review"
                        ? t("documents.status_pending_review")
                        : doc.status === "complete"
                          ? t("documents.status_complete")
                          : t("documents.status_missing")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <StatusBadge status={doc.status} />
                  {isEditable && (doc.canReview ?? doc.status === "pending_review") && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => openReviewModal(doc.id, "accept")}
                        disabled={isSubmittingReview}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReviewModal(doc.id, "reject")}
                        disabled={isSubmittingReview}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openReviewModal(doc.id, "request_replacement")
                        }
                        disabled={isSubmittingReview}
                      >
                        Request replacement
                      </Button>
                    </div>
                  )}
                  {doc.status === "pending_review" && doc.canReview === false && doc.reviewEligibility ? (
                    <span className="text-xs text-amber-700" title={doc.reviewEligibility.reason}>
                      {doc.reviewEligibility.reason.replaceAll("_", " ")}
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void viewDocument(doc)}
                    disabled={!doc.fileId || viewingDocumentId !== null}
                    loading={viewingDocumentId === doc.id}
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canViewDocuments && doc.fileId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void downloadDocument(doc)}
                      disabled={downloadingDocumentId !== null}
                      loading={downloadingDocumentId === doc.id}
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
                      disabled={deletingDocumentId === doc.id}
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
            {documentTypeOptions.map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                } ${usedTypes.has(type.value) ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="documentType"
                  value={type.value}
                  checked={selectedType === type.value}
                  onChange={() => setSelectedType(type.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-900">{type.label}</span>
                {usedTypes.has(type.value) && (
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

      <Modal
        isOpen={Boolean(reviewingDocumentId && reviewAction)}
        onClose={closeReviewModal}
        title={reviewActionTitle()}
        size="sm"
        closeOnOverlayClick={!isSubmittingReview}
        closeOnEscape={!isSubmittingReview}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeReviewModal}
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitReviewAction()}
              loading={isSubmittingReview}
            >
              Submit review
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{reviewActionDescription()}</p>
          {reviewActionRequiresNote && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              The applicant may need to upload a new document after this action.
            </div>
          )}
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="document-review-note"
          >
            Note {reviewActionRequiresNote ? "" : "(optional)"}
          </label>
          <textarea
            id="document-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary"
            placeholder={
              reviewActionRequiresNote
                ? "Enter a note before submitting"
                : "Add a note"
            }
            disabled={isSubmittingReview}
            maxLength={2000}
          />
        </div>
      </Modal>

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={closeDocumentViewer}
        document={selectedDocument}
      />
    </>
  );
}
