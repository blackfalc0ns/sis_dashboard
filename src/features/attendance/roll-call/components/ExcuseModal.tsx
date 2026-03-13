"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileText, X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import AttendanceAttachmentPreviewModal from "@/features/attendance/shared/components/AttendanceAttachmentPreviewModal";
import { formatFileSize, getUploadRules } from "@/utils/upload/validateFile";
import type { AttachmentMeta } from "../types";

interface ExcuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: string, attachments: AttachmentMeta[]) => void;
  initialReason?: string;
  initialAttachments?: AttachmentMeta[];
  requireAttachment: boolean;
  isReadOnly: boolean;
}

export default function ExcuseModal({
  isOpen,
  onClose,
  onSave,
  initialReason = "",
  initialAttachments = [],
  requireAttachment,
  isReadOnly,
}: ExcuseModalProps) {
  const t = useTranslations("attendance.rollCall.excuse");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");

  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [errors, setErrors] = useState<{ reason?: string; attachments?: string }>({});
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);

  const rules = getUploadRules("ATTENDANCE_EXCUSE");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (isOpen) {
        setReason(initialReason);
        setAttachments(initialAttachments);
        setErrors({});
      } else {
        setReason("");
        setAttachments([]);
        setErrors({});
        setPreviewAttachment(null);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [initialAttachments, initialReason, isOpen]);

  const handleFilesSelected = (files: File[]) => {
    const newAttachments: AttachmentMeta[] = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    setErrors((prev) => ({ ...prev, attachments: undefined }));
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    const newErrors: { reason?: string; attachments?: string } = {};

    if (!reason.trim()) {
      newErrors.reason = t("requiredReason");
    }

    if (requireAttachment && attachments.length === 0) {
      newErrors.attachments = t("requiredAttachment");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(reason, attachments);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md" title={t("title")}>
        <div className="space-y-4">
          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {t("reason")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              disabled={isReadOnly}
              rows={4}
              style={{
                borderColor: errors.reason ? "var(--color-accent-500)" : "var(--color-border)",
                backgroundColor: isReadOnly ? "var(--color-neutral-50)" : "transparent",
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                isReadOnly ? "cursor-not-allowed" : ""
              }`}
              placeholder={t("reasonPlaceholder")}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {t("attachments")}
              {requireAttachment && <span className="text-red-500"> *</span>}
            </label>

            {!isReadOnly && (
              <DragDropUploadArea
                onFilesSelected={handleFilesSelected}
                uploadArea="ATTENDANCE_EXCUSE"
                helperText={`${tUpload(rules.acceptLabelKey)} - ${Math.round(rules.maxSizeBytes / (1024 * 1024))}MB`}
                multiple={true}
              />
            )}

            {errors.attachments && (
              <p className="mt-2 text-sm text-red-600">{errors.attachments}</p>
            )}

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      borderColor: "var(--color-border)",
                    }}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-start"
                    >
                      <FileText style={{ color: "var(--color-neutral-400)" }} className="w-5 h-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium truncate">
                          {att.name}
                        </p>
                        <p style={{ color: "var(--color-neutral-500)" }} className="text-xs">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        style={{ color: "var(--color-neutral-400)" }}
                        className="transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderColor: "var(--color-border)" }} className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          {!isReadOnly && (
            <Button variant="primary" onClick={handleSave}>
              {t("save")}
            </Button>
          )}
        </div>
      </Modal>

      <AttendanceAttachmentPreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
}

