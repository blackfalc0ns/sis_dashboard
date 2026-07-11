"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { formatFileSize } from "@/utils/upload/validateFile";
import { downloadFileBlob } from "@/services/filesService";
type PreviewAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
};

interface AttendanceAttachmentPreviewModalProps {
  attachment: PreviewAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AttendanceAttachmentPreviewModal({
  attachment,
  isOpen,
  onClose,
}: AttendanceAttachmentPreviewModalProps) {
  const t = useTranslations("attendance.shared");
  const tCommon = useTranslations("common");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [failedAttachmentId, setFailedAttachmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment?.id) {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    void downloadFileBlob(attachment.id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewAttachmentId(attachment.id);
        setFailedAttachmentId(null);
      })
      .catch(() => {
        if (active) setFailedAttachmentId(attachment.id);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment?.id]);

  const loading = Boolean(
    isOpen &&
      attachment?.id &&
      previewAttachmentId !== attachment.id &&
      failedAttachmentId !== attachment.id,
  );
  const loadFailed = attachment?.id === failedAttachmentId;

  const handleOpen = () => {
    const url = previewUrl || (!attachment?.id ? attachment?.url : undefined);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderContent = () => {
    if (!attachment) return null;

    if (loading) {
      return (
        <div className="flex min-h-48 items-center justify-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>{t("loadingPreview")}</span>
        </div>
      );
    }

    if (!previewUrl && (loadFailed || !attachment.url)) {
      return (
        <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: "var(--background-secondary, var(--color-neutral-50))" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("previewUnavailable")}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("previewUnavailableDescription")}
          </p>
          <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <div>{t("fileType")}: {attachment.type || "-"}</div>
            <div>{t("fileSize")}: {formatFileSize(attachment.size)}</div>
          </div>
        </div>
      );
    }

    const contentUrl = previewUrl || attachment.url;

    if (attachment.type === "application/pdf") {
      return (
        <div className="h-[70vh] rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
          <iframe src={contentUrl} title={attachment.name} className="w-full h-full border-0" />
        </div>
      );
    }

    if (attachment.type.startsWith("image/")) {
      return (
        <div className="h-[70vh] rounded-xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background)" }}>
          {/* Authenticated blob URLs must be rendered as images, not object plugins. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={contentUrl} alt={attachment.name} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4 rounded-xl" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("previewUnavailable")}</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("openInNewTab")}</p>
        <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />} onClick={handleOpen}>
          {tCommon("open")}
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={attachment?.name || t("previewAttachment")}
      size="xl"
      footer={previewUrl || (!attachment?.id && attachment?.url) ? (
        <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />} onClick={handleOpen}>
          {tCommon("open")}
        </Button>
      ) : undefined}
    >
      {renderContent()}
    </Modal>
  );
}
