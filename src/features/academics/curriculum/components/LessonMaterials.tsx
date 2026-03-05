"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Stack,
  Typography,
  List,
  Skeleton,
  Snackbar,
  Alert,
  Box,
  LinearProgress,
} from "@mui/material";
import {
  Link as LinkIcon,
  FileText,
  File,
  Image as ImageIcon,
  Trash2,
  Eye,
  FileIcon,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import AttachmentListItem from "@/components/ui/attachment-list-item/AttachmentListItem";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import { validateHttpUrl, normalizeUrl, getUrlErrorKey } from "@/utils/validation/url";
import {
  getUploadRules,
  formatFileSize as formatUploadFileSize,
  getAllowedTypesKey,
} from "@/utils/upload/validateFile";
import {
  LessonAttachment,
  fetchLessonAttachments,
  uploadLessonAttachmentFile,
  createLessonAttachmentLink,
  deleteAttachment,
} from "@/features/academics/curriculum/services/curriculumService";

interface LessonMaterialsProps {
  lessonId: string;
  isReadOnly: boolean;
}

const UPLOAD_AREA = "MATERIALS" as const;

export default function LessonMaterials({ lessonId, isReadOnly }: LessonMaterialsProps) {
  const t = useTranslations("academics.curriculum.materials");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tSuccess = useTranslations("success");
  const tValidation = useTranslations("validation");
  const tUpload = useTranslations("upload");

  const uploadRules = getUploadRules(UPLOAD_AREA);
  const allowedTypesKey = getAllowedTypesKey(UPLOAD_AREA);

  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<LessonAttachment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<LessonAttachment | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchLessonAttachments(lessonId);
        setAttachments(data);
      } catch (error) {
        console.error("Failed to load attachments:", error);
        showSnackbar(tErrors("load_failed"), "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lessonId, tErrors]);

  const loadAttachments = async () => {
    try {
      const data = await fetchLessonAttachments(lessonId);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to load attachments:", error);
      showSnackbar(tErrors("load_failed"), "error");
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    setUploading(true);
    let hasError = false;

    for (const file of files) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[file.name] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [file.name]: current + 10 };
          });
        }, 100);

        await uploadLessonAttachmentFile(lessonId, file);
        
        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1000);
      } catch (error) {
        console.error("Upload failed:", error);
        showSnackbar(`${file.name}: ${tErrors("upload_failed")}`, "error");
        hasError = true;
      }
    }

    setUploading(false);
    await loadAttachments();
    
    if (!hasError) {
      showSnackbar(tSuccess("uploaded"), "success");
    }
  };

  const validateLinkForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!linkTitle.trim()) {
      errors.title = t("title_required");
    }

    if (!linkUrl.trim()) {
      errors.url = tValidation("urlRequired");
    } else {
      const urlValidation = validateHttpUrl(linkUrl);
      if (!urlValidation.ok) {
        errors.url = tValidation(getUrlErrorKey(urlValidation.reason).replace('validation.', ''));
      }
    }

    setLinkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddLink = async () => {
    if (!validateLinkForm()) return;

    try {
      const urlValidation = validateHttpUrl(linkUrl);
      await createLessonAttachmentLink(lessonId, {
        title: linkTitle.trim(),
        url: urlValidation.normalized || linkUrl.trim(),
      });
      await loadAttachments();
      setLinkDialogOpen(false);
      setLinkTitle("");
      setLinkUrl("");
      setLinkErrors({});
      showSnackbar(tSuccess("link_added"), "success");
    } catch (error) {
      console.error("Failed to add link:", error);
      showSnackbar(tErrors("save_failed"), "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!attachmentToDelete) return;

    setDeleting(true);
    try {
      await deleteAttachment(attachmentToDelete.id);
      await loadAttachments();
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
      showSnackbar(tSuccess("deleted"), "success");
    } catch (error) {
      console.error("Failed to delete:", error);
      showSnackbar(tErrors("delete_failed"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = (attachment: LessonAttachment) => {
    if (attachment.type === "LINK") {
      window.open(attachment.url, "_blank", "noopener,noreferrer");
    } else if (attachment.mimeType === "application/pdf") {
      setPreviewAttachment(attachment);
      setPreviewDialogOpen(true);
    } else {
      window.open(attachment.url, "_blank");
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const getFileIcon = (attachment: LessonAttachment) => {
    if (attachment.type === "LINK") {
      return <LinkIcon className="w-5 h-5 text-blue-500" />;
    }

    const mimeType = attachment.mimeType || "";
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-green-500" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSecondaryText = (attachment: LessonAttachment) => {
    const parts: string[] = [];
    
    if (attachment.type === "FILE") {
      if (attachment.fileName) parts.push(attachment.fileName);
      if (attachment.size) parts.push(formatFileSize(attachment.size));
    } else {
      try {
        const url = new URL(attachment.url);
        parts.push(url.hostname);
      } catch {
        parts.push(attachment.url);
      }
    }
    
    return parts.join(" • ");
  };

  return (
    <>
      <Stack spacing={2}>
        {isReadOnly && (
          <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
            {t("readonly_message")}
          </Alert>
        )}

        {Object.keys(uploadProgress).length > 0 && (
          <Box>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {fileName}
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </Box>
        )}

        {loading ? (
          <Stack spacing={1}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} />
            ))}
          </Stack>
        ) : attachments.length === 0 ? (
          <>
            {/* Primary dropzone when no attachments */}
            {!isReadOnly && (
              <DragDropUploadArea
                title={tUpload("dragHereTitle")}
                subtitle={tUpload("dragHereSubtitle")}
                buttonLabel={tUpload("uploadFiles")}
                onFilesSelected={handleFilesSelected}
                isUploading={uploading}
                disabled={isReadOnly}
                multiple
                uploadArea={UPLOAD_AREA}
                helperText={
                  isReadOnly
                    ? tUpload("termClosed")
                    : tUpload("allowedHint", {
                        types: tUpload(allowedTypesKey),
                        size: formatUploadFileSize(uploadRules.maxSizeBytes),
                      })
                }
              />
            )}
            {!isReadOnly && (
              <Box display="flex" justifyContent="center">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<LinkIcon className="w-4 h-4" />}
                  onClick={() => setLinkDialogOpen(true)}
                >
                  {t("add_link")}
                </Button>
              </Box>
            )}
            {isReadOnly && (
              <EmptyState
                icon={<FileIcon className="w-12 h-12" />}
                message={t("no_materials")}
              />
            )}
          </>
        ) : (
          <>
            {/* Compact dropzone above list when attachments exist */}
            {!isReadOnly && (
              <Box>
                <DragDropUploadArea
                  title={tUpload("dragHereTitle")}
                  subtitle={tUpload("dragHereSubtitle")}
                  onFilesSelected={handleFilesSelected}
                  isUploading={uploading}
                  disabled={isReadOnly}
                  multiple
                  uploadArea={UPLOAD_AREA}
                  showButton={false}
                />
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<LinkIcon className="w-4 h-4" />}
                    onClick={() => setLinkDialogOpen(true)}
                  >
                    {t("add_link")}
                  </Button>
                </Box>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {tUpload("allowedHint", {
                    types: tUpload(allowedTypesKey),
                    size: formatUploadFileSize(uploadRules.maxSizeBytes),
                  })}
                </div>
              </Box>
            )}
            <List sx={{ p: 0 }}>
              {attachments.map((attachment) => (
                <AttachmentListItem
                  key={attachment.id}
                  icon={getFileIcon(attachment)}
                  title={attachment.title}
                  subtitle={getSecondaryText(attachment)}
                  onClick={() => handlePreview(attachment)}
                  actions={[
                    {
                      label: attachment.type === "LINK" ? tCommon("open") : tCommon("preview"),
                      icon: <Eye className="w-4 h-4" />,
                      onClick: () => handlePreview(attachment),
                    },
                    {
                      label: tCommon("delete"),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: () => {
                        setAttachmentToDelete(attachment);
                        setDeleteDialogOpen(true);
                      },
                      color: "error",
                      hidden: isReadOnly,
                    },
                  ]}
                />
              ))}
            </List>
          </>
        )}
      </Stack>

      {/* Add Link Dialog */}
      <Modal
        isOpen={linkDialogOpen}
        onClose={() => {
          setLinkDialogOpen(false);
          setLinkTitle("");
          setLinkUrl("");
          setLinkErrors({});
        }}
        title={t("add_link")}
        size="md"
        footer={
          <>
            <Button
              onClick={() => {
                setLinkDialogOpen(false);
                setLinkTitle("");
                setLinkUrl("");
                setLinkErrors({});
              }}
              variant="secondary"
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleAddLink} variant="primary">
              {tCommon("add")}
            </Button>
          </>
        }
      >
        <Stack spacing={3}>
          <Input
            label={t("link_title")}
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            required
            error={linkErrors.title}
          />
          <Input
            label={t("link_url")}
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { url, ...rest } = linkErrors;
              setLinkErrors(rest);
            }}
            onBlur={() => {
              const normalized = normalizeUrl(linkUrl);
              if (normalized !== linkUrl) {
                setLinkUrl(normalized);
              }
            }}
            required
            placeholder="https://example.com"
            error={linkErrors.url}
          />
        </Stack>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setAttachmentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t("remove_material")}
        description={t("remove_material_confirm")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        loading={deleting}
        severity="danger"
      />

      {/* Preview Dialog */}
      <Modal
        isOpen={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewAttachment(null);
        }}
        title={previewAttachment?.title}
        size="xl"
        showCloseButton
      >
        {previewAttachment && (
          <Box sx={{ height: "70vh" }}>
            <iframe
              src={previewAttachment.url}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title={previewAttachment.title}
            />
          </Box>
        )}
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
